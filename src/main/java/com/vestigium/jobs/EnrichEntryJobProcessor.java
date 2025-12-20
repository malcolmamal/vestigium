package com.vestigium.jobs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestigium.enrich.EnrichmentParser;
import com.vestigium.enrich.PdfTextExtractor;
import com.vestigium.enrich.UrlContentFetcher;
import com.vestigium.llm.GeminiClient;
import com.vestigium.persistence.AttachmentRepository;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.persistence.TagRepository;
import com.vestigium.service.TagNormalizer;
import com.vestigium.storage.FileStorageService;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

@Component
public class EnrichEntryJobProcessor implements JobProcessor {

    private final EntryRepository entries;
    private final TagRepository tags;
    private final AttachmentRepository attachments;
    private final FileStorageService fileStorage;
    private final UrlContentFetcher urlFetcher;
    private final PdfTextExtractor pdfTextExtractor;
    private final GeminiClient gemini;
    private final EnrichmentParser enrichmentParser;
    private final ObjectMapper objectMapper;

    public EnrichEntryJobProcessor(
            EntryRepository entries,
            TagRepository tags,
            AttachmentRepository attachments,
            FileStorageService fileStorage,
            UrlContentFetcher urlFetcher,
            PdfTextExtractor pdfTextExtractor,
            GeminiClient gemini,
            EnrichmentParser enrichmentParser,
            ObjectMapper objectMapper
    ) {
        this.entries = entries;
        this.tags = tags;
        this.attachments = attachments;
        this.fileStorage = fileStorage;
        this.urlFetcher = urlFetcher;
        this.pdfTextExtractor = pdfTextExtractor;
        this.gemini = gemini;
        this.enrichmentParser = enrichmentParser;
        this.objectMapper = objectMapper;
    }

    @Override
    public String type() {
        return "ENRICH_ENTRY";
    }

    @Override
    public void process(com.vestigium.domain.Job job) throws Exception {
        var entry = entries.getById(job.entryId()).orElseThrow();
        var attachmentList = attachments.listForEntry(entry.id());

        boolean force = payloadForce(job.payloadJson());

        var images = new ArrayList<GeminiClient.InlineImage>();
        var contextText = new StringBuilder();
        contextText.append("URL: ").append(entry.url()).append("\n\n");

        if (!attachmentList.isEmpty()) {
            contextText.append("The user provided attachments. Use them to infer a good description and tags.\n");
            for (var a : attachmentList) {
                Resource res = fileStorage.loadAsResource(a.storagePath());
                if (!res.exists()) {
                    continue;
                }

                if ("PDF".equalsIgnoreCase(a.kind())) {
                    try (InputStream in = res.getInputStream()) {
                        var text = pdfTextExtractor.extractText(in, 15000);
                        contextText.append("\nPDF: ").append(a.originalName()).append("\n");
                        contextText.append(text).append("\n");
                    }
                } else if ("IMAGE".equalsIgnoreCase(a.kind())) {
                    var bytes = res.getContentAsByteArray();
                    images.add(new GeminiClient.InlineImage(a.mimeType(), bytes));
                    contextText.append("\nImage: ").append(a.originalName()).append(" (see attached image)\n");
                }
            }
        } else {
            var page = urlFetcher.fetchReadableText(entry.url());
            contextText.append("Fetched page content:\n");
            if (page.title() != null && !page.title().isBlank()) {
                contextText.append("Title: ").append(page.title()).append("\n");
            }
            if (page.metaDescription() != null && !page.metaDescription().isBlank()) {
                contextText.append("Meta description: ").append(page.metaDescription()).append("\n");
            }
            contextText.append("\nText:\n").append(page.text()).append("\n");
        }

        var prompt = buildPrompt(contextText.toString());
        var modelText = gemini.generateText(prompt, images);
        var enrichment = enrichmentParser.parseFromModelText(modelText);

        var newTitle = shouldUpdate(entry.title(), enrichment.title(), force) ? enrichment.title() : null;
        var newDescription = shouldUpdate(entry.description(), enrichment.description(), force) ? enrichment.description() : null;

        entries.updateCore(entry.id(), newTitle, newDescription, null);

        var normalizedTags = TagNormalizer.normalize(enrichment.tags());
        if (force || entry.tags() == null || entry.tags().isEmpty()) {
            entries.replaceTags(entry.id(), normalizedTags, tags);
        }
    }

    private boolean payloadForce(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return false;
        }
        try {
            JsonNode node = objectMapper.readTree(payloadJson);
            return node.path("force").asBoolean(false);
        } catch (Exception ignored) {
            return false;
        }
    }

    private static boolean shouldUpdate(String existing, String proposed, boolean force) {
        if (proposed == null || proposed.isBlank()) {
            return false;
        }
        if (force) {
            return true;
        }
        return existing == null || existing.isBlank();
    }

    private static String buildPrompt(String context) {
        return """
               You are helping build a personal repository of website links. Generate a concise, useful description and a small set of tags.

               Output MUST be a single JSON object (no markdown), with this exact shape:
               {
                 "title": "optional short title",
                 "description": "short paragraph, 1-4 sentences",
                 "tags": ["lowercase tag", "another tag"]
               }

               Tag rules:
               - keep tags short, lowercase, and specific
               - 3 to 8 tags
               - include topical tags when obvious (examples: youtube, music, news, politics, gaming, climate, coding, java)
               - include named-entity tags if clearly present (examples: asmongold, path of exile)

               Context:
               %s
               """.formatted(context);
    }
}



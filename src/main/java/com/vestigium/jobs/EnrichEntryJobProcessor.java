package com.vestigium.jobs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestigium.enrich.EnrichmentParser;
import com.vestigium.enrich.PdfTextExtractor;
import com.vestigium.enrich.ImdbMetadataFetcher;
import com.vestigium.enrich.UrlContentFetcher;
import com.vestigium.llm.GeminiClient;
import com.vestigium.persistence.AttachmentRepository;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.persistence.TagRepository;
import com.vestigium.service.TagNormalizer;
import com.vestigium.service.UrlTagger;
import com.vestigium.storage.FileStorageService;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashSet;
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
    private final ImdbMetadataFetcher imdb;
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
            ImdbMetadataFetcher imdb,
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
        this.imdb = imdb;
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

        // Site-specific extra metadata (best-effort).
        try {
            imdb.fetch(entry.url()).ifPresent(m -> {
                contextText.append("IMDb metadata:\n");
                if (m.datePublished() != null && !m.datePublished().isBlank()) {
                    contextText.append("- Release date: ").append(m.datePublished()).append("\n");
                }
                if (m.duration() != null && !m.duration().isBlank()) {
                    contextText.append("- Runtime: ").append(m.duration()).append("\n");
                }
                if (m.stars() != null && !m.stars().isEmpty()) {
                    var take = m.stars().stream().limit(5).toList();
                    contextText.append("- Stars: ").append(String.join(", ", take)).append("\n");
                }
                contextText.append("\n");
            });
        } catch (Exception ignored) {
            // ignore
        }

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
            UrlContentFetcher.PageContent page;
            try {
                page = urlFetcher.fetchReadableText(entry.url());
            } catch (Exception e) {
                // Some pages (or temporary test URLs) can fail; still allow LLM to work on URL-only context.
                page = new UrlContentFetcher.PageContent(null, null, "");
            }

            // Even without LLM, we can often fill missing title/description from HTML metadata.
            var metaTitle = page.title();
            var metaDesc = page.metaDescription();
            var metaUpdateTitle = shouldUpdate(entry.title(), metaTitle, force) ? metaTitle : null;
            var metaUpdateDesc = shouldUpdate(entry.description(), metaDesc, force) ? metaDesc : null;
            if (metaUpdateTitle != null || metaUpdateDesc != null) {
                entries.updateCore(entry.id(), metaUpdateTitle, metaUpdateDesc, null, null);
            }

            contextText.append("Fetched page content:\n");
            if (page.title() != null && !page.title().isBlank()) {
                contextText.append("Title: ").append(page.title()).append("\n");
            }
            if (page.metaDescription() != null && !page.metaDescription().isBlank()) {
                contextText.append("Meta description: ").append(page.metaDescription()).append("\n");
            }
            if (page.text() != null && !page.text().isBlank()) {
                contextText.append("\nText:\n").append(page.text()).append("\n");
            }
        }

        var prompt = buildPrompt(contextText.toString());
        var modelText = gemini.generateText(prompt, images);
        var enrichment = enrichmentParser.parseFromModelText(modelText);

        var newTitle = shouldUpdate(entry.title(), enrichment.title(), force) ? enrichment.title() : null;
        var newDescription = shouldUpdate(entry.description(), enrichment.description(), force) ? enrichment.description() : null;
        var newDetailedDescription = shouldUpdate(entry.detailedDescription(), enrichment.detailedDescription(), force)
                ? enrichment.detailedDescription()
                : null;

        entries.updateCore(entry.id(), newTitle, newDescription, newDetailedDescription, null);

        var normalizedTags = TagNormalizer.normalize(enrichment.tags());
        // Always keep obvious URL-derived tags (imdb/reddit/subreddit/etc) even when forcing an enrichment.
        normalizedTags = mergeTags(normalizedTags, UrlTagger.tagsForUrl(entry.url()));

        if (force || entry.tags() == null || entry.tags().isEmpty()) {
            entries.replaceTags(entry.id(), normalizedTags, tags);
        }
    }

    private static List<String> mergeTags(List<String> preferredFirst, List<String> appended) {
        var merged = new LinkedHashSet<String>();
        if (preferredFirst != null) {
            merged.addAll(preferredFirst);
        }
        if (appended != null) {
            merged.addAll(appended);
        }
        return TagNormalizer.normalize(new ArrayList<>(merged));
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
                 "description": "useful description, 2-8 sentences (can be 1-2 short paragraphs)",
                 "detailedDescription": "longer description with key details; can be multiple short paragraphs and/or bullet points",
                 "tags": ["lowercase tag", "another tag"]
               }

               Description rules:
               - be informative (what it is, why it matters, key entities)
               - aim for ~400-900 characters unless the page is very small

               Detailed description rules:
               - include any concrete facts you can extract (people, dates, runtime/length, notable attributes)
               - if nothing extra is known, you can repeat/expand the short description

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



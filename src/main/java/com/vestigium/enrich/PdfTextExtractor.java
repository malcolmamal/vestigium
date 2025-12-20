package com.vestigium.enrich;

import java.io.IOException;
import java.io.InputStream;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

@Component
public class PdfTextExtractor {

    public String extractText(InputStream in, int maxChars) throws IOException {
        byte[] bytes = in.readAllBytes();
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            var stripper = new PDFTextStripper();
            var text = stripper.getText(doc);
            if (text == null) {
                return "";
            }
            if (text.length() <= maxChars) {
                return text;
            }
            return text.substring(0, maxChars);
        }
    }
}



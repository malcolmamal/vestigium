package com.vestigium.thumb;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class ImageThumbs {

    private static final Logger log = LoggerFactory.getLogger(ImageThumbs.class);

    private ImageThumbs() {}

    public static byte[] toJpegThumbnail(byte[] imageBytes, int targetWidth) throws Exception {
        BufferedImage src = ImageIO.read(new ByteArrayInputStream(imageBytes));
        if (src == null) {
            String magic = "";
            if (imageBytes != null && imageBytes.length >= 4) {
                magic = String.format("%02X %02X %02X %02X", imageBytes[0], imageBytes[1], imageBytes[2], imageBytes[3]);
            }
            log.error("Failed to decode image. Size={} Magic=[{}]", (imageBytes == null ? 0 : imageBytes.length), magic);
            throw new IllegalArgumentException("Unsupported image format");
        }

        int width = src.getWidth();
        int height = src.getHeight();
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Invalid image");
        }

        int outW = Math.min(targetWidth, width);
        int outH = Math.max(1, (int) Math.round((double) height * outW / width));

        BufferedImage out = new BufferedImage(outW, outH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.drawImage(src, 0, 0, outW, outH, null);
        } finally {
            g.dispose();
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(out, "jpeg", baos);
        return baos.toByteArray();
    }
}



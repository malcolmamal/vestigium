package com.vestigium.thumb;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

public final class ImageThumbs {

    private ImageThumbs() {}

    public static byte[] toJpegThumbnail(byte[] imageBytes, int targetWidth) throws Exception {
        BufferedImage src = ImageIO.read(new ByteArrayInputStream(imageBytes));
        if (src == null) {
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



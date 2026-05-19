# Regnology Branding — CSS & Assets

Canonical Regnology Professional Services style guide for web UIs (apps, dashboards, forms). Extracted from the reveal.js presentation theme for reuse across projects.

## Contents

| File | Purpose |
|------|---------|
| `regnology-brand.css` | CSS custom properties (colors, fonts, spacing). Import first. |
| `regnology-base.css` | Base styles for body, headings, links, forms, buttons, optional footer bar. Imports brand variables and declares Regnology Sans font-face. |
| `regnology-web-chrome.css` | Reusable web UI chrome: top banner (logo), form cards, form-actions. Use for apps and forms. |
| `assets/` | Favicon, logo, fonts, icons. |

## Usage

1. Copy this `branding/` folder into your app’s static assets (e.g. `static/branding/` or `public/branding/`).
2. In your HTML, link the CSS files in order:

   ```html
   <link rel="stylesheet" href="/branding/regnology-brand.css" />
   <link rel="stylesheet" href="/branding/regnology-base.css" />
   <link rel="stylesheet" href="/branding/regnology-web-chrome.css" />
   ```

3. Set the page favicon:  
   `<link rel="icon" type="image/png" href="/branding/assets/favicon.png" />`
4. **Top banner (recommended for web UIs):** Fixed bar with logo top-left, matches Regnology portal pattern:

   ```html
   <body class="has-regnology-header">
     <header class="regnology-header-bar" role="banner">
       <img src="/branding/assets/Regnology-logo-negative-PNG.png" alt="Regnology" class="regnology-header-logo" />
     </header>
     <main>…</main>
   </body>
   ```
5. **Optional:** Footer bar and logo (use only if not using top banner):

   ```html
   <body class="has-regnology-footer">
     <main>…</main>
     <div class="regnology-footer-bar">
       <img src="/branding/assets/Regnology-logo-negative-PNG.png" alt="Regnology" class="regnology-footer-logo" />
     </div>
   </body>
   ```
6. **Form layout:** Use `.form-card`, `.form-card-title`, and `.form-actions` for grouped sections and submit area (see reference implementation).

## Assets

- **favicon.png** — Browser tab icon.
- **Regnology-logo-negative-PNG.png** — Logo for use on dark backgrounds (e.g. footer).
- **fonts/** — Regnology Sans (Regular, Italic, Medium, Medium Italic) in woff2 and ttf.
- **icons/** — SVG icons (analyze, architecture, quality, settings).

## Reveal.js

The presentation theme in `doctrine/templates/presentations/reveal-js/` imports `../../branding/regnology-brand.css` so the same variables drive both slides and standalone apps.

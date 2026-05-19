# Template: Regnology Reveal.js Presentation

This directory is the self-contained starting point for any Regnology Professional Services Reveal.js presentation. Copy the entire directory to start a new deck — no external dependencies required.

## Contents

```
reveal-js/
├── slides-template.md        ← Rename to slides.md; replace placeholder content
├── index.html                ← Reveal.js container; wire it to slides.md
├── theme/
│   ├── regnology-brand.css   ← Brand tokens (colors, fonts, spacing) — single source of truth
│   └── regnology.css         ← Full Reveal.js theme (imports regnology-brand.css)
└── assets/
    ├── background_main_slide.png
    ├── background_closing_slide.png
    ├── Regnology-logo-negative.png
    ├── Regnology-logo-negative-PNG.png
    ├── logo_small.png
    ├── favicon.png
    ├── fonts/                 ← Regnology Sans (woff2 + ttf)
    ├── icons/                 ← Regnology SVG icons
    └── images/                ← Add presentation-specific images here
```

## Usage

1. Copy this directory to `docs/presentations/<topic>/`.
2. Rename `slides-template.md` → `slides.md`.
3. Edit `slides.md` with your content (see style guide below).
4. Open `index.html` in a browser to preview.

For presentation-specific style overrides, create `theme/custom.css` and link it in `index.html`. Do **not** edit `regnology-brand.css` or `regnology.css` directly.

## CSS Architecture

```
regnology-brand.css   ← Brand tokens only — edit here for brand color changes
       ↑ @import
regnology.css         ← Component styles — do not hard-code colors here
```

## Diagramming

Complex slides should use Mermaid diagrams via **Diagram Daisy**. Apply the Regnology Mermaid theme from:

```
doctrine/templates/diagramming/themes/mermaid-regnology.md
```

## Related Doctrine

| Resource | Location |
|---|---|
| Approach | `doctrine/approaches/create-branded-slidedeck.md` |
| Tactic | `doctrine/tactics/create-branded-slidedeck.tactic.md` |
| Style Guide | `doctrine/styleguides/presentations/reveal-js-slide-deck.md` |
| Mermaid Theme | `doctrine/templates/diagramming/themes/mermaid-regnology.md` |

# Approach: Create a Branded Slidedeck

_Version: 1.0.0_

## Mental Model

A slide deck is a visual anchor for a narrative, not a comprehensive document. Content must be separated into a presentation layer (Reveal.js Markdown) and visual assets (Mermaid diagrams, branded CSS).

- **Clarity > Density:** Slides contain minimal text. Detailed explanations belong in speaker notes or a companion document.
- **Componentized Creation:** Content drafting, visual design, and diagramming are distinct phases handled by specialized agents.
- **Brand Alignment:** Every slide reflects Regnology Professional Services' tone (calm, precise, sincere) and visual identity.
- **Self-Contained Template:** New presentations start from `doctrine/templates/presentations/reveal-js/` with no external dependencies.

## Roles

| Agent | Responsibility |
|---|---|
| **Editor Eddy** (`writer-editor.agent.md`) | Narrative arc, slide structure, brevity, speaker notes, CSS class usage |
| **Diagram Daisy** (`diagrammer.agent.md`) | Translates concepts into branded Mermaid diagrams using the Regnology Mermaid theme |

## Creation Flow

1. **Copy the Template** — Duplicate `doctrine/templates/presentations/reveal-js/` into `docs/presentations/<topic>/`.
2. **Outline the Narrative** — Define the core message and main sections (H1) with supporting points (H2).
3. **Draft Content** — Write slide content and speaker notes, using the CSS classes from `regnology.css`.
4. **Identify Visual Opportunities** — Pinpoint slides where text can be replaced or enhanced by a diagram.
5. **Handoff to Diagram Daisy** — Provide Daisy with the concept and a reference to `doctrine/templates/diagramming/themes/mermaid-regnology.md`.
6. **Integrate & Refine** — Embed Daisy's Mermaid diagrams into the Reveal.js markdown.
7. **Final Review** — Validate against the slide deck style guide checklist.

## Repository Structure

Presentations use a `shared_assets/` pattern so that fonts, icons, logos, backgrounds, and brand CSS live in one place. Each presentation directory contains only `slides.md`, `index.html`, a thin CSS shim, and presentation-specific images.

See [Slidedeck Stanislav](../agents/slidedeck-stanislav.agent.md) § Repository Structure Convention for the canonical directory layout.

## CSS Architecture

```
regnology-brand.css   ← Brand tokens only (colors, fonts, spacing)
       ↑ @import
regnology.css         ← Reveal.js component styles (references brand tokens)
       ↑ linked in slides.md
```

Never hard-code brand colors in `regnology.css` or slide HTML. All changes to brand colors go in `regnology-brand.css`.

## Related

- **Tactic:** [`create-branded-slidedeck.tactic.md`](../tactics/create-branded-slidedeck.tactic.md)
- **Style Guide:** [`doctrine/styleguides/presentations/reveal-js-slide-deck.md`](../styleguides/presentations/reveal-js-slide-deck.md)
- **Template:** [`doctrine/templates/presentations/reveal-js/`](../templates/presentations/reveal-js/)
- **Diagram Theme:** [`doctrine/templates/diagramming/themes/mermaid-regnology.md`](../templates/diagramming/themes/mermaid-regnology.md)

# Style Guide: Reveal.js Slide Deck

_Version: 1.1.0_
_Applies to: `docs/presentations/*/slides.md`_

This guide defines standards and best practices for creating and editing Reveal.js markdown slide decks within Regnology Professional Services repositories.

## 1. Core Principles

- **Clarity Over Cleverness:** Messages must be immediately understandable. Avoid jargon unless standard within Regnology Professional Services.
- **Brevity:** Slides are visual aids, not documents. Use bullet points and short sentences. Detailed explanations belong in `Notes:`.
- **One Idea Per Slide:** If a concept requires multiple points, use vertical slides (`--`) to break it down.

## 2. Structure & Formatting

- **Slide Dividers:**
  - `---` — horizontal transition (new main topic)
  - `--` — vertical transition (sub-topic or continuation)
- **Titles:**
  - Every slide must have a title.
  - Main section dividers use `# H1`.
  - Content slides use `## H2`.
- **Speaker Notes:** Every content slide must include `Notes:` at the bottom.

## 3. Regnology Branding & Tone

- **Tone:** Professional, calm, precise, sincere. No hype or exaggerated claims.
- **CSS Classes:** Use the provided Regnology CSS classes to emphasize key points without breaking brand guidelines. Common classes:
  - `info-box` / `info-box box-gold` — feature or concept cards
  - `three-columns` / `columns` — multi-column layouts
  - `solution-box sb-green` / `solution-box sb-gold` — solution/highlight boxes
  - `regnology-cover-slide` — title and closing slides
- **Terminology:** Capitalize correctly: "Agentic AI", "Doctrine Stack", "Professional Services".
- **Brand Colors:** Defined as CSS custom properties in `theme/regnology-brand.css`. Never hard-code colors in slides or custom CSS.

## 4. CSS Architecture

```
regnology-brand.css   ← Brand tokens only (colors, fonts, spacing) — single source of truth
       ↑ @import
regnology.css         ← All Reveal.js component styles
```

For presentation-specific overrides, add `theme/custom.css`. Do not modify `regnology-brand.css` or `regnology.css` in the presentation directory.

## 5. Diagrams (Diagram Daisy Handoff)

- Prefer Mermaid diagrams over static images for architecture, workflows, and process flows.
- When a slide requires a complex diagram, Editor Eddy should:
  1. Mark the slide with a placeholder comment: `<!-- DIAGRAM: [description] — handoff to Diagram Daisy -->`
  2. Prompt Diagram Daisy with the concept, desired orientation (TD / LR), and a reference to the Mermaid style guide at `doctrine/styleguides/diagramming/mermaid.md`.
- Diagram Daisy must apply the `classDef` Regnology brand block to every diagram.
- Maximum 10 nodes per diagram. Split larger flows into sub-diagrams.

## 6. Markdown Specifics

- **Code Blocks:** Use standard markdown code blocks. Keep them concise and relevant.
- **Images:** Always use relative paths to the `assets/` directory (e.g., `assets/image.png`).
- **HTML/CSS:** Use inline HTML sparingly, only when standard markdown cannot achieve the required layout.

## 7. Review Checklist

Before finalising a presentation:
- [ ] All slides have titles.
- [ ] No slide exceeds 6 bullet points or 40 words of main body text.
- [ ] `Notes:` present on every content slide.
- [ ] `---` and `--` transitions are used correctly.
- [ ] Regnology tone is maintained throughout.
- [ ] Diagrams use the Regnology Mermaid theme and render correctly.
- [ ] All asset paths are relative.
- [ ] Brand colors are not hard-coded (all via CSS custom properties).

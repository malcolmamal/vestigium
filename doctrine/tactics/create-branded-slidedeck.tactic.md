# Tactic: Create a Branded Slidedeck

**Invoked by:**
- Approach: [`create-branded-slidedeck.md`](../approaches/create-branded-slidedeck.md)

**Related:**
- Style Guide: [`doctrine/styleguides/presentations/reveal-js-slide-deck.md`](../styleguides/presentations/reveal-js-slide-deck.md)
- Template: [`doctrine/templates/presentations/reveal-js/`](../templates/presentations/reveal-js/)
- Diagram Theme: [`doctrine/templates/diagramming/themes/mermaid-regnology.md`](../templates/diagramming/themes/mermaid-regnology.md)
- Agents: `writer-editor.agent.md`, `diagrammer.agent.md`

---

## Preconditions

- Target audience and core message are defined.
- Style guide is loaded.
- `doctrine/templates/presentations/reveal-js/` is accessible.

## Steps

### 1. Initialize from Template

Copy `doctrine/templates/presentations/reveal-js/` to `docs/presentations/<topic>/`.

```
cp -r doctrine/templates/presentations/reveal-js/ docs/presentations/<topic>/
mv docs/presentations/<topic>/slides-template.md docs/presentations/<topic>/slides.md
```

Do not modify `regnology-brand.css` or `regnology.css` for per-presentation styling. Add `theme/custom.css` for presentation-specific overrides only.

### 2. Outline & Structure

Replace the placeholder H1 sections and H2 slide titles with the real content structure:
- `---` for horizontal transitions (new main topic).
- `--` for vertical transitions (sub-topics / continuations).
- Every slide must have a title.

### 3. Draft Content

Populate slides per the style guide constraints:
- Max 6 bullet points per slide.
- Max 40 words of main body text.
- `Notes:` speaker notes on every content slide.
- Use Regnology CSS classes: `info-box`, `info-box box-gold`, `solution-box sb-green`, `three-columns`, `columns`, etc.

### 4. Identify Diagram Needs

Replace text-heavy processes, architectures, or comparisons with a placeholder comment:

```markdown
<!-- DIAGRAM: [describe what needs to be visualised] — handoff to Diagram Daisy -->
```

### 5. Handoff to Diagram Daisy

For each placeholder, prompt Diagram Daisy using this template:

> "Diagram Daisy, please create a Mermaid diagram for **[Topic]**.
> It should illustrate **[Key Concept / Flow]**.
> Use the Regnology Mermaid theme from `doctrine/templates/diagramming/themes/mermaid-regnology.md`.
> Orientation: **[TD / LR]**. Max 10 nodes. Keep it clean.
> Context: **[Brief description of the process or system]**."

### 6. Integrate Daisy's Output

- Review the Mermaid code for clarity and brand alignment.
- Replace the `<!-- DIAGRAM: ... -->` placeholder with the Mermaid code block.
- Confirm the `classDef` Regnology brand block is present at the top of every diagram.

### 7. Final Review (Editor Eddy Checklist)

- [ ] All slides have titles.
- [ ] No slide exceeds 6 bullet points or 40 words of main text.
- [ ] `Notes:` present on every content slide.
- [ ] Transitions (`---` / `--`) are used correctly.
- [ ] Regnology tone is maintained throughout.
- [ ] Diagrams use the Regnology Mermaid theme.
- [ ] All asset paths are relative (e.g., `assets/image.png`).

### 8. Commit

```
writer-editor: presentations/<topic> - create branded slidedeck
```

## Exit Criteria

- `slides.md` renders without errors in Reveal.js.
- All slides pass the final review checklist.
- Committed to the repository.

## Failure Modes

| Failure | Recovery |
|---|---|
| Diagram renders with wrong colors | Verify `classDef` block is present and `%%%{init}%%%` overrides are absent |
| Text overflows slide | Split into vertical sub-slides using `--` |
| Font missing | Check `@font-face` paths in `regnology.css` point to `../assets/fonts/` |

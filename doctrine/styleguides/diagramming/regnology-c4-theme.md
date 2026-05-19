# Regnology C4 Mermaid Theme

_Version: 2.0.0_
_Last updated: 2026-03-17_
_Author: Diagram Daisy_

---

## Purpose

Centralised Mermaid configuration for C4 diagrams, applying Regnology brand colours.
The theme lives in a single JSON file within the doctrine. Individual `.mermaid` files stay clean — no inline `%%init%%` blocks.

## Files in This Directory

| File | Role |
|---|---|
| `regnology-c4.config.json` | Mermaid theme config (single source of truth) |
| `render-c4.sh` | Render script — injects the theme and calls `mmdc` |
| `regnology-c4-theme.md` | This documentation |

## Rendering

The render script reads `regnology-c4.config.json`, converts it to a `%%init%%` directive, prepends it to a temp copy of each diagram, and pipes that to `mmdc`. Source files are never modified.

From any repository that consumes the doctrine via symlink:

```bash
# All C4 diagrams (scans docs/diagrams/ by default)
doctrine/styleguides/diagramming/render-c4.sh

# Custom paths
doctrine/styleguides/diagramming/render-c4.sh -d src/diagrams -o build/svg

# Single file
doctrine/styleguides/diagramming/render-c4.sh docs/diagrams/c4_level0_system_landscape.mermaid
```

Output lands as SVG in `output/diagrams/` (or the directory specified with `-o`).

Requirements: `bash` ≥ 4, `jq`, `mmdc` (mermaid-cli).

### Live preview (Mermaid Live Editor)

The live editor at [mermaid.live](https://mermaid.live) does not support config files. For quick preview, temporarily paste this `%%init%%` block at the top of the diagram source:

```
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#06A74E", "lineColor": "#747A7A", "textColor": "#000000"}, "c4": {"system_bg_color": "#06A74E", "system_border_color": "#06A74E", "external_system_bg_color": "#1788BE", "external_system_border_color": "#1788BE", "container_bg_color": "#012D3F", "container_border_color": "#012D3F", "external_container_bg_color": "#747A7A", "external_container_border_color": "#747A7A", "boundaryFontColor": "#012D3F"}}}%%
```

Do **not** commit this into `.mermaid` files — it is only for ad-hoc preview.

## Colour Mapping

| C4 Element | Regnology Colour | Hex | Rationale |
|---|---|---|---|
| Person (internal) | _(Mermaid default)_ | — | Left unstyled — the C4 Person shape has a built-in icon with its own coloured background; overriding creates a double-colour effect |
| Person (external) | _(Mermaid default)_ | — | Same as above |
| System (internal) | Regnology green dark | `#06A74E` | Primary brand — PS-owned domain systems |
| System (external) | Ice blue | `#1788BE` | Accent — Regnology platform systems outside PS scope |
| Container (internal) | Petrol blue | `#012D3F` | Dark, authoritative — individual tools within a domain |
| Container (external) | Stone grey | `#747A7A` | Neutral — external containers |
| Relationship lines | Stone grey | `#747A7A` | Neutral — arrows and labels |
| Text on dark bg | Pure white | `#FFFFFF` | Contrast (Mermaid default on dark `_bg_color`) |
| Boundary label text | Petrol blue | `#012D3F` | Authoritative headings (font size left at Mermaid default) |

## Notes

- Person shapes are left at Mermaid defaults. The C4 Person block has a built-in icon with its own coloured circle; applying a custom `person_bg_color` creates an ugly double-colour effect.
- Mermaid C4 renders System and Container text as white on the background colour. Ensure all `_bg_color` values are dark enough for white text to read clearly.
- The `"theme": "base"` setting is required for `themeVariables` and `c4` overrides to take effect.
- Non-C4 diagrams (flowcharts, etc.) may use a different config file or their own `%%init%%` blocks — this config targets C4 diagrams only.

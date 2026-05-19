# Mermaid Diagram Theme — Regnology

_Version: 1.0.0_

Regnology brand colors expressed as Mermaid `classDef` declarations. Include this block at the top of every Mermaid diagram to ensure brand-consistent visuals.

## Brand Class Definitions

```mermaid
graph TD
    %% ── Regnology Brand Styling ──────────────────────────────────────
    classDef primary   fill:#012D3F,stroke:#011E2B,stroke-width:2px,color:#fff
    classDef secondary fill:#06A74E,stroke:#057A38,stroke-width:1px,color:#fff
    classDef accent    fill:#EC9D1C,stroke:#C07B00,stroke-width:2px,color:#333
    classDef neutral   fill:#F5F7F7,stroke:#E1E6E6,stroke-width:1px,color:#333
    classDef muted     fill:#ffffff,stroke:#747A7A,stroke-width:1px,color:#747A7A

    %% ── Example usage ────────────────────────────────────────────────
    A[Entry Point]:::primary
    B(Process Step):::secondary
    C(Supporting Step):::neutral
    D{Decision}:::accent
    E[Outcome A]:::secondary
    F[Outcome B]:::muted

    A --> B
    A --> C
    B --> D
    C --> D
    D -- Yes --> E
    D -- No --> F
```

## Class Reference

| Class | Fill | Usage |
|---|---|---|
| `primary` | Petrol blue `#012D3F` | Entry points, main entities, titles |
| `secondary` | Regnology green `#06A74E` | Process steps, positive outcomes |
| `accent` | Hay yellow `#EC9D1C` | Decisions, critical highlights, warnings |
| `neutral` | Ice grey `#F5F7F7` | Supporting steps, context nodes |
| `muted` | White `#ffffff` / stone text | Optional / inactive / out-of-scope nodes |

## Usage Instructions (for Diagram Daisy)

1. Copy the `classDef` block verbatim into every new diagram.
2. Apply classes using the `:::className` suffix on each node.
3. Keep orientation **TD** (top-down) for flows and **LR** (left-right) for pipelines.
4. Maximum 10 nodes per diagram. If more are needed, split into sub-diagrams.
5. Avoid crossing lines — reorganize node order to keep the layout clean.
6. Do not use Mermaid's built-in themes (`%%{init: ...}%%`) alongside these class definitions; they conflict.

## Handoff Note

When Editor Eddy identifies a slide that needs a diagram, the handoff prompt to Diagram Daisy should include:

> "Follow the Mermaid style guide at `doctrine/styleguides/diagramming/mermaid.md`. Apply the `classDef` block and assign classes to all nodes. For C4 diagrams, use the render script and theme from `doctrine/styleguides/diagramming/`."

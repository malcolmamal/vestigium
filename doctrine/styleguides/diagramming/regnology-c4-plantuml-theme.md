# Regnology C4 PlantUML Theme

_Version: 1.0.0_
_Last updated: 2026-03-17_
_Author: Diagram Daisy_

---

## Purpose

Reusable PlantUML include file that applies Regnology brand colours to all C4 diagrams.
Unlike the Mermaid variant, PlantUML supports native `!include`, so each diagram simply includes the theme file — no injection script needed.

## Files

| File | Role |
|---|---|
| `regnology-c4-theme.puml` | Include file — colour definitions + `UpdateElementStyle` overrides |
| `render-c4-plantuml.sh` | Batch render script (convenience, not required) |
| `regnology-c4-plantuml-theme.md` | This documentation |

## Usage

In any C4-PlantUML diagram, add the theme include **after** the C4 library includes:

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml
' Path is relative to the .puml file location — adjust depth as needed
!include ../../doctrine/styleguides/diagramming/regnology-c4-theme.puml

' ... diagram content ...
@enduml
```

PlantUML resolves `!include` relative to the source `.puml` file, not the working directory. Adjust the `../../` depth based on where your diagrams live relative to the repo root.

The theme uses `UpdateElementStyle` to override default C4 colours globally — no tags need to be applied to individual elements.

## Colour Mapping

| C4 Element | Regnology Colour | Hex | Rationale |
|---|---|---|---|
| Person (internal) | Petrol blue | `#012D3F` | Dark, authoritative — PS team members |
| Person (external) | Stone grey | `#747A7A` | Neutral — external actors |
| System (internal) | Regnology green dark | `#06A74E` | Primary brand — PS-owned domain systems |
| System (external) | Ice blue | `#1788BE` | Accent — platform systems outside PS scope |
| Container (internal) | Petrol blue | `#012D3F` | Authoritative — individual tools within a domain |
| Container (external) | Stone grey | `#747A7A` | Neutral — external containers |
| Relationship lines | Stone grey | `#747A7A` | Neutral — arrows |
| Relationship text | Pure black | `#000000` | Readable labels |
| Boundary border | Ice grey | `#E1E6E6` | Subtle boundary delineation |
| Boundary label | Petrol blue | `#012D3F` | Authoritative headings |
| Background | Pure white | `#FFFFFF` | Clean canvas |

### Difference from Mermaid theme

In PlantUML, Person shapes are fully styleable without the double-icon issue that Mermaid has, so persons **do** get the petrol blue background here.

## Rendering

```bash
# Via wrapper script (from any consuming repo)
doctrine/styleguides/diagramming/render-c4-plantuml.sh

# Or directly
plantuml -tsvg docs/diagrams/c4_level0_system_landscape.puml
```

## Available Colour Constants

The theme defines `!define` constants for use in custom elements:

| Constant | Hex |
|---|---|
| `REG_GREEN_DARK` | `#06A74E` |
| `REG_GREEN_LIGHT` | `#3CE55A` |
| `REG_PETROL` | `#012D3F` |
| `REG_ICE_BLUE` | `#1788BE` |
| `REG_HAY_YELLOW` | `#EC9D1C` |
| `REG_STONE_GREY` | `#747A7A` |
| `REG_SAND_GREY` | `#9FA8A9` |
| `REG_ICE_GREY` | `#E1E6E6` |
| `REG_BLACK` | `#000000` |
| `REG_WHITE` | `#FFFFFF` |

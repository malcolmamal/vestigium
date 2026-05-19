# Regnology Color Palette

Extracted from `word_document_branding_guide.pdf` (V2.4).

## Signature Colors

| Name                  | Hex       | Usage                                      |
|-----------------------|-----------|---------------------------------------------|
| Regnology green dark  | `#06A74E` | Primary brand color, accents, active states |
| Regnology green light | `#3CE55A` | Success indicators, positive states         |

## Secondary Colors

| Name        | Hex       | Usage                              |
|-------------|-----------|-------------------------------------|
| Petrol blue | `#012D3F` | Dark backgrounds, depth             |
| Hay yellow  | `#EC9D1C` | Warnings, attention, chart series 2 |
| Ice blue    | `#1788BE` | Links, info states, chart series 3  |

## Support Colors

| Name       | Hex       | Usage                         |
|------------|-----------|--------------------------------|
| Stone grey | `#747A7A` | Borders, dividers              |
| Sand grey  | `#9FA8A9` | Muted text, secondary labels   |
| Ice grey   | `#E1E6E6` | Light backgrounds, subtle fills |

## Neutrals

| Name       | Hex       | Usage              |
|------------|-----------|---------------------|
| Pure black | `#000000` | Text, high contrast |
| Pure white | `#FFFFFF` | Backgrounds, text   |

## Color Hierarchy

```
Signature  ██ #06A74E  ██ #3CE55A
Secondary  ██ #012D3F  ██ #EC9D1C  ██ #1788BE
Support    ██ #747A7A  ██ #9FA8A9  ██ #E1E6E6
Neutral    ██ #000000  ██ #FFFFFF
```

## Typography

- **Font family:** Regnology Sans
- **Weight emphasis:** Use Regnology Sans Medium for emphasis (never use "Bold")
- **Highlight:** Individual words may be highlighted with color (green)

## Dashboard CSS Variable Mapping

Applied in `src/llm_service/dashboard/static/dashboard.css`:

```css
:root {
    --primary-color: #06A74E;    /* Regnology green dark */
    --success-color: #3CE55A;    /* Regnology green light */
    --warning-color: #EC9D1C;    /* Hay yellow */
    --danger-color: #ef4444;     /* Standard red (not in brand palette) */
    --info-color: #1788BE;       /* Ice blue */
    --bg-primary: #012D3F;       /* Petrol blue */
    --bg-secondary: #01384F;     /* Lighter petrol (derived) */
    --bg-card: #024466;          /* Card surface (derived) */
    --text-primary: #FFFFFF;     /* Pure white */
    --text-secondary: #E1E6E6;   /* Ice grey */
    --text-muted: #9FA8A9;       /* Sand grey */
    --border-color: #747A7A;     /* Stone grey */
}
```

## Chart Color Series (per branding guide)

For bar/line charts, use in this order:
1. `#06A74E` — Regnology green dark
2. `#EC9D1C` — Hay yellow
3. `#012D3F` — Petrol blue

## Source

- PDF: `word_document_branding_guide.pdf` (in this directory)
- PowerPoint template: `PPT template V2.4 - compressed.potx` (see `/home/stijn/Documents/.REGNOLOGY/branding/`)

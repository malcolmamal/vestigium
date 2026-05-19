<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Creating Branded PDF Documents

A practical guide to generating Regnology-branded PDF documents from Markdown sources — for both
humans setting up the pipeline and agents executing the tactic.

---

## Overview

The branded PDF pipeline converts structured Markdown content into polished, print-ready PDF files
carrying the Regnology Professional Services visual identity: cover page, running header and footer,
brand colours, and typography.

**Typical use cases:** role descriptions, programme overviews, qualification documents, engagement
summaries, and any structured artefact that must leave the team looking consistent.

**Estimated setup time:** 15–20 minutes for a new project. Subsequent documents: author Markdown,
run one command.

---

## How It Works

The pipeline has three stages:

```
Markdown source files
        │
        ▼
  Markdown → HTML    (pandoc if on PATH; python-markdown fallback otherwise)
        │
        ▼
  HTML + CSS → PDF   (WeasyPrint — pure Python, no browser required)
        │
        ▼
    output/*.pdf
```

**No system binary is strictly required.** `pandoc` is used automatically when present and
produces slightly richer output (smart quotes, strikethrough). When absent, the pure-Python
`Markdown` package handles conversion. For the document types produced in Regnology PS engagements
the two converters produce equivalent results.

---

## Prerequisites

| Requirement | Install | Notes |
|---|---|---|
| Python 3.10+ | — | Already required by the framework |
| `weasyprint` | `pip install weasyprint` | PDF rendering engine |
| `Markdown` | `pip install Markdown` | Included in core deps; pure-Python fallback |
| `pandoc` | System package manager | **Optional.** Preferred for richer syntax support |
| Brand assets | See below | Logo files and cover photograph — not in this repo |

### Brand Asset Paths

The generator expects three image files relative to the project root:

```
resources/
├── logo_small.png       # Colour logo — used in page header
├── logo_negative.png    # White logo — used on dark cover page
└── cover_photo.jpeg     # Cover background photograph
```

These files are maintained in the `_local_admin` directory and are not committed to project
repositories. Copy them into your project's `resources/` directory before running the generator.

---

## Setting Up a New Project

### Step 1 — Copy the template

```bash
cp -r doctrine/templates/documents/pdf/ build/
cp doctrine/tools/scripts/generate_branded_pdf.py build/
```

The `build/` directory will contain everything the generator needs: HTML templates, CSS stylesheet,
example config, and the script itself.

### Step 2 — Create the configuration file

```bash
cp build/document-config.example.toml build/config.toml
```

Open `build/config.toml` and fill in the `[document]` section:

```toml
[document]
title          = "Your Document Title"
subtitle       = "Document Subtitle or Short Description"
author         = "Author Name"
author_title   = "Role / Job Title"
organisation   = "Regnology — Professional Services"
date           = "2026-01-01"
classification = "FOR INTERNAL USE ONLY"
version        = "DRAFT"
```

Then define one or more output variants. Each variant is a named list of Markdown section files
that will be assembled into one PDF:

```toml
[variants.full]
output   = "your-document-full.pdf"
sections = [
    "docs/overview.md",
    "docs/section-one.md",
    "docs/section-two.md",
    "docs/appendix.md",
]

[variants.summary]
output   = "your-document-summary.pdf"
sections = [
    "docs/overview.md",
    "docs/section-one.md",
]
```

### Step 3 — Install Python dependencies

If the project has a `pyproject.toml` with the framework as a dependency:

```bash
pip install -e .
```

Otherwise install directly:

```bash
pip install weasyprint Markdown   # tomli also needed on Python < 3.11
```

### Step 4 — Author your Markdown section files

Write one `.md` file per chapter or logical section. A few rules:

- Use standard CommonMark Markdown. GFM tables and fenced code blocks work out of the box.
- Keep image paths **relative to the Markdown file** that references them — the generator
  resolves them to absolute `file://` URLs automatically.
- Do **not** use remote image URLs. WeasyPrint cannot fetch them.
- Use `\newpage` for explicit page breaks where needed; the generator strips it cleanly.

### Step 5 — Generate the PDF

Build all variants defined in `config.toml`:

```bash
python build/generate_branded_pdf.py
```

Or, if the `generate-pdf` entry point is installed:

```bash
generate-pdf
```

Build a specific variant only:

```bash
generate-pdf --variant full
```

Override the output directory:

```bash
generate-pdf --output-dir /tmp/review
```

### Step 6 — Verify output

Open the generated PDF and confirm:

- Cover page shows correct title, subtitle, author, date, classification, and version.
- All images render — no broken placeholder boxes.
- Page header appears on every page after the cover; footer shows organisation and page number.
- Tables fit within page margins and break cleanly across pages.
- Regnology brand colours, fonts, and logo are consistent throughout.

### Step 7 — Commit

```
docs: <topic> - generate branded PDF document
```

---

## For Agents: Executing the Tactic

When asked to produce a branded PDF document, load and follow the canonical tactic:

```
doctrine/tactics/create-branded-pdf-document.tactic.md
```

The tactic is invoked by **Directive 041** (Use Regnology Branding). The steps above are a
human-readable mirror of the tactic's execution steps. The tactic is authoritative — if this
guide and the tactic diverge, the tactic wins.

**Quick agent checklist before starting:**

1. Is `build/config.toml` present and filled in? If not, create it from the example.
2. Are brand asset files in `resources/`? If not, stop and ask the human — these cannot be
   generated.
3. Are all referenced Markdown section files present?
4. Is `weasyprint` installed? (`python -c "import weasyprint"`)
5. Run the generator, capture stdout, and report any errors.

---

## Markdown Conversion: pandoc vs. python-markdown

The generator selects a Markdown converter at runtime:

| Condition | Converter used |
|---|---|
| `pandoc` found on `PATH` | pandoc (primary) |
| `pandoc` not on `PATH` | `python-markdown` (fallback) |

Both paths produce equivalent HTML5 output for the document types produced in Regnology PS
engagements. The known differences are:

| Feature | pandoc | python-markdown |
|---|---|---|
| GFM tables | ✅ | ✅ |
| Fenced code blocks | ✅ | ✅ |
| Footnotes | ✅ | ✅ |
| Smart quotes (`"hello"` → `"hello"`) | ✅ | ❌ (add `smarty` extension if needed) |
| Strikethrough `~~text~~` | ✅ | ❌ (not needed for PS document types) |

If your document uses strikethrough or relies on smart quote rendering, install pandoc. For
everything else, the fallback is sufficient.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: weasyprint` | WeasyPrint not installed | `pip install weasyprint` |
| `ModuleNotFoundError: markdown` | Markdown package missing | `pip install Markdown` |
| `ModuleNotFoundError: tomllib` / `tomli` | Python < 3.11 without tomli | `pip install tomli` |
| Images missing from PDF | Remote URL or wrong relative path | Use local files; paths relative to the `.md` file |
| Font renders as fallback sans-serif | Font path in `regnology-pdf.css` incorrect | Update `@font-face src:` paths to point to local `.ttf` files |
| Cover page blank or missing | Brand asset paths wrong | Verify `resources/` directory contains all three image files |
| Tables overflow margins | Columns too wide | Add `style="width:..."` to `<th>` elements, or split the table |
| `pandoc: command not found` | pandoc not installed | Not an error — fallback activates automatically. Install pandoc only for extended syntax. |

---

## Project Layout Reference

```
project-root/
├── build/
│   ├── config.toml                    # Document metadata + variant section lists
│   ├── cover-template.html            # Cover page HTML ({{variable}} placeholders)
│   ├── page-template.html             # Page header/footer HTML
│   ├── regnology-pdf.css              # Brand stylesheet
│   └── generate_branded_pdf.py        # Copied from doctrine/tools/scripts/
├── resources/
│   ├── logo_small.png
│   ├── logo_negative.png
│   └── cover_photo.jpeg
├── docs/                              # Markdown source sections
│   ├── overview.md
│   └── section-one.md
└── output/                            # Generated PDFs (gitignored)
```

---

## Related Resources

- **Tactic (authoritative):** [`doctrine/tactics/create-branded-pdf-document.tactic.md`](../../tactics/create-branded-pdf-document.tactic.md)
- **Template directory:** [`doctrine/templates/documents/pdf/`](../../templates/documents/pdf/)
- **Generator script:** [`doctrine/tools/scripts/generate_branded_pdf.py`](../../tools/scripts/generate_branded_pdf.py)
- **Script README:** [`doctrine/tools/scripts/README.md`](../../tools/scripts/README.md)
- **Directive 041 — Use Regnology Branding:** [`doctrine/directives/041_use_regnology_branding.md`](../../directives/041_use_regnology_branding.md)
- **Parallel workflow — slide decks:** [`doctrine/tactics/create-branded-slidedeck.tactic.md`](../../tactics/create-branded-slidedeck.tactic.md)

---

**Last updated:** 2026-03-26
**Maintained by:** Regnology Professional Services

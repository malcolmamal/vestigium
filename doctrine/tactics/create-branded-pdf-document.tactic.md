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

# Tactic: Create a Branded PDF Document

**Invoked by:**
- [Directive 041](../directives/041_use_regnology_branding.md) (Use Regnology Branding)

**Related:**
- Template: [`doctrine/templates/documents/pdf/`](../templates/documents/pdf/)
- Parallel tactic: [`doctrine/tactics/create-branded-slidedeck.tactic.md`](./create-branded-slidedeck.tactic.md)
- Canonical script: `doctrine/tools/scripts/generate_branded_pdf.py`

---

## Intent

Use this tactic when any Regnology PS repository needs to produce a branded PDF document from
Markdown sources — role descriptions, programme overviews, qualification documents, or any other
structured artefact that must carry consistent Regnology visual identity.

This tactic covers: initialising from the doctrine template, configuring metadata and section
lists, authoring Markdown content, and running the generator to produce one or more output PDFs.

---

## Preconditions

- `weasyprint` Python package is installed (`pip install weasyprint`).
- `Markdown` Python package is installed (`pip install Markdown`) — required when `pandoc` is not
  available. When `pandoc` **is** on `PATH`, the generator uses it automatically and `Markdown` is
  still required as an installed package (it is listed in the project dependencies).
- `pandoc` on `PATH` is **optional**. When present it is used as the primary Markdown-to-HTML
  converter. When absent, the pure-Python `Markdown` package is used as the fallback. Install
  pandoc from [https://pandoc.org/installing.html](https://pandoc.org/installing.html) if you
  prefer its extended syntax support (e.g. smart quotes, strikethrough).
- `doctrine/templates/documents/pdf/` is accessible in the doctrine stack.
- Document sections have been authored (or are ready to be authored) as individual Markdown files.
- All images and diagrams required by the document exist on local disk. WeasyPrint cannot fetch
  remote images — only `file://` URLs are supported.

**Do not use this tactic** for presentation decks — see
[`create-branded-slidedeck.tactic.md`](./create-branded-slidedeck.tactic.md) instead.

---

## Execution Steps

### 1. Initialise from Template

Copy the PDF template directory into the project `build/` directory:

```
cp -r doctrine/templates/documents/pdf/ <project>/build/
```

### 2. Create the Configuration File

Copy the example config and open it for editing:

```
cp build/document-config.example.toml build/document-config.toml
```

Fill in all fields in `document-config.toml`:
- `[document]` — title, subtitle, author, author_title, organisation, date, classification, version
- `[assets]` — absolute paths to logo, negative logo, and cover background image
- `[output]` — output directory (default: `output/`)
- `[variants.*]` — one named block per PDF variant, each with a filename and ordered section list

### 3. Install Python Dependencies

```bash
pip install -e .
```

If the project does not have a `pyproject.toml` with the `generate-pdf` entry point, install
directly:

```bash
pip install weasyprint Markdown tomli   # tomli only required on Python < 3.11
```

`pandoc` is **optional**. When present on `PATH` it is used automatically. When absent, the
pure-Python `Markdown` package handles conversion. For most Regnology PS document types the
two converters produce equivalent output.

### 4. Author Markdown Section Files

Write one Markdown file per chapter or logical section. Keep the following constraints:

- Use standard CommonMark Markdown.
- Image paths must be relative to the Markdown file that references them. The generator resolves
  them to absolute `file://` URLs automatically.
- Do not use remote image URLs — they will not render in the PDF.
- Use `\newpage` in Markdown for explicit page breaks if needed (the generator strips it cleanly).

### 5. Run the Generator — All Variants

```bash
generate-pdf
```

Or, if the entry point is not installed:

```bash
python build/generate_pdf.py
```

This builds every variant defined in `document-config.toml` and writes PDFs to the `output/`
directory.

### 6. Run the Generator — Specific Variant

```bash
generate-pdf --variant full
```

Replace `full` with the variant key defined in `document-config.toml`.

### 7. Verify Output

Open each generated PDF and confirm:

- Cover page renders with correct title, subtitle, author, date, classification, and version.
- All images are present (no broken image placeholders).
- Page header and footer appear on every page except the cover.
- Regnology branding (colours, fonts, logo) is consistent.
- Tables render without overflow; long tables break across pages cleanly.

### 8. Commit

```
docs: <topic> - generate branded PDF document
```

---

## Checks / Exit Criteria

- One or more PDF files exist in the `output/` directory.
- No WeasyPrint errors or warnings in the generator output.
- Cover page shows correct metadata from `document-config.toml`.
- All images in the document are present and correctly sized.
- Page header shows the document title; footer shows organisation and page number.

---

## Failure Modes

| Failure | Recovery |
|---|---|
| `pandoc: command not found` | Pandoc is optional — the generator falls back to the `Markdown` Python package automatically. Install pandoc only if you need its extended syntax (smart quotes, strikethrough). See https://pandoc.org/installing.html |
| Images missing from PDF | Ensure all image paths are relative to the Markdown file that references them and that the image files exist on disk |
| Font not rendering / fallback font used | Check `@font-face` declarations in `regnology-pdf.css` — the `src: url(...)` paths must point to the correct local font files |
| `ModuleNotFoundError: weasyprint` | Run `pip install weasyprint` |
| `ModuleNotFoundError: tomllib` or `tomli` | Run `pip install tomli` — required on Python < 3.11 |
| Cover page missing or blank | Verify `[assets]` paths in `document-config.toml` are absolute and the files exist |
| Tables overflow page margins | Adjust column widths via inline `style="width:..."` attributes on `<th>` elements, or split large tables |

---

## Outputs

- One branded PDF per variant defined in `document-config.toml`, written to `output/`.

---

## Notes

For the equivalent presentation workflow, see
[`create-branded-slidedeck.tactic.md`](./create-branded-slidedeck.tactic.md).

The canonical Python generator script is located at
`doctrine/tools/scripts/generate_branded_pdf.py`. This script is placed there during the
lift-and-shift phase of the doctrine tooling setup. Projects copy it into their own `build/`
directory and adapt it to their `document-config.toml` structure.

---

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

# PDF Document Template

This template provides everything needed to generate a branded Regnology PDF document from Markdown
sources. It is intended for role descriptions, programme overviews, qualification documents, and any
other structured documentation that requires consistent Regnology visual identity.

---

## Directory Structure

```
pdf/
├── README.md                      # This file
├── cover-template.html            # Cover page HTML fragment ({{variable}} placeholders)
├── page-template.html             # Repeating page header and footer HTML fragment
├── document-config.example.toml  # Example configuration — copy and fill in
└── regnology-pdf.css              # Regnology brand stylesheet for WeasyPrint
```

---

## Usage

### 1. Copy the template directory into your project

```bash
cp -r doctrine/templates/documents/pdf/ build/
```

### 2. Create your configuration file

```bash
cp build/document-config.example.toml build/document-config.toml
```

Edit `build/document-config.toml` and fill in:
- Document metadata (title, subtitle, author, date, classification, version)
- Asset paths (logo, negative logo, cover background image)
- Section file lists for each output variant

### 3. Install Python dependencies

```bash
pip install weasyprint Markdown tomli   # tomli only needed for Python < 3.11
# or, if the project has a pyproject.toml with the generate-pdf entry point:
pip install -e .
```

`pandoc` is **optional**. When present on `PATH` the generator uses it as the primary
Markdown-to-HTML converter. When absent, the pure-Python `Markdown` package is used
automatically as the fallback. Install pandoc from https://pandoc.org/installing.html only
if you need its extended syntax support (smart quotes, strikethrough).

### 4. Author your Markdown sections

Write one Markdown file per chapter or logical document section. Image paths must be relative to
the Markdown file that references them — WeasyPrint requires local `file://` URLs and cannot
resolve remote images.

### 5. Run the generator

```bash
# Build all variants
generate-pdf

# Or directly
python build/generate_pdf.py

# Build a specific variant
generate-pdf --variant full
```

### 6. Collect output

PDF files are written to `output/` in the project root.

---

## Dependencies

| Dependency   | Install method                                  | Notes                                                                 |
|--------------|------------------------------------------------|-----------------------------------------------------------------------|
| `weasyprint` | `pip install weasyprint`                       | Python PDF rendering engine                                           |
| `Markdown`   | `pip install Markdown`                         | Pure-Python Markdown converter; used when pandoc is not on PATH       |
| `pandoc`     | System package manager (apt, brew, winget, …)  | **Optional.** Used when on PATH; falls back to `Markdown` if absent  |
| `tomli`      | `pip install tomli`                            | Only required on Python < 3.11                                        |

---

## Script

The canonical generation script lives at `doctrine/tools/scripts/generate_branded_pdf.py`.
Copy or symlink it to your project's `build/` directory, or install it via `pip install -e .`
from the doctrine tools package.

```bash
# Copy script and stylesheet into your project build directory
cp doctrine/tools/scripts/generate_branded_pdf.py build/
cp doctrine/templates/documents/pdf/regnology-pdf.css build/
```

See [`doctrine/tools/scripts/README.md`](../../../tools/scripts/README.md) for full usage
instructions and dependency details.

---

## Related

- Tactic: [`doctrine/tactics/create-branded-pdf-document.tactic.md`](../../../tactics/create-branded-pdf-document.tactic.md)
- Canonical generator script: [`doctrine/tools/scripts/generate_branded_pdf.py`](../../../tools/scripts/generate_branded_pdf.py)

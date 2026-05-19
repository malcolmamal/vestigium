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

# doctrine/tools/scripts

Standalone scripts provided by the Regnology Agent Doctrine for use in Professional Services
project repositories.

---

## Available Scripts

### `generate_branded_pdf.py`

Generates a branded Regnology PDF from a set of Markdown source files using
[WeasyPrint](https://weasyprint.org/). Markdown-to-HTML conversion uses
[pandoc](https://pandoc.org/) when available on `PATH`, or the pure-Python
[Markdown](https://python-markdown.github.io/) package as a fallback.

**Usage:**

```bash
python generate_branded_pdf.py --config path/to/build/config.toml
python generate_branded_pdf.py --config build/config.toml --variant full
python generate_branded_pdf.py --output-dir /tmp/output
```

**How to adopt in a project:**

1. Copy `generate_branded_pdf.py` and `regnology-pdf.css` (from
   `doctrine/templates/documents/pdf/`) into your project's `build/` directory.
2. Create a `build/config.toml` describing your document variants. Use
   `doctrine/templates/documents/pdf/document-config.example.toml` as a starting point.
3. Place Markdown section files and resource images as referenced in your config.
4. Run the script or register it as a console script entry point in `pyproject.toml`.

**Related resources:**

- Template: [`doctrine/templates/documents/pdf/`](../../templates/documents/pdf/README.md)
- Tactic: [`doctrine/tactics/create-branded-pdf-document.tactic.md`](../../tactics/create-branded-pdf-document.tactic.md)

---

## Dependencies

| Dependency   | Install method                                 | Notes                                                                 |
|--------------|------------------------------------------------|-----------------------------------------------------------------------|
| `weasyprint` | `pip install weasyprint`                       | Python PDF rendering engine                                           |
| `Markdown`   | `pip install Markdown`                         | Pure-Python Markdown converter; used when pandoc is not on PATH       |
| `pandoc`     | System package manager (apt, brew, winget, …)  | **Optional.** Used when on PATH; falls back to `Markdown` if absent  |
| `tomli`      | `pip install tomli`                            | Only required on Python < 3.11                                        |

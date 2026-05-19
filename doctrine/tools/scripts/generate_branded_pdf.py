"""Generate branded PDF from Markdown sources using WeasyPrint.

Markdown conversion uses pandoc when available on PATH, falling back to the
pure-Python ``markdown`` package (``pip install Markdown``) when pandoc is not
installed.  Both paths produce equivalent HTML5 output for the document types
targeted by this tool.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import shutil
import subprocess

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore[no-redef]

import markdown as _md

_MD_EXTENSIONS = ["tables", "fenced_code", "attr_list", "footnotes", "toc"]


def _pandoc_available() -> bool:
    """Return True if pandoc is found on PATH."""
    return shutil.which("pandoc") is not None


def load_config(config_path: pathlib.Path) -> dict:
    """Load document configuration from a TOML file.

    Args:
        config_path: Path to the config TOML file.

    Returns:
        Parsed configuration dictionary.

    Raises:
        FileNotFoundError: If config_path does not exist.
    """
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    with config_path.open("rb") as f:
        return tomllib.load(f)


def load_template(template_path: pathlib.Path) -> str:
    """Load an HTML template file.

    Args:
        template_path: Path to the HTML template file.

    Returns:
        Template string with {{variable}} placeholders intact.

    Raises:
        FileNotFoundError: If template_path does not exist.
    """
    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")
    return template_path.read_text(encoding="utf-8")


def render_template(template: str, variables: dict[str, str]) -> str:
    """Substitute {{variable}} placeholders in a template string.

    Args:
        template: Template string containing {{key}} placeholders.
        variables: Mapping of placeholder names to replacement values.

    Returns:
        Rendered string with all known placeholders replaced.
    """
    result = template
    for key, value in variables.items():
        result = result.replace("{{" + key + "}}", value)
    return result


def make_cover_html(
    config: dict,
    logo_neg: pathlib.Path,
    cover_bg: pathlib.Path,
    template: str,
) -> str:
    """Render the cover page HTML from a template and document configuration.

    Args:
        config: Document configuration dictionary (from config.toml [document] table).
        logo_neg: Path to negative (white) logo image.
        cover_bg: Path to cover background image.
        template: Cover page HTML template string with {{variable}} placeholders.

    Returns:
        Rendered HTML string for the cover page.
    """
    doc = config["document"]
    return render_template(
        template,
        {
            "title": doc["title"],
            "subtitle": doc["subtitle"],
            "author": doc["author"],
            "author_title": doc["author_title"],
            "organisation": doc["organisation"],
            "date": doc["date"],
            "classification": doc["classification"],
            "version": doc["version"],
            "logo_neg_path": f"file://{logo_neg}",
            "cover_bg_path": f"file://{cover_bg}",
        },
    )


def make_page_html(
    config: dict,
    logo: pathlib.Path,
    template: str,
) -> str:
    """Render the repeating page header/footer HTML from a template.

    Args:
        config: Document configuration dictionary (from config.toml [document] table).
        logo: Path to the header logo image.
        template: Page header/footer HTML template string with {{variable}} placeholders.

    Returns:
        Rendered HTML string for the page header and footer.
    """
    doc = config["document"]
    return render_template(
        template,
        {
            "title": doc["title"],
            "subtitle": doc["subtitle"],
            "logo_path": f"file://{logo}",
        },
    )


def _md_to_html_via_pandoc(md_path: pathlib.Path) -> str:
    """Convert a Markdown file to HTML using pandoc.

    Args:
        md_path: Path to the Markdown source file.

    Returns:
        HTML string produced by pandoc.
    """
    result = subprocess.run(
        ["pandoc", "--from=markdown", "--to=html5", str(md_path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def _md_to_html_via_python(md_path: pathlib.Path) -> str:
    """Convert a Markdown file to HTML using the pure-Python markdown package.

    Uses the ``tables``, ``fenced_code``, ``attr_list``, ``footnotes``, and
    ``toc`` extensions to match pandoc's default HTML5 output for the document
    types produced by this tool.

    Args:
        md_path: Path to the Markdown source file.

    Returns:
        HTML string produced by the markdown package.
    """
    converter = _md.Markdown(extensions=_MD_EXTENSIONS)
    text = md_path.read_text(encoding="utf-8")
    html = converter.convert(text)
    converter.reset()
    return html


def md_to_html(md_path: pathlib.Path) -> str:
    """Convert a Markdown file to HTML.

    Uses pandoc when available on PATH; falls back to the pure-Python
    ``markdown`` package otherwise.  Both paths produce equivalent HTML5 output
    for the document types targeted by this tool.

    Args:
        md_path: Path to the Markdown source file.

    Returns:
        HTML string.
    """
    if _pandoc_available():
        return _md_to_html_via_pandoc(md_path)
    return _md_to_html_via_python(md_path)


def _resolve_image_paths(html: str, md_path: pathlib.Path) -> str:
    """Convert relative img src attributes to absolute file:// URLs.

    Args:
        html: HTML string potentially containing relative image paths.
        md_path: Path to the originating Markdown file, used to resolve
            relative paths relative to its parent directory.

    Returns:
        HTML string with all relative src attributes replaced by
        absolute file:// URLs.
    """
    md_dir = md_path.parent

    def _abs(m: re.Match) -> str:
        src = m.group(1)
        if src.startswith(("http://", "https://", "file://", "data:")):
            return m.group(0)
        resolved = (md_dir / src).resolve()
        return f'src="file://{resolved}"'

    return re.sub(r'src="([^"]+)"', _abs, html)


def build_pdf(
    sections: list[pathlib.Path],
    pdf_name: str,
    cover_html: str,
    page_html: str,
    output_dir: pathlib.Path,
    css: pathlib.Path,
    build_dir: pathlib.Path,
) -> None:
    """Build a branded PDF from a list of Markdown section paths.

    Args:
        sections: Ordered list of Markdown files to include in the PDF.
        pdf_name: Output filename (not a full path) for the generated PDF.
        cover_html: Pre-rendered HTML string for the cover page.
        page_html: Pre-rendered HTML string for the repeating page header/footer.
        output_dir: Directory where the output PDF will be written.
        css: Path to the WeasyPrint CSS stylesheet.
        build_dir: Directory used for intermediate build artefacts (e.g. combined.html).
    """
    parts = [cover_html]

    for section in sections:
        html = md_to_html(section)
        html = html.replace("\\newpage", "")
        html = _resolve_image_paths(html, section)
        parts.append(f'<div class="page-break"></div>\n{html}')

    body = "\n".join(parts)

    doc_title = _extract_title_from_page_html(page_html)

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{doc_title}</title>
  <link rel="stylesheet" href="file://{css}" />
</head>
<body>
{page_html}
{body}
</body>
</html>"""

    html_path = build_dir / "combined.html"
    html_path.write_text(full_html, encoding="utf-8")
    print(f"HTML written to {html_path}")

    from weasyprint import HTML  # noqa: PLC0415 — lazy import; weasyprint is optional

    pdf_path = output_dir / pdf_name
    HTML(filename=str(html_path)).write_pdf(str(pdf_path))
    print(f"PDF written to {pdf_path}")


def _extract_title_from_page_html(page_html: str) -> str:
    """Extract a plain-text title string from the rendered page header HTML.

    Used to populate the HTML <title> element. Falls back to an empty string
    if no header-title span is found.

    Args:
        page_html: Rendered page header/footer HTML string.

    Returns:
        Plain-text title extracted from the header-title span, or empty string.
    """
    m = re.search(r'class="header-title">([^<]+)<', page_html)
    return m.group(1).strip() if m else ""


def build(
    config: dict | None = None,
    config_path: pathlib.Path | None = None,
    output_dir: pathlib.Path | None = None,
    variant: str | None = None,
) -> None:
    """Build all configured PDF variants (or a single named variant).

    Args:
        config: Parsed configuration dictionary. If None, loaded from config_path.
        config_path: Path to the TOML config file. Defaults to build/config.toml
            relative to the current working directory.
        output_dir: Directory where output PDFs are written. Defaults to output/
            relative to the project base (one level above the config file).
        variant: Name of a single variant to build. If None, all variants are built.
    """
    if config_path is None:
        config_path = pathlib.Path("build") / "config.toml"
    if config is None:
        config = load_config(config_path)

    build_dir = config_path.resolve().parent
    base = build_dir.parent
    css = build_dir / "regnology-pdf.css"
    logo = base / "resources" / "logo_small.png"
    logo_neg = base / "resources" / "logo_negative.png"
    cover_bg = base / "resources" / "cover_photo.jpeg"
    output_dir = output_dir or (base / "output")
    output_dir.mkdir(exist_ok=True)

    cover_template = load_template(build_dir / "cover-template.html")
    page_template = load_template(build_dir / "page-template.html")

    cover_html = make_cover_html(config, logo_neg, cover_bg, cover_template)
    page_html = make_page_html(config, logo, page_template)

    variants = config.get("variants", {})
    targets = {variant: variants[variant]} if variant else variants

    for name, vcfg in targets.items():
        sections = [base / s for s in vcfg["sections"]]
        build_pdf(
            sections=sections,
            pdf_name=vcfg["output"],
            cover_html=cover_html,
            page_html=page_html,
            output_dir=output_dir,
            css=css,
            build_dir=build_dir,
        )


def main() -> None:
    """Entry point for the generate-pdf console script.

    Parses CLI arguments and runs the appropriate build variants.
    With no arguments, builds all variants using the default config.
    """
    parser = argparse.ArgumentParser(
        description="Generate branded PDF documents from Markdown sources."
    )
    parser.add_argument(
        "--config",
        type=pathlib.Path,
        default=pathlib.Path("build/config.toml"),
        help="Path to document config TOML file (default: build/config.toml)",
    )
    parser.add_argument(
        "--variant",
        default=None,
        help="Build a specific variant by name (default: build all variants)",
    )
    parser.add_argument(
        "--output-dir",
        type=pathlib.Path,
        default=None,
        help="Override output directory (default: output/ relative to repo root)",
    )
    args = parser.parse_args()

    build(config_path=args.config, output_dir=args.output_dir, variant=args.variant)


if __name__ == "__main__":
    main()

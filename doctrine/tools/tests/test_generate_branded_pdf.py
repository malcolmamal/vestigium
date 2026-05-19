"""Unit tests for doctrine/tools/scripts/generate_branded_pdf.py.

Covers pure functions only — no weasyprint, no real PDF output.
Subprocess calls (pandoc) are patched where tested.
All filesystem interaction uses pytest tmp_path fixtures.

Test pattern: Quad-A (Arrange, Assumption Check, Act, Assert).
"""

from __future__ import annotations

import pathlib
from unittest.mock import MagicMock, patch

import pytest

from doctrine.tools.scripts.generate_branded_pdf import (
    _extract_title_from_page_html,
    _md_to_html_via_pandoc,
    _md_to_html_via_python,
    _pandoc_available,
    _resolve_image_paths,
    load_config,
    load_template,
    make_cover_html,
    make_page_html,
    md_to_html,
    render_template,
)

# ---------------------------------------------------------------------------
# Shared test fixtures
# ---------------------------------------------------------------------------

MINIMAL_CONFIG: dict = {
    "document": {
        "title": "Sample Document",
        "subtitle": "A Test Subtitle",
        "author": "Test Author",
        "author_title": "Test Role",
        "organisation": "Test Organisation",
        "date": "2026-01-01",
        "classification": "FOR INTERNAL USE ONLY",
        "version": "DRAFT",
    },
    "variants": {
        "full": {
            "output": "sample-full.pdf",
            "sections": [],
        }
    },
}

COVER_TEMPLATE = """\
<div class="cover-page">
  <h1>{{title}}</h1>
  <div class="subtitle">{{subtitle}}</div>
  <div class="meta">
    <strong>Prepared by</strong> {{author}} — {{author_title}}<br/>
    <strong>Organisation</strong> {{organisation}}<br/>
    <strong>Date</strong> {{date}}<br/>
    <strong>Classification</strong> {{classification}}<br/>
    <strong>Version</strong> {{version}}
  </div>
  <img src="{{logo_neg_path}}" />
  <img src="{{cover_bg_path}}" />
</div>"""

PAGE_TEMPLATE = """\
<div class="page-header">
  <img src="{{logo_path}}" alt="Logo" />
  <span class="header-title">{{title}} — {{subtitle}}</span>
</div>
<div class="page-footer">
  <span class="footer-text">Organisation Name</span>
</div>"""


# ---------------------------------------------------------------------------
# load_config
# ---------------------------------------------------------------------------


class TestLoadConfig:
    def test_loads_valid_toml(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        config_file = tmp_path / "config.toml"
        config_file.write_text('[document]\ntitle = "Hello"\n', encoding="utf-8")

        # Assumption Check
        assert config_file.exists(), "Test precondition: config file must exist"

        # Act
        result = load_config(config_file)

        # Assert
        assert result["document"]["title"] == "Hello"

    def test_raises_for_missing_file(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        config_file = tmp_path / "nonexistent.toml"

        # Assumption Check
        assert not config_file.exists(), "Test precondition: file must NOT exist"

        # Act & Assert
        with pytest.raises(FileNotFoundError, match="Config file not found"):
            load_config(config_file)

    def test_parses_variants(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        config_file = tmp_path / "config.toml"
        toml = (
            '[document]\ntitle = "T"\n'
            '[variants.full]\noutput = "out.pdf"\nsections = []\n'
        )
        config_file.write_text(toml, encoding="utf-8")

        # Assumption Check
        assert config_file.exists()

        # Act
        result = load_config(config_file)

        # Assert
        assert "full" in result["variants"]
        assert result["variants"]["full"]["output"] == "out.pdf"


# ---------------------------------------------------------------------------
# load_template
# ---------------------------------------------------------------------------


class TestLoadTemplate:
    def test_loads_template_content(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        template_file = tmp_path / "cover-template.html"
        template_file.write_text("{{title}}", encoding="utf-8")

        # Assumption Check
        assert template_file.exists()

        # Act
        result = load_template(template_file)

        # Assert
        assert result == "{{title}}"

    def test_raises_for_missing_template(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        template_file = tmp_path / "missing.html"

        # Assumption Check
        assert not template_file.exists()

        # Act & Assert
        with pytest.raises(FileNotFoundError, match="Template not found"):
            load_template(template_file)


# ---------------------------------------------------------------------------
# render_template
# ---------------------------------------------------------------------------


class TestRenderTemplate:
    def test_replaces_single_variable(self) -> None:
        # Arrange
        template = "Hello, {{name}}!"

        # Act
        result = render_template(template, {"name": "World"})

        # Assert
        assert result == "Hello, World!"

    def test_replaces_multiple_variables(self) -> None:
        # Arrange
        template = "{{greeting}}, {{name}}! You are {{role}}."

        # Act
        result = render_template(
            template, {"greeting": "Hi", "name": "Alice", "role": "Engineer"}
        )

        # Assert
        assert result == "Hi, Alice! You are Engineer."

    def test_leaves_unknown_placeholders_intact(self) -> None:
        # Arrange
        template = "{{known}} and {{unknown}}"

        # Act
        result = render_template(template, {"known": "replaced"})

        # Assert
        assert result == "replaced and {{unknown}}"

    def test_empty_variables_returns_template_unchanged(self) -> None:
        # Arrange
        template = "{{title}} — {{subtitle}}"

        # Act
        result = render_template(template, {})

        # Assert
        assert result == template

    def test_replaces_all_occurrences(self) -> None:
        # Arrange
        template = "{{x}} + {{x}} = two {{x}}"

        # Act
        result = render_template(template, {"x": "a"})

        # Assert
        assert result == "a + a = two a"


# ---------------------------------------------------------------------------
# make_cover_html
# ---------------------------------------------------------------------------


class TestMakeCoverHtml:
    def test_all_placeholders_replaced(self) -> None:
        # Arrange
        logo_neg = pathlib.Path("/assets/logo_negative.png")
        cover_bg = pathlib.Path("/assets/cover_photo.jpeg")

        # Act
        result = make_cover_html(MINIMAL_CONFIG, logo_neg, cover_bg, COVER_TEMPLATE)

        # Assert
        assert "Sample Document" in result
        assert "A Test Subtitle" in result
        assert "Test Author" in result
        assert "Test Role" in result
        assert "Test Organisation" in result
        assert "2026-01-01" in result
        assert "FOR INTERNAL USE ONLY" in result
        assert "DRAFT" in result
        assert f"file://{logo_neg}" in result
        assert f"file://{cover_bg}" in result

    def test_no_unreplaced_placeholders_remain(self) -> None:
        # Arrange
        logo_neg = pathlib.Path("/logo_neg.png")
        cover_bg = pathlib.Path("/cover.jpg")

        # Act
        result = make_cover_html(MINIMAL_CONFIG, logo_neg, cover_bg, COVER_TEMPLATE)

        # Assert
        assert "{{" not in result


# ---------------------------------------------------------------------------
# make_page_html
# ---------------------------------------------------------------------------


class TestMakePageHtml:
    def test_all_placeholders_replaced(self) -> None:
        # Arrange
        logo = pathlib.Path("/assets/logo_small.png")

        # Act
        result = make_page_html(MINIMAL_CONFIG, logo, PAGE_TEMPLATE)

        # Assert
        assert "Sample Document" in result
        assert "A Test Subtitle" in result
        assert f"file://{logo}" in result

    def test_no_unreplaced_placeholders_remain(self) -> None:
        # Arrange
        logo = pathlib.Path("/logo.png")

        # Act
        result = make_page_html(MINIMAL_CONFIG, logo, PAGE_TEMPLATE)

        # Assert
        assert "{{" not in result


# ---------------------------------------------------------------------------
# _extract_title_from_page_html
# ---------------------------------------------------------------------------


class TestExtractTitleFromPageHtml:
    def test_extracts_title_from_header_span(self) -> None:
        # Arrange
        html = '<span class="header-title">My Doc — My Subtitle</span>'

        # Act
        result = _extract_title_from_page_html(html)

        # Assert
        assert result == "My Doc — My Subtitle"

    def test_returns_empty_string_when_no_span(self) -> None:
        # Arrange
        html = "<div>No header title here</div>"

        # Act
        result = _extract_title_from_page_html(html)

        # Assert
        assert result == ""

    def test_trims_whitespace(self) -> None:
        # Arrange
        html = '<span class="header-title">  Padded Title  </span>'

        # Act
        result = _extract_title_from_page_html(html)

        # Assert
        assert result == "Padded Title"

    def test_returns_empty_on_empty_input(self) -> None:
        # Act
        result = _extract_title_from_page_html("")

        # Assert
        assert result == ""


# ---------------------------------------------------------------------------
# _resolve_image_paths
# ---------------------------------------------------------------------------


class TestResolveImagePaths:
    def test_converts_relative_src_to_absolute(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "docs" / "overview.md"
        md_file.parent.mkdir(parents=True)
        md_file.touch()
        html = '<img src="images/diagram.png" />'

        # Act
        result = _resolve_image_paths(html, md_file)

        # Assert
        expected_abs = (tmp_path / "docs" / "images" / "diagram.png").resolve()
        assert f'src="file://{expected_abs}"' in result

    def test_leaves_http_urls_unchanged(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "doc.md"
        md_file.touch()
        html = '<img src="https://example.com/image.png" />'

        # Act
        result = _resolve_image_paths(html, md_file)

        # Assert
        assert 'src="https://example.com/image.png"' in result

    def test_leaves_file_urls_unchanged(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "doc.md"
        md_file.touch()
        html = '<img src="file:///absolute/path/image.png" />'

        # Act
        result = _resolve_image_paths(html, md_file)

        # Assert
        assert 'src="file:///absolute/path/image.png"' in result

    def test_leaves_data_uris_unchanged(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "doc.md"
        md_file.touch()
        html = '<img src="data:image/png;base64,abc123" />'

        # Act
        result = _resolve_image_paths(html, md_file)

        # Assert
        assert 'src="data:image/png;base64,abc123"' in result

    def test_handles_multiple_images(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "doc.md"
        md_file.touch()
        html = (
            '<img src="a.png" />'
            '<img src="https://x.com/b.png" />'
            '<img src="c.svg" />'
        )

        # Act
        result = _resolve_image_paths(html, md_file)

        # Assert
        assert "https://x.com/b.png" in result
        expected_a = (tmp_path / "a.png").resolve()
        expected_c = (tmp_path / "c.svg").resolve()
        assert f"file://{expected_a}" in result
        assert f"file://{expected_c}" in result


# ---------------------------------------------------------------------------
# _pandoc_available
# ---------------------------------------------------------------------------


class TestPandocAvailable:
    def test_returns_true_when_pandoc_on_path(self) -> None:
        with patch(
            "doctrine.tools.scripts.generate_branded_pdf.shutil.which",
            return_value="/usr/bin/pandoc",
        ):
            assert _pandoc_available() is True

    def test_returns_false_when_pandoc_absent(self) -> None:
        with patch(
            "doctrine.tools.scripts.generate_branded_pdf.shutil.which",
            return_value=None,
        ):
            assert _pandoc_available() is False


# ---------------------------------------------------------------------------
# _md_to_html_via_pandoc
# ---------------------------------------------------------------------------


class TestMdToHtmlViaPandoc:
    def test_calls_pandoc_with_correct_args(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "section.md"
        md_file.write_text("# Hello\n", encoding="utf-8")
        mock_result = MagicMock()
        mock_result.stdout = "<h1>Hello</h1>\n"

        # Assumption Check
        assert md_file.exists()

        # Act
        with patch(
            "doctrine.tools.scripts.generate_branded_pdf.subprocess.run",
            return_value=mock_result,
        ) as mock_run:
            result = _md_to_html_via_pandoc(md_file)

        # Assert
        mock_run.assert_called_once_with(
            ["pandoc", "--from=markdown", "--to=html5", str(md_file)],
            capture_output=True,
            text=True,
            check=True,
        )
        assert result == "<h1>Hello</h1>\n"

    def test_returns_pandoc_stdout(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "doc.md"
        md_file.write_text("text", encoding="utf-8")
        mock_result = MagicMock()
        mock_result.stdout = "<p>text</p>\n"

        with patch(
            "doctrine.tools.scripts.generate_branded_pdf.subprocess.run",
            return_value=mock_result,
        ):
            result = _md_to_html_via_pandoc(md_file)

        assert result == "<p>text</p>\n"


# ---------------------------------------------------------------------------
# _md_to_html_via_python
# ---------------------------------------------------------------------------


class TestMdToHtmlViaPython:
    def test_converts_heading(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "section.md"
        md_file.write_text("# Hello World\n", encoding="utf-8")

        # Act
        result = _md_to_html_via_python(md_file)

        # Assert — toc extension adds id="..." so match the opening tag prefix only
        assert "<h1" in result
        assert "Hello World" in result

    def test_converts_bold_and_italic(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "section.md"
        md_file.write_text("**bold** and _italic_\n", encoding="utf-8")

        # Act
        result = _md_to_html_via_python(md_file)

        # Assert
        assert "<strong>bold</strong>" in result
        assert "<em>italic</em>" in result

    def test_converts_gfm_table(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "section.md"
        md_file.write_text(
            "| A | B |\n|---|---|\n| 1 | 2 |\n", encoding="utf-8"
        )

        # Act
        result = _md_to_html_via_python(md_file)

        # Assert
        assert "<table>" in result
        assert "<th>" in result
        assert "<td>" in result

    def test_converts_fenced_code_block(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "section.md"
        md_file.write_text("```\nprint('hi')\n```\n", encoding="utf-8")

        # Act
        result = _md_to_html_via_python(md_file)

        # Assert
        assert "<code>" in result
        assert "print" in result

    def test_empty_file_returns_empty_string(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "empty.md"
        md_file.write_text("", encoding="utf-8")

        # Act
        result = _md_to_html_via_python(md_file)

        # Assert
        assert result == ""

    def test_consecutive_calls_do_not_bleed_state(
        self, tmp_path: pathlib.Path
    ) -> None:
        # Arrange — two independent files; if reset() is missing, the second
        # call would return an empty string due to stale converter state.
        file_a = tmp_path / "a.md"
        file_b = tmp_path / "b.md"
        file_a.write_text("# First\n", encoding="utf-8")
        file_b.write_text("# Second\n", encoding="utf-8")

        # Act
        result_a = _md_to_html_via_python(file_a)
        result_b = _md_to_html_via_python(file_b)

        # Assert
        assert "First" in result_a
        assert "Second" in result_b


# ---------------------------------------------------------------------------
# md_to_html — dispatch logic
# ---------------------------------------------------------------------------


class TestMdToHtmlDispatch:
    def test_uses_pandoc_when_available(self, tmp_path: pathlib.Path) -> None:
        # Arrange
        md_file = tmp_path / "doc.md"
        md_file.write_text("# Hi\n", encoding="utf-8")

        # Act
        with patch(
            "doctrine.tools.scripts.generate_branded_pdf._pandoc_available",
            return_value=True,
        ), patch(
            "doctrine.tools.scripts.generate_branded_pdf._md_to_html_via_pandoc",
            return_value="<h1>pandoc</h1>",
        ) as mock_pandoc, patch(
            "doctrine.tools.scripts.generate_branded_pdf._md_to_html_via_python",
        ) as mock_python:
            result = md_to_html(md_file)

        # Assert
        mock_pandoc.assert_called_once_with(md_file)
        mock_python.assert_not_called()
        assert result == "<h1>pandoc</h1>"

    def test_falls_back_to_python_when_pandoc_absent(
        self, tmp_path: pathlib.Path
    ) -> None:
        # Arrange
        md_file = tmp_path / "doc.md"
        md_file.write_text("# Hi\n", encoding="utf-8")

        # Act
        with patch(
            "doctrine.tools.scripts.generate_branded_pdf._pandoc_available",
            return_value=False,
        ), patch(
            "doctrine.tools.scripts.generate_branded_pdf._md_to_html_via_pandoc",
        ) as mock_pandoc, patch(
            "doctrine.tools.scripts.generate_branded_pdf._md_to_html_via_python",
            return_value="<h1>python</h1>",
        ) as mock_python:
            result = md_to_html(md_file)

        # Assert
        mock_python.assert_called_once_with(md_file)
        mock_pandoc.assert_not_called()
        assert result == "<h1>python</h1>"

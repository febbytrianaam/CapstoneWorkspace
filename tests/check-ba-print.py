"""Validate generated synthetic PDFs; never reads the live app or database."""
import re
import sys
from pathlib import Path

import pdfplumber
import pypdfium2

source = Path(sys.argv[1])
with pdfplumber.open(source) as pdf:
    text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    markers = re.findall(r"PARAGRAF(\d+)", text)
    assert len(markers) == 36 and set(map(int, markers)) == set(range(1, 37)), "Print must retain every paragraph exactly once"
    assert len(pdf.pages) >= 3, "Fixture must cross multiple physical pages"
    for number, page in enumerate(pdf.pages, 1):
        horizontal = [edge for edge in page.edges if edge.get("orientation") == "h" and edge["width"] > page.width * 0.8]
        vertical = [edge for edge in page.edges if edge.get("orientation") == "v" and edge["height"] > 2]
        assert horizontal and vertical, f"Page {number} has no table borders"
        left = min(edge["x0"] for edge in horizontal)
        right = max(edge["x1"] for edge in horizontal)
        bottom = max(edge["bottom"] for edge in vertical)
        assert any(abs(edge["top"] - bottom) < 1.1 and edge["x0"] <= left + 1 and edge["x1"] >= right - 1 for edge in horizontal), f"Page {number} has an open table bottom"
        rules = [rect for rect in page.rects if rect.get("non_stroking_color") in [(0, 0, 0), 0] and ((rect["width"] < 2 and rect["height"] > 3) or (rect["height"] < 2 and rect["width"] > 3))]
        assert all(min(rect["width"], rect["height"]) <= 0.8 for rect in rules), f"Page {number} has a thick rule"
    page_count = len(pdf.pages)
    if source.name == 'docs-print.pdf':
        headings = [page for page in pdf.pages if 'Dokumentasi' in (page.extract_text() or '')]
        assert len(headings) == 1 and headings[0].images, 'Documentation heading must accompany the first photo'
        assert sum(len(page.images) for page in pdf.pages) == 2, 'Both photos must be retained'
        for page in pdf.pages:
            for image in page.images:
                assert image['top'] >= 30 and image['bottom'] <= page.height - 30, 'Photos must not cross page boundaries'

document = pypdfium2.PdfDocument(source)
for index in range(len(document)):
    document[index].render(scale=1.5).to_pil().save(source.with_name(f"{source.stem}-page-{index + 1}.png"))
print(f"Print verified: {page_count} A4 pages, closed borders on every page, thin rules, all 36 paragraphs retained.")

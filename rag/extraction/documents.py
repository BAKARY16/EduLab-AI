import csv
import json
from pathlib import Path


def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".txt", ".html", ".htm"}:
        return path.read_text(encoding="utf-8", errors="replace")
    if suffix == ".json":
        return json.dumps(json.loads(path.read_text(encoding="utf-8")), ensure_ascii=False, indent=2)
    if suffix == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as handle:
            return "\n".join(" | ".join(row) for row in csv.reader(handle))
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise RuntimeError("Installer pypdf pour importer un PDF") from exc
        return "\n\n".join(page.extract_text() or "" for page in PdfReader(path).pages)
    if suffix == ".docx":
        try:
            from docx import Document
        except ImportError as exc:
            raise RuntimeError("Installer python-docx pour importer un DOCX") from exc
        return "\n".join(paragraph.text for paragraph in Document(path).paragraphs)
    raise ValueError(f"Format non pris en charge: {suffix}")

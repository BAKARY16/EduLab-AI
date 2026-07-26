import re


def _hard_split(block: str, max_chars: int, overlap: int) -> list[str]:
    """Force-split a single block that has no blank-line break (typical of PDF text dumps)."""
    if len(block) <= max_chars:
        return [block]
    pieces: list[str] = []
    start = 0
    while start < len(block):
        end = start + max_chars
        pieces.append(block[start:end])
        start = end - overlap
    return pieces


def chunk_text(text: str, max_chars: int = 1800, overlap: int = 200) -> list[str]:
    """Split around headings/paragraphs while retaining a small contextual overlap."""
    cleaned = re.sub(r"[ \t]+", " ", text.replace("\r", "\n"))
    raw_blocks = [block.strip() for block in re.split(r"\n{2,}", cleaned) if block.strip()]
    blocks = [piece for block in raw_blocks for piece in _hard_split(block, max_chars, overlap)]
    chunks: list[str] = []
    current = ""
    for block in blocks:
        if current and len(current) + len(block) + 2 > max_chars:
            chunks.append(current)
            current = current[-overlap:] + "\n\n" + block
        else:
            current = f"{current}\n\n{block}".strip()
    if current:
        chunks.append(current)
    return chunks


COMPETENCY_HEADING = re.compile(r"COMP[EÉ]TENCE\s*(\d+)\s*:?\s*(?:Th[eè]me\s*:\s*)?([^\n]{0,120})", re.IGNORECASE)
LESSON_HEADING = re.compile(r"LE[ÇC]ON\s*(\d+)\s*:?\s*([^\n]{0,120})", re.IGNORECASE)


def chunk_by_curriculum_headings(text: str, max_chars: int = 1800, overlap: int = 200) -> list[dict]:
    """Découpe un programme officiel (type DPFC) en s'appuyant sur ses propres repères
    de structure ("COMPETENCE N : Thème : ...", "LEÇON N : ..."), au lieu d'un découpage
    aveugle par taille. Chaque morceau hérite de la compétence/leçon sous laquelle il se
    trouve dans le document. Retombe sur un unique groupe sans étiquette si aucun repère
    n'est trouvé (le document n'est alors pas un programme structuré de ce type).
    """
    markers: list[tuple[int, str, str, str]] = []  # (position, kind, number, title)
    for m in COMPETENCY_HEADING.finditer(text):
        markers.append((m.start(), "competency", m.group(1), re.sub(r"\s+", " ", m.group(2)).strip()))
    for m in LESSON_HEADING.finditer(text):
        markers.append((m.start(), "lesson", m.group(1), re.sub(r"\s+", " ", m.group(2)).strip()))
    markers.sort(key=lambda m: m[0])

    if not markers:
        return [{"text": piece, "competency": None, "lesson": None} for piece in chunk_text(text, max_chars, overlap)]

    results: list[dict] = []
    current_competency: str | None = None
    current_lesson: str | None = None
    for idx, (pos, kind, number, title) in enumerate(markers):
        end = markers[idx + 1][0] if idx + 1 < len(markers) else len(text)
        if kind == "competency":
            current_competency = f"Compétence {number} — {title}" if title else f"Compétence {number}"
            current_lesson = None
        else:
            current_lesson = f"Leçon {number} — {title}" if title else f"Leçon {number}"
        segment = text[pos:end].strip()
        if not segment:
            continue
        for piece in chunk_text(segment, max_chars, overlap):
            results.append({"text": piece, "competency": current_competency, "lesson": current_lesson})
    return results

"""Recherche lexicale (TF-IDF) sur les chunks indexés par scripts/build_rag_index.py."""
from __future__ import annotations

import json
import pickle
import re
import unicodedata
from functools import lru_cache
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX_DIR = ROOT / "ml" / "artifacts" / "rag_index"


@dataclass
class RetrievedChunk:
    text: str
    source: str
    subject: str
    score: float
    document_id: str
    academic_class: str
    official_status: str
    validation_status: str
    source_url: str | None = None
    competency: str | None = None
    lesson: str | None = None


@lru_cache(maxsize=1)
def _load_index() -> tuple[object, object, list[dict]]:
    with open(INDEX_DIR / "vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)
    with open(INDEX_DIR / "matrix.pkl", "rb") as f:
        matrix = pickle.load(f)
    chunks = json.loads((INDEX_DIR / "chunks.json").read_text(encoding="utf-8"))
    return vectorizer, matrix, chunks


def _norm(value: str) -> str:
    value=unicodedata.normalize("NFKD",value).encode("ascii","ignore").decode().lower()
    return " ".join(re.findall(r"[a-z0-9]+",value))

def _collect(ranked, chunks, scores, k, subject, academic_class, query) -> list[RetrievedChunk]:
    results: list[RetrievedChunk] = []
    for i in ranked:
        if scores[i] <= 0:
            break
        meta = chunks[i]
        if subject and _norm(meta.get("subject", "")) != _norm(subject):
            continue
        if academic_class and _norm(meta.get("academic_class", "")) != _norm(academic_class):
            continue
        # Curriculum-aware re-ranking: lesson/competency matches and validated
        # official passages rank above generic lexical matches.
        boosted=float(scores[i]); q=_norm(query)
        lesson=_norm(meta.get("lesson") or ""); competency=_norm(meta.get("competency") or "")
        if lesson and (lesson in q or q in lesson): boosted+=.30
        if competency and any(t in competency for t in q.split() if len(t)>4): boosted+=.12
        if meta.get("validation_status")=="validated": boosted+=.08
        if meta.get("official_status")=="official": boosted+=.06
        results.append(
            RetrievedChunk(
                text=meta["text"],
                source=meta["source"],
                subject=meta["subject"],
                score=min(1.0,boosted),
                document_id=meta.get("document_id", ""),
                academic_class=meta.get("academic_class", ""),
                official_status=meta.get("official_status", "unknown"),
                validation_status=meta.get("validation_status", "unknown"),
                source_url=meta.get("source_url"),
                competency=meta.get("competency"),
                lesson=meta.get("lesson"),
            )
        )
        if len(results) >= k:
            break
    return results


def search(query: str, k: int = 3, subject: str | None = None, academic_class: str | None = None, allow_cross_class_fallback: bool = False) -> list[RetrievedChunk]:
    """Retourne les k passages les plus proches de la requête.

    Filtre par matière et, si fourni, par classe (contenu adapté au niveau de l'élève).
    Si rien ne correspond exactement à cette classe, on retombe sur toutes les classes de
    la matière plutôt que de ne rien renvoyer — le professeur doit avoir accès à tout le
    contenu indexé, la préférence de niveau ne doit jamais le priver d'une réponse utile.
    """
    if not query.strip() or not (INDEX_DIR / "vectorizer.pkl").exists():
        return []

    from sklearn.metrics.pairwise import cosine_similarity

    vectorizer, matrix, chunks = _load_index()
    query_vec = vectorizer.transform([query])
    scores = cosine_similarity(query_vec, matrix)[0]
    ranked = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)

    # First collect more candidates, then sort after metadata boosts.
    results = _collect(ranked, chunks, scores, max(k*4,k), subject, academic_class, query)
    if not results and academic_class and allow_cross_class_fallback:
        results = _collect(ranked, chunks, scores, max(k*4,k), subject, None, query)
    return sorted(results,key=lambda item:item.score,reverse=True)[:k]

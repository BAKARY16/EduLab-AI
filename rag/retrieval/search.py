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
DENSE_INDEX_DIR = ROOT / "ml" / "artifacts" / "faiss_index"


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


@lru_cache(maxsize=1)
def _load_dense_index():
    """Load the optional multilingual open-source semantic index."""
    import faiss
    from sentence_transformers import SentenceTransformer

    manifest = json.loads((DENSE_INDEX_DIR / "manifest.json").read_text(encoding="utf-8"))
    chunks = json.loads((DENSE_INDEX_DIR / "chunks.json").read_text(encoding="utf-8"))
    model = SentenceTransformer(manifest["embedding_model"])
    index = faiss.read_index(str(DENSE_INDEX_DIR / "index.faiss"))
    return model, index, chunks


def _dense_search(query: str, k: int, subject: str | None, academic_class: str | None) -> list[RetrievedChunk]:
    required = [DENSE_INDEX_DIR / "manifest.json", DENSE_INDEX_DIR / "chunks.json", DENSE_INDEX_DIR / "index.faiss"]
    if not all(path.exists() for path in required):
        return []
    try:
        model, index, chunks = _load_dense_index()
        vector = model.encode([query], normalize_embeddings=True).astype("float32")
        scores, indices = index.search(vector, min(len(chunks), max(k * 8, 20)))
    except (ImportError, OSError, ValueError, KeyError):
        return []
    results: list[RetrievedChunk] = []
    for score, index_value in zip(scores[0], indices[0]):
        if index_value < 0:
            continue
        meta = chunks[int(index_value)]
        if subject and _norm(meta.get("subject", "")) != _norm(subject):
            continue
        if academic_class and _norm(meta.get("academic_class", "")) != _norm(academic_class):
            continue
        results.append(RetrievedChunk(
            text=meta["text"], source=meta["source"], subject=meta["subject"],
            score=max(0.0, min(1.0, float(score))), document_id=meta.get("document_id", ""),
            academic_class=meta.get("academic_class", ""), official_status=meta.get("official_status", "unknown"),
            validation_status=meta.get("validation_status", "unknown"), source_url=meta.get("source_url"),
            competency=meta.get("competency"), lesson=meta.get("lesson"),
        ))
        if len(results) >= k:
            break
    return results


def _fuse(lexical: list[RetrievedChunk], semantic: list[RetrievedChunk], k: int) -> list[RetrievedChunk]:
    """Reciprocal-rank fusion: robust when lexical and semantic scores differ."""
    fused: dict[str, tuple[float, RetrievedChunk]] = {}
    for weight, results in ((1.0, lexical), (1.15, semantic)):
        for rank, item in enumerate(results, start=1):
            key = f"{item.document_id}:{hash(item.text)}"
            contribution = weight / (60 + rank)
            previous = fused.get(key)
            fused[key] = ((previous[0] if previous else 0.0) + contribution, item)
    ranked = sorted(fused.values(), key=lambda pair: pair[0], reverse=True)
    if not ranked:
        return []
    best = ranked[0][0]
    for score, item in ranked:
        item.score = min(1.0, score / best)
    return [item for _, item in ranked[:k]]


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
    semantic = _dense_search(query, max(k*4,k), subject, academic_class)
    if not results and academic_class and allow_cross_class_fallback:
        results = _collect(ranked, chunks, scores, max(k*4,k), subject, None, query)
        semantic = _dense_search(query, max(k*4,k), subject, None)
    if semantic:
        return _fuse(results, semantic, k)
    return sorted(results,key=lambda item:item.score,reverse=True)[:k]

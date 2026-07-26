"""Construit l'index de recherche (TF-IDF) à partir des chunks déjà ingérés en base.

L'ingestion (extraction + découpage + métadonnées) se fait via
scripts/ingest_knowledge_documents.py, qui écrit dans knowledge_documents/knowledge_chunks.
Ce script se contente d'indexer ce qui existe réellement en base — il n'extrait plus rien
lui-même, pour éviter deux pipelines parallèles qui pourraient diverger.
"""
from __future__ import annotations

import json
import pickle
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.ingest_knowledge_documents import _connect  # noqa: E402

INDEX_DIR = ROOT / "ml" / "artifacts" / "rag_index"


def build() -> dict:
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                select
                    c.id as chunk_id, c.content as text, c.chunk_index, c.competency, c.lesson,
                    d.id as document_id, d.title as source, d.academic_class, d.subject,
                    d.official_status, d.validation_status
                from knowledge_chunks c
                join knowledge_documents d on d.id = c.document_id
                order by d.id, c.chunk_index
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    all_chunks = [
        {
            "id": str(row["chunk_id"]),
            "text": row["text"],
            "source": row["source"],
            "subject": row["subject"],
            "academic_class": row["academic_class"],
            "official_status": row["official_status"],
            "validation_status": row["validation_status"],
            "document_id": str(row["document_id"]),
            "competency": row["competency"],
            "lesson": row["lesson"],
        }
        for row in rows
    ]

    if not all_chunks:
        summary = {
            "documents": 0,
            "chunks": 0,
            "embedding_index_built": False,
            "reason": "Aucun chunk en base — lancez scripts/ingest_knowledge_documents.py d'abord.",
        }
        print(json.dumps(summary, ensure_ascii=False))
        return summary

    from sklearn.feature_extraction.text import TfidfVectorizer

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    vectorizer = TfidfVectorizer(max_features=20000, ngram_range=(1, 2))
    matrix = vectorizer.fit_transform([c["text"] for c in all_chunks])

    with open(INDEX_DIR / "vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    with open(INDEX_DIR / "matrix.pkl", "wb") as f:
        pickle.dump(matrix, f)
    (INDEX_DIR / "chunks.json").write_text(json.dumps(all_chunks, ensure_ascii=False), encoding="utf-8")

    summary = {
        "documents": len({c["document_id"] for c in all_chunks}),
        "chunks": len(all_chunks),
        "embedding_index_built": True,
        "method": "tfidf",
    }
    print(json.dumps(summary, ensure_ascii=False))
    return summary


if __name__ == "__main__":
    build()

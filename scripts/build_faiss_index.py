"""Construit un index dense FAISS à partir des chunks validés du corpus."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "ml/artifacts/rag_index/chunks.json"
DEFAULT_OUTPUT = ROOT / "ml/artifacts/faiss_index"


def build(source: Path, output: Path, model_name: str) -> dict:
    try:
        import faiss
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise SystemExit("Dépendances absentes. Exécutez: pip install -r requirements-rag.txt") from exc
    chunks = json.loads(source.read_text(encoding="utf-8"))
    eligible = [c for c in chunks if c.get("text", "").strip() and c.get("validation_status") == "validated"]
    if not eligible:
        raise SystemExit("Aucun chunk validé à indexer.")
    model = SentenceTransformer(model_name)
    vectors = model.encode([c["text"] for c in eligible], normalize_embeddings=True, show_progress_bar=True)
    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors.astype("float32"))
    output.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(output / "index.faiss"))
    (output / "chunks.json").write_text(json.dumps(eligible, ensure_ascii=False), encoding="utf-8")
    manifest = {"schema_version": "1.0", "backend": "faiss", "distance": "cosine_via_inner_product", "embedding_model": model_name, "dimensions": int(vectors.shape[1]), "chunks": len(eligible), "normalized": True}
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--model", default="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    args = parser.parse_args()
    print(json.dumps(build(args.source, args.output, args.model), ensure_ascii=False))

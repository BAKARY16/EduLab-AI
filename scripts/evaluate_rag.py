"""Évalue le retrieval indépendamment de la génération (Recall@k, MRR, filtres)."""
from __future__ import annotations

import argparse
import json
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from rag.retrieval.search import search  # noqa: E402


def norm(value: str) -> str:
    return unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()


def evaluate(gold_path: Path, k: int) -> dict:
    cases = [json.loads(line) for line in gold_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    details = []
    reciprocal_ranks = []
    for case in cases:
        hits = search(case["query"], k=k, subject=case["subject"], academic_class=case["academic_class"])
        rank = None
        expected_lesson = norm(case["expected_lesson"])
        for position, hit in enumerate(hits, 1):
            haystack = norm(" ".join((hit.lesson or "", hit.text)))
            if expected_lesson in haystack:
                rank = position
                break
        terms = [term for term in case["expected_terms"] if norm(term) in norm(" ".join(h.text for h in hits))]
        reciprocal_ranks.append(0.0 if rank is None else 1.0 / rank)
        details.append({
            "id": case["id"], "relevant_rank": rank,
            "term_coverage": len(terms) / len(case["expected_terms"]),
            "filters_respected": all(h.subject == case["subject"] and h.academic_class == case["academic_class"] for h in hits),
            "top_sources": [h.source for h in hits],
        })
    metrics = {
        f"recall_at_{k}": sum(d["relevant_rank"] is not None for d in details) / len(details),
        "mrr": sum(reciprocal_ranks) / len(details),
        "mean_term_coverage": sum(d["term_coverage"] for d in details) / len(details),
        "filter_accuracy": sum(d["filters_respected"] for d in details) / len(details),
    }
    return {"schema_version": "1.0", "retriever": "tfidf_word_bigram_baseline", "gold_cases": len(cases), "k": k, "metrics": metrics, "cases": details}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--gold", default="data/evaluation/rag_gold.jsonl")
    parser.add_argument("--output", default="reports/rag_metrics.json")
    parser.add_argument("-k", type=int, default=3)
    args = parser.parse_args()
    result = evaluate(ROOT / args.gold, args.k)
    output = ROOT / args.output
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result["metrics"], ensure_ascii=False))

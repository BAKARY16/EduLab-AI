"""Point d'entrée unique des évaluations locales reproductibles."""
import json
from pathlib import Path

from audit_project import audit
from evaluate_rag import evaluate

ROOT = Path(__file__).resolve().parents[1]
project_audit = audit()
rag = evaluate(ROOT / "data/evaluation/rag_gold.jsonl", k=3)
result = {
    "fabricated_metrics": False,
    "project_quality": project_audit["status"],
    "rag": rag,
    "scientific_generation": {"status": "pending_human_gold_annotations"},
    "learner_model": {"status": "pending_longitudinal_learner_events"},
}
(ROOT / "reports/evaluation_summary.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"project_quality": result["project_quality"], "rag": rag["metrics"]}, ensure_ascii=False))

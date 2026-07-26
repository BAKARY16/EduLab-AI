import csv
import json
from pathlib import Path

catalog = Path(__file__).resolve().parents[1] / "data" / "source_registry" / "course_catalog.csv"
with catalog.open(encoding="utf-8-sig", newline="") as handle:
    rows = list(csv.DictReader(handle))
required = {"class_name", "subject", "lesson", "document_url", "official_status", "validation_status"}
missing = required - set(rows[0] if rows else {})
invalid = [index + 2 for index, row in enumerate(rows) if any(not row.get(field) for field in required)]
print(json.dumps({"rows": len(rows), "missing_columns": sorted(missing), "invalid_rows": invalid, "valid": not missing and not invalid}))
raise SystemExit(0 if not missing and not invalid else 1)

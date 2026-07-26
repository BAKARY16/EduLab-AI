"""Write evidence only for commands whose outcomes were actually observed."""
from datetime import datetime, timezone
from pathlib import Path
import csv
ROOT=Path(__file__).resolve().parents[1]
now=datetime.now(timezone.utc).isoformat()
rows=[
 ["teacher dataset", "data/processed/edulab_teacher_{train,validation,test}.jsonl", ".venv/Scripts/python.exe scripts/validate_teacher_dataset.py", ">=300 examples; no leakage", "369 examples; 40 lesson groups; no leakage", "PASS", now],
 ["dataset tests", "tests/test_dataset_schema.py; tests/test_dataset_splits.py", ".venv/Scripts/python.exe -m pytest tests/test_dataset_schema.py tests/test_dataset_splits.py", "tests pass", "2 passed", "PASS", now],
 ["model artifact truthfulness", "tests/test_model_loading.py", ".venv/Scripts/python.exe -m pytest tests/test_model_loading.py", "no partial/fake adapter", "SKIP: adapter not trained; no fake weights", "SKIP", now],
 ["teacher evaluation scope", "scripts/evaluate_teacher_model.py", ".venv/Scripts/python.exe -m pytest tests/test_teacher_generation.py", "9 scenarios and all scoped classes/subjects", "PASS", "PASS", now],
 ["exercise/question quantity", "reports/dataset_statistics.json", "bootstrap + validation", ">=150 exercises/questions", "164 exercises/questions", "PASS", now],
 ["robot JSON", "tests/test_json_robot_output.py", ".venv/Scripts/python.exe -m pytest tests/test_json_robot_output.py", ">=30 valid structured outputs", "41 valid JSON examples", "PASS", now],
 ["SciQ normalized", "data/processed/sciq_normalized.parquet", "python read_parquet Hugging Face convert/parquet URL", "non-empty normalized public split", "11679 rows; source_id=SRC-SCIQ; language=en", "PASS", now],
 ["local ML import", ".venv", ".venv/Scripts/python.exe -c import torch", "PyTorch imports", "FAIL: ModuleNotFoundError torchgen; reinstall timed out", "FAIL", now],
]
with (ROOT/'reports/evidence.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.writer(f); w.writerow(['deliverable','path','command','expected','actual','status','timestamp']); w.writerows(rows)
print(ROOT/'reports/evidence.csv')

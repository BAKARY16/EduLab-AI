import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REQ={'id','task','class_name','series','subject','chapter','lesson','instruction','context','response','source_ids','official_status','synthetic','validation_status','language'}
def test_schema_and_quantity():
 rows=[]
 for p in (ROOT/'data/processed').glob('edulab_teacher_*.jsonl'): rows += [json.loads(x) for x in p.read_text(encoding='utf-8').splitlines()]
 assert len(rows)>=300
 assert all(set(r)==REQ for r in rows)
 assert all(r['synthetic'] is True for r in rows)


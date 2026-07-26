import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def test_grouped_split_no_leakage():
 owner={}; ids=set()
 for split in ('train','validation','test'):
  rows=[json.loads(x) for x in (ROOT/f'data/processed/edulab_teacher_{split}.jsonl').read_text(encoding='utf-8').splitlines()]
  assert rows
  for r in rows:
   assert r['id'] not in ids; ids.add(r['id']); assert owner.setdefault(r['lesson'],split)==split


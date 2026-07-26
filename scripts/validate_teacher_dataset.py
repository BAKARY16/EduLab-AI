"""Strict schema, split leakage and JSON robot validation."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REQ={'id','task','class_name','series','subject','chapter','lesson','instruction','context','response','source_ids','official_status','synthetic','validation_status','language'}
seen_ids=set(); lessons={}; total=0
for split in ('train','validation','test'):
 rows=[json.loads(x) for x in (ROOT/f'data/processed/edulab_teacher_{split}.jsonl').read_text(encoding='utf-8').splitlines() if x]
 assert rows,split
 for r in rows:
  assert set(r)==REQ,(r['id'],set(r)^REQ); assert r['id'] not in seen_ids; seen_ids.add(r['id']); total+=1
  assert r['class_name'] in {'Troisième','Terminale C','Terminale D'}; assert r['subject'] in {'Mathématiques','Physique-Chimie','SVT'}; assert r['language']=='fr'; assert r['source_ids']
  lessons.setdefault(r['lesson'],set()).add(split)
  if r['instruction'].startswith('Retourne uniquement un JSON'): json.loads(r['response'])
assert all(len(v)==1 for v in lessons.values()),'lesson leakage across splits'
assert total>=300,total
print(f'PASS: {total} examples; {len(lessons)} lesson groups; no cross-split leakage')


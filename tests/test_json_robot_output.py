import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def test_robot_json_examples():
 found=0
 for p in (ROOT/'data/processed').glob('edulab_teacher_*.jsonl'):
  for line in p.read_text(encoding='utf-8').splitlines():
   r=json.loads(line)
   if r['instruction'].startswith('Retourne uniquement un JSON'):
    obj=json.loads(r['response']); assert {'teacher_text','board_content','avatar_state','checkpoint','sources'}<=set(obj); found+=1
 assert found>=30

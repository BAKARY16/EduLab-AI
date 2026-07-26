"""Conservative exercise candidate detector; outputs candidates for human review."""
import argparse, json, re
from pathlib import Path
a=argparse.ArgumentParser(); a.add_argument('text'); ns=a.parse_args(); text=Path(ns.text).read_text(encoding='utf-8')
blocks=re.split(r'(?im)(?=exercice\s+\d+|question\s+\d+)',text)
out=[{'text':x.strip(),'validation_status':'pending_human_review'} for x in blocks if len(x.strip())>80]
print(json.dumps(out,ensure_ascii=False,indent=2))


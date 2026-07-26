"""Download only registry rows explicitly approved for a single public document."""
import argparse, hashlib
from pathlib import Path
import pandas as pd
import requests
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser(); p.add_argument("--source-id",required=True); p.add_argument("--confirm-rights",action="store_true"); a=p.parse_args()
 if not a.confirm_rights: raise SystemExit("Refused: pass --confirm-rights after human rights review")
 row=pd.read_csv(ROOT/'data/catalogs/source_registry.csv').set_index('source_id').loc[a.source_id]
 if row.download_rights not in {'document_public_unitaire','licence_CC-BY-NC-3.0'}: raise SystemExit(f"Refused: rights status is {row.download_rights}")
 r=requests.get(row.url,timeout=60,headers={'User-Agent':'EduLab-AI/1.0 single-document research'}); r.raise_for_status()
 out=ROOT/'data/raw'/f"{a.source_id}{Path(row.url).suffix or '.bin'}"; out.parent.mkdir(parents=True,exist_ok=True); out.write_bytes(r.content)
 print(out,hashlib.sha256(r.content).hexdigest())
if __name__=='__main__': main()

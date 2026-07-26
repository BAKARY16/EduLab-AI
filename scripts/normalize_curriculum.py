"""Validate and normalize the three curriculum catalog CSV files."""
from pathlib import Path
import pandas as pd
ROOT=Path(__file__).resolve().parents[1]
REQ={'class_name','series','subject','chapter','lesson','source_id','official_status','validation_status'}
for p in (ROOT/'data/catalogs').glob('curriculum_*.csv'):
 d=pd.read_csv(p); assert REQ<=set(d); d=d.drop_duplicates(['class_name','subject','lesson']); d.to_csv(p,index=False); print(p,len(d))


"""Export the curriculum CSVs as the web/API course-folder tree.

Fomesoutra is referenced as a community catalogue. No remote document is
downloaded or republished by this script.
"""
from __future__ import annotations
import json, re, unicodedata
from pathlib import Path
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
FILES=[ROOT/'data/catalogs/curriculum_3e.csv',ROOT/'data/catalogs/curriculum_terminale_c.csv',ROOT/'data/catalogs/curriculum_terminale_d.csv']
FOMESOUTRA={
 ('Troisième','Mathématiques'):'https://www.fomesoutra.com/cours/secondaire/3eme/mathematiques',
 ('Troisième','Physique-Chimie'):'https://www.fomesoutra.com/cours/secondaire/3eme/physique-chimie',
 ('Troisième','SVT'):'https://www.fomesoutra.com/cours/secondaire/3eme/svt',
 ('Terminale C','Mathématiques'):'https://www.fomesoutra.com/cours/secondaire/terminale/terminale-c',
 ('Terminale C','Physique-Chimie'):'https://www.fomesoutra.com/cours/secondaire/terminale/terminale-c',
 ('Terminale D','Mathématiques'):'https://www.fomesoutra.com/cours/secondaire/terminale/terminale-d',
 ('Terminale D','Physique-Chimie'):'https://www.fomesoutra.com/cours/secondaire/terminale/terminale-d',
 ('Terminale D','SVT'):'https://www.fomesoutra.com/cours/secondaire/terminale/terminale-d',
}
def slug(s):
 s=unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower()
 return re.sub(r'[^a-z0-9]+','-',s).strip('-')
def main():
 rows=pd.concat([pd.read_csv(p).fillna('') for p in FILES],ignore_index=True)
 levels=[]
 for class_name in ('Troisième','Terminale C','Terminale D'):
  subjects=[]; class_rows=rows[rows.class_name==class_name]
  for subject in ('Mathématiques','Physique-Chimie','SVT'):
   sr=class_rows[class_rows.subject==subject]
   if sr.empty: continue
   chapters=[]
   for chapter,cr in sr.groupby('chapter',sort=False):
    lessons=[]
    for _,r in cr.iterrows():
     lessons.append({'id':f"{slug(class_name)}-{slug(subject)}-{slug(r.lesson)}",'title':r.lesson,'chapter':chapter,'class_name':class_name,'series':r.series or None,'subject':subject,'source_ids':[r.source_id],'official_status':r.official_status,'validation_status':r.validation_status,'available':False})
    chapters.append({'id':slug(chapter),'title':chapter,'lessons':lessons})
   subjects.append({'id':slug(subject),'title':subject,'folder_url':FOMESOUTRA.get((class_name,subject)),'source_status':'community_metadata_only','chapters':chapters})
  levels.append({'id':slug(class_name),'title':class_name,'exam':'BEPC' if class_name=='Troisième' else 'BAC','subjects':subjects})
 payload={'version':'2026-07-24','scope':'EduLab exam classes','source_policy':'DPFC curriculum anchors; Fomesoutra community metadata only; no automatic redistribution','levels':levels}
 out=ROOT/'data/catalogs/course_tree.json'; out.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8'); print(out,sum(len(c['lessons']) for l in levels for s in l['subjects'] for c in s['chapters']))
if __name__=='__main__': main()


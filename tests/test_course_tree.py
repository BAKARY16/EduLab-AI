import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def test_course_tree_scope_and_hierarchy():
 data=json.loads((ROOT/'data/catalogs/course_tree.json').read_text(encoding='utf-8'))
 assert [x['title'] for x in data['levels']]==['Troisième','Terminale C','Terminale D']
 lessons=[lesson for level in data['levels'] for subject in level['subjects'] for chapter in subject['chapters'] for lesson in chapter['lessons']]
 assert len(lessons)>=40
 assert len({x['id'] for x in lessons})==len(lessons)
 assert all(x['source_ids'] for x in lessons)

def test_fomesoutra_is_metadata_only():
 data=json.loads((ROOT/'data/catalogs/course_tree.json').read_text(encoding='utf-8'))
 subjects=[s for level in data['levels'] for s in level['subjects']]
 assert all(s['source_status']=='community_metadata_only' for s in subjects)
 assert all(not any('download' in k for k in s) for s in subjects)


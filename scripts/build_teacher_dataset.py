"""Build grouped train/validation/test JSONL and analytical features."""
from bootstrap_teacher_project import ensure_dirs, build_dataset
if __name__=='__main__':
 ensure_dirs(); rows,splits,_=build_dataset(); print(len(rows),{k:len(v) for k,v in splits.items()})


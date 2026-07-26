"""Regenerate the traceable source and curriculum catalogs."""
from bootstrap_teacher_project import ensure_dirs, build_catalogs
if __name__ == "__main__":
    ensure_dirs(); build_catalogs(); print("Catalogues generated in data/catalogs")


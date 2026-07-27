"""Execute every Python cell of the learner analytics notebook in one scope."""
from __future__ import annotations

import os
from pathlib import Path

import matplotlib
import nbformat

matplotlib.use("Agg")
ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK = ROOT / "notebooks" / "06_student_learning_analytics_colab.ipynb"


def main() -> None:
    os.chdir(ROOT)
    namespace: dict[str, object] = {"__name__": "__notebook_validation__"}
    notebook = nbformat.read(NOTEBOOK, as_version=4)
    executed = 0
    for index, cell in enumerate(notebook.cells, start=1):
        if cell.cell_type != "code":
            continue
        try:
            exec(compile(cell.source, f"{NOTEBOOK.name}:cell-{index}", "exec"), namespace)
        except Exception as exc:
            raise RuntimeError(f"Notebook cell {index} failed") from exc
        executed += 1
    print(f"Validated {executed} code cells from {NOTEBOOK.name}")


if __name__ == "__main__":
    main()

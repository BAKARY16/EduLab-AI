"""Audit reproductible des données et artefacts EduLab AI.

Le script est en lecture seule et produit un rapport JSON exploitable en CI.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IGNORED = {".git", ".next", ".venv", "node_modules", "__pycache__"}
TEXT_SUFFIXES = {".csv", ".json", ".jsonl", ".md", ".py", ".ts", ".tsx", ".yaml", ".yml"}


def iter_project_files():
    for directory, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [name for name in dirnames if name not in IGNORED]
        for filename in filenames:
            yield Path(directory) / filename


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def audit() -> dict:
    files = list(iter_project_files())
    corrupt: list[dict] = []
    hashes: dict[tuple[str, int], list[str]] = {}
    for path in files:
        relative = path.relative_to(ROOT).as_posix()
        if path.suffix.lower() in TEXT_SUFFIXES:
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError as exc:
                corrupt.append({"path": relative, "issue": "invalid_utf8", "offset": exc.start})
            else:
                if "\ufffd" in text:
                    corrupt.append({"path": relative, "issue": "replacement_character", "count": text.count("\ufffd")})
        if path.stat().st_size and path.stat().st_size < 5 * 1024 * 1024:
            hashes.setdefault((sha256(path), path.stat().st_size), []).append(relative)

    duplicates = [paths for paths in hashes.values() if len(paths) > 1]
    dataset_rows = {}
    for split in ("train", "validation", "test"):
        path = ROOT / "data" / "processed" / f"edulab_teacher_{split}.jsonl"
        if path.exists():
            dataset_rows[split] = sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())

    # Ces dossiers sont exclus de l'audit de qualité : ils sont régénérables.
    # Leur mesure exhaustive ralentirait fortement la CI sous Windows.
    generated = {name: (ROOT / name).exists() for name in (".next", ".venv", "node_modules", ".pytest_cache")}

    suffix_bytes = Counter()
    for path in files:
        suffix_bytes[path.suffix.lower() or "[none]"] += path.stat().st_size

    return {
        "schema_version": "1.0",
        "status": "fail" if corrupt else "pass",
        "checks": {
            "utf8_integrity": {"passed": not corrupt, "findings": corrupt},
            "exact_duplicates": {"groups": duplicates},
            "dataset_splits": dataset_rows,
        },
        "storage": {
            "generated_directories_present": generated,
            "tracked_candidate_bytes_by_suffix": dict(suffix_bytes.most_common()),
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="reports/project_audit.json")
    parser.add_argument("--fail-on-quality", action="store_true")
    args = parser.parse_args()
    result = audit()
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": result["status"], "report": str(output), "splits": result["checks"]["dataset_splits"]}, ensure_ascii=False))
    raise SystemExit(1 if args.fail_on_quality and result["status"] != "pass" else 0)

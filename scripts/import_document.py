import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from rag.chunking import chunk_text
from rag.extraction import extract_text


def main() -> int:
    parser = argparse.ArgumentParser(description="Import contrôlé d'un document EduLab")
    parser.add_argument("--file", required=True, type=Path)
    parser.add_argument("--class-name", required=True)
    parser.add_argument("--subject", required=True)
    parser.add_argument("--source-name", required=True)
    parser.add_argument("--source-url")
    parser.add_argument("--official-status", choices=["official", "partner", "community", "unknown"], default="unknown")
    parser.add_argument("--validation-status", choices=["pending", "validated", "rejected"], default="pending")
    parser.add_argument("--max-size-mb", type=int, default=20)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    path = args.file.resolve()
    if not path.is_file() or path.stat().st_size > args.max_size_mb * 1024 * 1024:
        raise SystemExit("Fichier absent ou taille maximale dépassée")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    text = extract_text(path)
    chunks = chunk_text(text)
    report = {
        "file": str(path), "sha256": digest, "characters": len(text), "chunks": len(chunks),
        "class_name": args.class_name, "subject": args.subject,
        "official_status": args.official_status, "validation_status": args.validation_status,
        "indexed": False, "dry_run": args.dry_run,
    }
    output = ROOT / "data" / "processed" / f"{digest}.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    if not args.dry_run:
        output.write_text(json.dumps({"report": report, "chunks": chunks}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

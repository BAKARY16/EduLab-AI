"""Ingère un document authentique (PDF/DOCX/TXT/HTML/JSON/CSV) dans la base réelle.

Pipeline : extraction -> hash -> (source, knowledge_documents, knowledge_chunks).
Idempotent : relancer sur un fichier déjà ingéré (même contenu extrait) ne duplique rien,
le hash du texte extrait sert de clé (content_hash, unique en base).

Deux modes :

1) Un seul fichier, métadonnées explicites :
  python scripts/ingest_knowledge_documents.py \
      --path data/raw/dpfc/Troisième/Physique-Chimie/PHYSIQUE-CHIMIE_3eme.pdf \
      --title "Physique-Chimie 3e (DPFC)" --academic-class "Troisième" --subject "Physique-Chimie" \
      --document-type manuel --official-status official --validation-status pending \
      --source-name "DPFC" --source-base-url "https://www.dpfc-ci.net" \
      --source-owner "DPFC" --source-type gouvernemental

2) Un dossier rangé "niveau/matière/fichier" — la classe et la matière sont déduites
   du chemin, un document par fichier trouvé :
  python scripts/ingest_knowledge_documents.py --batch-root data/raw/dpfc \
      --document-type manuel --official-status official --validation-status pending \
      --source-name "DPFC" --source-base-url "https://www.dpfc-ci.net" \
      --source-owner "DPFC" --source-type gouvernemental
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import psycopg  # noqa: E402
from psycopg.rows import dict_row  # noqa: E402

from rag.chunking import chunk_by_curriculum_headings  # noqa: E402
from rag.extraction import extract_text  # noqa: E402


def _load_database_url() -> str:
    env_path = ROOT / ".env.local"
    if not env_path.exists():
        raise RuntimeError(".env.local introuvable — DATABASE_URL requis pour se connecter à la vraie base.")
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().split("?", 1)[0]
    raise RuntimeError("DATABASE_URL absent de .env.local")


def _connect() -> psycopg.Connection:
    return psycopg.connect(_load_database_url(), sslmode="require", row_factory=dict_row)


def get_or_create_source(conn: psycopg.Connection, *, name: str, base_url: str, owner: str, source_type: str,
                          official_status: str, allowed_ingestion_mode: str, requires_manual_download: bool,
                          terms_review_status: str, notes: str | None) -> Any:
    with conn.cursor() as cur:
        cur.execute("select id from sources where name = %s", (name,))
        row = cur.fetchone()
        if row:
            return row["id"]
        cur.execute(
            """insert into sources (name, base_url, owner, source_type, official_status,
                   allowed_ingestion_mode, requires_manual_download, terms_review_status, notes)
               values (%s,%s,%s,%s,%s,%s,%s,%s,%s) returning id""",
            (name, base_url, owner, source_type, official_status, allowed_ingestion_mode,
             requires_manual_download, terms_review_status, notes),
        )
        conn.commit()
        return cur.fetchone()["id"]


def ingest(conn: psycopg.Connection, *, path: Path, source_id: Any, title: str, document_type: str,
           academic_class: str, subject: str, year: int | None, official_status: str,
           validation_status: str, source_url: str | None) -> dict:
    try:
        text_content = extract_text(path)
    except Exception as exc:
        return {"status": "extraction_failed", "path": str(path), "error": str(exc)}
    if not text_content.strip():
        return {"status": "empty_extraction", "path": str(path)}
    content_hash = hashlib.sha256(text_content.encode("utf-8")).hexdigest()

    with conn.cursor() as cur:
        cur.execute("select id from knowledge_documents where content_hash = %s", (content_hash,))
        existing = cur.fetchone()
        if existing:
            return {"status": "already_ingested", "document_id": str(existing["id"]), "content_hash": content_hash}

        storage_path = path.relative_to(ROOT).as_posix()  # toujours des '/', portable entre OS
        cur.execute(
            """insert into knowledge_documents
                 (source_id, title, source_url, document_type, academic_class, subject, year,
                  official_status, validation_status, content_hash, storage_path, metadata)
               values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) returning id""",
            (source_id, title, source_url, document_type, academic_class, subject, year,
             official_status, validation_status, content_hash, storage_path,
             json.dumps({"extracted_chars": len(text_content)})),
        )
        document_id = cur.fetchone()["id"]

        pieces = chunk_by_curriculum_headings(text_content)
        for i, piece in enumerate(pieces):
            cur.execute(
                "insert into knowledge_chunks (document_id, chunk_index, content, competency, lesson) values (%s,%s,%s,%s,%s)",
                (document_id, i, piece["text"], piece["competency"], piece["lesson"]),
            )
    conn.commit()
    return {"status": "ingested", "document_id": str(document_id), "content_hash": content_hash, "chunks": len(pieces)}


SUPPORTED_SUFFIXES = {".pdf", ".docx", ".txt", ".html", ".htm", ".json", ".csv"}


def title_from_filename(path: Path, academic_class: str, subject: str, source_name: str) -> str:
    stem = path.stem.replace("_", " ").replace("-", " ").strip()
    return f"{stem} — {subject} {academic_class} ({source_name})"


def iter_batch_files(batch_root: Path):
    """Parcourt batch_root/<niveau>/<matière>/<fichier> et déduit classe + matière du chemin."""
    for level_dir in sorted(p for p in batch_root.iterdir() if p.is_dir()):
        for subject_dir in sorted(p for p in level_dir.iterdir() if p.is_dir()):
            for file_path in sorted(subject_dir.iterdir()):
                if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_SUFFIXES:
                    yield file_path, level_dir.name, subject_dir.name


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--path", type=Path, help="Un seul fichier à ingérer.")
    parser.add_argument("--batch-root", type=Path, help="Dossier organisé <niveau>/<matière>/<fichier> à ingérer en lot.")
    parser.add_argument("--title", help="Requis si --path est utilisé seul.")
    parser.add_argument("--academic-class", help="Requis si --path est utilisé seul.")
    parser.add_argument("--subject", help="Requis si --path est utilisé seul.")
    parser.add_argument("--document-type", required=True, help="manuel, exercices, sujet_examen, correction, ...")
    parser.add_argument("--official-status", required=True, help="official, community, ai_generated")
    parser.add_argument("--validation-status", default="pending", help="pending, validated, rejected")
    parser.add_argument("--year", type=int, default=None)
    parser.add_argument("--source-url", default=None)
    parser.add_argument("--source-name", required=True)
    parser.add_argument("--source-base-url", required=True)
    parser.add_argument("--source-owner", required=True)
    parser.add_argument("--source-type", required=True, help="gouvernemental, communautaire, import_manuel")
    parser.add_argument("--allowed-ingestion-mode", default="manual")
    parser.add_argument("--requires-manual-download", action="store_true", default=True)
    parser.add_argument("--terms-review-status", default="pending")
    parser.add_argument("--source-notes", default=None)
    args = parser.parse_args()

    if not args.path and not args.batch_root:
        print(json.dumps({"status": "missing_argument", "reason": "--path ou --batch-root requis"}, ensure_ascii=False))
        raise SystemExit(1)

    conn = _connect()
    try:
        source_id = get_or_create_source(
            conn, name=args.source_name, base_url=args.source_base_url, owner=args.source_owner,
            source_type=args.source_type, official_status=args.official_status,
            allowed_ingestion_mode=args.allowed_ingestion_mode,
            requires_manual_download=args.requires_manual_download,
            terms_review_status=args.terms_review_status, notes=args.source_notes,
        )

        if args.batch_root:
            batch_root = args.batch_root if args.batch_root.is_absolute() else ROOT / args.batch_root
            if not batch_root.exists():
                print(json.dumps({"status": "folder_not_found", "path": str(batch_root)}, ensure_ascii=False))
                raise SystemExit(1)
            results = []
            for file_path, academic_class, subject in iter_batch_files(batch_root):
                try:
                    result = ingest(
                        conn, path=file_path, source_id=source_id,
                        title=title_from_filename(file_path, academic_class, subject, args.source_name),
                        document_type=args.document_type, academic_class=academic_class, subject=subject,
                        year=args.year, official_status=args.official_status,
                        validation_status=args.validation_status, source_url=args.source_url,
                    )
                except Exception as exc:
                    conn.rollback()
                    result = {"status": "error", "error": str(exc)}
                result["file"] = file_path.name
                result["academic_class"] = academic_class
                result["subject"] = subject
                results.append(result)
            print(json.dumps({"batch": results, "count": len(results)}, ensure_ascii=False, indent=2))
        else:
            if not (args.title and args.academic_class and args.subject):
                print(json.dumps({"status": "missing_argument", "reason": "--title/--academic-class/--subject requis avec --path"}, ensure_ascii=False))
                raise SystemExit(1)
            path = args.path if args.path.is_absolute() else ROOT / args.path
            if not path.exists():
                print(json.dumps({"status": "file_not_found", "path": str(path)}, ensure_ascii=False))
                raise SystemExit(1)
            result = ingest(
                conn, path=path, source_id=source_id, title=args.title, document_type=args.document_type,
                academic_class=args.academic_class, subject=args.subject, year=args.year,
                official_status=args.official_status, validation_status=args.validation_status,
                source_url=args.source_url,
            )
            print(json.dumps(result, ensure_ascii=False))
    finally:
        conn.close()


if __name__ == "__main__":
    main()

from __future__ import annotations

import hashlib
import json
import re
import sqlite3
import threading
import time
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = ROOT / "ml/artifacts/tutor_cache/cache.sqlite3"
_LOCK = threading.Lock()


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return " ".join(re.findall(r"[a-z0-9]+|[+*/=<>-]", text))


def math_signature(text: str) -> str:
    normalized = normalize(text)
    return "|".join(re.findall(r"\d+(?:[.,]\d+)?|ln|exp|sqrt|[+*/=<>-]", normalized))


class SemanticTutorCache:
    def __init__(self, path: Path = DEFAULT_DB, ttl_seconds: int = 30 * 24 * 3600):
        self.path = path
        self.ttl_seconds = ttl_seconds
        path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.execute("""create table if not exists tutor_cache (
                cache_key text primary key, class_name text not null, subject text not null,
                normalized_query text not null, math_signature text not null,
                response_json text not null, created_at real not null, hits integer not null default 0
            )""")

    def _connect(self):
        return sqlite3.connect(self.path, timeout=5)

    @staticmethod
    def key(class_name: str, subject: str, instruction: str, source_ids: list[str]) -> str:
        raw = json.dumps([class_name, subject, normalize(instruction), sorted(source_ids)], ensure_ascii=False)
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, class_name: str, subject: str, instruction: str, source_ids: list[str], similarity: float = .91) -> dict[str, Any] | None:
        key = self.key(class_name, subject, instruction, source_ids)
        cutoff = time.time() - self.ttl_seconds
        query = normalize(instruction)
        signature = math_signature(instruction)
        with _LOCK, self._connect() as conn:
            row = conn.execute("select cache_key,response_json from tutor_cache where cache_key=? and created_at>=?", (key, cutoff)).fetchone()
            if row is None:
                candidates = conn.execute("select cache_key,normalized_query,response_json from tutor_cache where class_name=? and subject=? and math_signature=? and created_at>=? order by created_at desc limit 100", (class_name, subject, signature, cutoff)).fetchall()
                best = max(candidates, key=lambda item: SequenceMatcher(None, query, item[1]).ratio(), default=None)
                if best is None or SequenceMatcher(None, query, best[1]).ratio() < similarity:
                    return None
                row = (best[0], best[2])
            conn.execute("update tutor_cache set hits=hits+1 where cache_key=?", (row[0],))
            value = json.loads(row[1]); value["cache_hit"] = True
            return value

    def put(self, class_name: str, subject: str, instruction: str, source_ids: list[str], response: dict[str, Any]) -> None:
        key = self.key(class_name, subject, instruction, source_ids)
        clean = dict(response); clean.pop("cache_hit", None)
        with _LOCK, self._connect() as conn:
            conn.execute("insert or replace into tutor_cache(cache_key,class_name,subject,normalized_query,math_signature,response_json,created_at,hits) values(?,?,?,?,?,?,?,coalesce((select hits from tutor_cache where cache_key=?),0))", (key,class_name,subject,normalize(instruction),math_signature(instruction),json.dumps(clean,ensure_ascii=False),time.time(),key))


tutor_cache = SemanticTutorCache()

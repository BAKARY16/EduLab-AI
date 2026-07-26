from services.cache.semantic import SemanticTutorCache


def test_exact_and_safe_similar_cache():
    from pathlib import Path
    from uuid import uuid4
    path = Path("ml/artifacts") / f"test_semantic_cache_{uuid4().hex}.sqlite3"
    cache = SemanticTutorCache(path)
    response = {"answer": "x = 3", "sources": []}
    cache.put("Terminale D", "Mathématiques", "Résoudre ln(x)=3", ["doc-1"], response)
    assert cache.get("Terminale D", "Mathématiques", "Résoudre ln(x)=3", ["doc-1"])["cache_hit"] is True
    # Une valeur numérique différente ne doit jamais réutiliser la correction.
    assert cache.get("Terminale D", "Mathématiques", "Résoudre ln(x)=8", ["doc-1"]) is None

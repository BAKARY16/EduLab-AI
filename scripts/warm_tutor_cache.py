"""Préchauffe les exposés et démonstrations afin qu'un cours démarre instantanément."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from rag.retrieval.search import search  # noqa: E402
from services.cache.semantic import tutor_cache  # noqa: E402

DATA = ROOT / "data/curated/terminale_d_logarithmes.json"


def warm() -> dict:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    count = 0
    for lesson in data["lessons"]:
        scope = f"le cours « {lesson['title']} »"
        prompts = [
            f"Fais un exposé très résumé de {scope} pour {data['class_name']}. Donne l’objectif, 3 à 5 idées essentielles, les formules indispensables, un exemple calculé et une question de vérification. Appuie-toi d'abord sur le RAG; s'il est insuffisant, utilise la recherche autorisée et distingue clairement ces sources.",
            f"Agis comme un professeur de mathématiques au tableau. Pour {scope}, choisis un calcul pertinent et écris: données, domaine, propriété utilisée, transformations une par une, vérification et conclusion. Aucun saut de calcul. Si le RAG est insuffisant, complète par une recherche autorisée et cite-la.",
        ]
        answer = (
            f"{lesson['title']}\n\nObjectif : {lesson['objective']}\n\nEssentiel à retenir\n{lesson['summary']}\n\n"
            + "Démonstration au tableau\n" + "\n".join(f"{i}. {step}" for i, step in enumerate(lesson["board_demo"], 1))
            + f"\n\nVérification : {lesson['exercises'][0]['question']}"
        )
        for prompt in prompts:
            hits = search(prompt, k=4, subject=data["subject"], academic_class=data["class_name"])
            sources = [{"document_id":h.document_id,"title":h.source,"url":h.source_url,"score":h.score,"official_status":h.official_status,"validation_status":h.validation_status} for h in hits]
            exercise = lesson["exercises"][0]
            response = {"mode":"precomputed_grounded_course","answer":answer,"checkpoint":{"question":exercise["question"],"choices":exercise.get("choices",[]),"correct_index":exercise.get("correct_index"),"explanation":exercise["answer"]},"sources":sources,"rag_used":True,"web_research_used":False,"cache_hit":False}
            tutor_cache.put(data["class_name"], data["subject"], prompt, [h.document_id for h in hits], response)
            count += 1
    return {"lessons": len(data["lessons"]), "cached_presentations": count}


if __name__ == "__main__":
    print(json.dumps(warm(), ensure_ascii=False))

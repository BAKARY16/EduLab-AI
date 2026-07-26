"""Ajoute les cours mathématiques validés à l'index local et reconstruit TF-IDF."""
from __future__ import annotations

import json
import pickle
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer

ROOT = Path(__file__).resolve().parents[1]
CURATED = ROOT / "data/curated/terminale_d_logarithmes.json"
INDEX = ROOT / "ml/artifacts/rag_index"


def build() -> dict:
    document = json.loads(CURATED.read_text(encoding="utf-8"))
    chunks_path = INDEX / "chunks.json"
    chunks = json.loads(chunks_path.read_text(encoding="utf-8")) if chunks_path.exists() else []
    curated_ids = {lesson["id"] for lesson in document["lessons"]}
    chunks = [chunk for chunk in chunks if chunk.get("document_id") not in curated_ids]
    for lesson in document["lessons"]:
        exercises = " ".join(
            f"Exercice: {item['question']} Indices: {' '.join(item['hints'])} Correction: {item['answer']}"
            for item in lesson["exercises"]
        )
        text = f"Objectif: {lesson['objective']} Cours: {lesson['summary']} Démonstration au tableau: {'; '.join(lesson['board_demo'])}. {exercises}"
        chunks.append({
            "id": f"chunk-{lesson['id']}", "document_id": lesson["id"], "text": text,
            "source": lesson["source_title"], "subject": document["subject"],
            "academic_class": document["class_name"], "official_status": "community_fomesoutra",
            "validation_status": "validated", "competency": document["notion"], "lesson": lesson["title"],
            "source_url": lesson["source_url"],
        })
    vectorizer = TfidfVectorizer(max_features=20000, ngram_range=(1, 2), strip_accents="unicode", sublinear_tf=True)
    matrix = vectorizer.fit_transform([chunk["text"] for chunk in chunks])
    INDEX.mkdir(parents=True, exist_ok=True)
    chunks_path.write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")
    with (INDEX / "vectorizer.pkl").open("wb") as stream: pickle.dump(vectorizer, stream)
    with (INDEX / "matrix.pkl").open("wb") as stream: pickle.dump(matrix, stream)
    tree_path = ROOT / "data/catalogs/course_tree.json"
    tree = json.loads(tree_path.read_text(encoding="utf-8"))
    level = next(item for item in tree["levels"] if item["title"] == "Terminale D")
    subject = next(item for item in level["subjects"] if item["title"] == "Mathématiques")
    chapter = next((item for item in subject["chapters"] if item["title"] == document["notion"]), None)
    if chapter is None:
        chapter = {"id": "fonctions-logarithmes", "title": document["notion"], "lessons": []}
        subject["chapters"].append(chapter)
    source_ids = ["FOM-LN-COURSE-1", "FOM-LN-COURSE-2", "FOM-LN-COURSE-3"]
    exercise_ids = ["FOM-LN-EXO-1", "FOM-LN-EXO-2", "FOM-LN-EXO-3"]
    chapter["lessons"] = [{
        "id": lesson["id"], "title": lesson["title"], "chapter": document["notion"],
        "class_name": document["class_name"], "series": "D", "subject": document["subject"],
        "source_ids": [source_ids[index], exercise_ids[index]], "official_status": "community_fomesoutra",
        "validation_status": "curated", "available": True,
    } for index, lesson in enumerate(document["lessons"])]
    tree_path.write_text(json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"chunks": len(chunks), "curated_math_lessons": len(document["lessons"]), "index": "tfidf_word_bigram"}


if __name__ == "__main__":
    print(json.dumps(build(), ensure_ascii=False))

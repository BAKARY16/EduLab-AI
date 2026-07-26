"""Prompts gelés utilisés pour tester la couverture du professeur IA."""
PROMPTS = [
    (level, subject, "Explique une notion avec une source et une vérification.")
    for level in ("Troisième", "Terminale C", "Terminale D")
    for subject in ("Mathématiques", "Physique-Chimie", "SVT")
]

if __name__ == "__main__":
    import json
    print(json.dumps({"evaluation_cases": len(PROMPTS), "prompts": PROMPTS}, ensure_ascii=False))

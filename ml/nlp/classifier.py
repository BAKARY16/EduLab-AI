import re
from dataclasses import dataclass


SUBJECT_PATTERNS = {
    "Mathématiques": r"équation|fonction|triangle|racine|calcul|statistique|vecteur",
    "Physique-Chimie": r"tension|intensité|résistance|courant|force|vitesse|ph|réaction",
    "SVT": r"digestion|sang|vih|sol|plante|reproduction|nutrition",
}


@dataclass(frozen=True)
class Classification:
    subject: str | None
    intent: str
    confidence: float


def classify(text: str) -> Classification:
    normalized = text.lower()
    subject = next((name for name, pattern in SUBJECT_PATTERNS.items() if re.search(pattern, normalized)), None)
    intent = "exercise" if re.search(r"exercice|corrige|résous", normalized) else "explanation"
    if re.search(r"simplifie|plus simple|je ne comprends", normalized):
        intent = "simplify"
    return Classification(subject=subject, intent=intent, confidence=0.9 if subject else 0.5)

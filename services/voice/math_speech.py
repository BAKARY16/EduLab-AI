from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

import httpx


# Toute modification des règles doit changer cette version. Elle fait partie de la
# clé MP3 et empêche qu'une ancienne prononciation soit resservie.
MATH_SPEECH_VERSION = "fr-math-v3-2026-07-24"


def prepare_for_speech(text: str) -> str:
    """Produit une copie vocale déterministe; le tableau garde les formules exactes."""
    spoken = text
    intervals = [
        (r"\]([^,;\[\]]+),\s*([^\[\]]+)\[", r" intervalle ouvert de \1 à \2 "),
        (r"\[([^,;\[\]]+),\s*([^\[\]]+)\]", r" intervalle fermé de \1 à \2 "),
        (r"\[([^,;\[\]]+),\s*([^\[\]]+)\[", r" intervalle fermé à gauche et ouvert à droite, de \1 à \2 "),
        (r"\]([^,;\[\]]+),\s*([^\[\]]+)\]", r" intervalle ouvert à gauche et fermé à droite, de \1 à \2 "),
    ]
    for pattern, replacement in intervals:
        spoken = re.sub(pattern, replacement, spoken)

    replacements = {
        "→": " tend vers ", "↦": " associe à ", "∞": " l'infini ",
        "≤": " inférieur ou égal à ", "≥": " supérieur ou égal à ",
        "≠": " différent de ", "∈": " appartient à ", "∉": " n'appartient pas à ",
        "±": " plus ou moins ", "√": " racine carrée de ", "∑": " somme de ",
        "∫": " intégrale de ", "²": " au carré ", "³": " au cube ",
        "×": " multiplié par ", "·": " multiplié par ", "÷": " divisé par ",
    }
    for symbol, words in replacements.items():
        spoken = spoken.replace(symbol, words)

    spoken = re.sub(r"\bln\s*\(([^()]+)\)", r" logarithme népérien de \1 ", spoken, flags=re.I)
    spoken = re.sub(r"\bln\b", " logarithme népérien ", spoken, flags=re.I)
    spoken = re.sub(r"\bexp\s*\(([^()]+)\)", r" exponentielle de \1 ", spoken, flags=re.I)
    spoken = re.sub(r"\bexp\b", " exponentielle ", spoken, flags=re.I)
    spoken = spoken.replace("=", " égale ").replace("+", " plus ")
    spoken = spoken.replace("/", " divisé par ").replace(">", " strictement supérieur à ").replace("<", " strictement inférieur à ")
    spoken = re.sub(r"(?<!\w)-(?!\s*$)", " moins ", spoken)
    spoken = spoken.replace("(", " ").replace(")", " ").replace("[", " ").replace("]", " ")
    return re.sub(r"\s+", " ", spoken).strip()


def _response_text(data: dict[str, Any]) -> str:
    if data.get("output_text"):
        return str(data["output_text"]).strip()
    return "".join(
        str(part.get("text", ""))
        for item in data.get("output", []) if item.get("type") == "message"
        for part in item.get("content", []) if part.get("type") == "output_text"
    ).strip()


def prepare_for_speech_with_openai(text: str, settings: Any) -> str:
    """Demande à OpenAI une lecture mathématique fidèle, avec repli déterministe."""
    fallback = prepare_for_speech(text)
    if not getattr(settings, "openai_api_key", None):
        return fallback

    cache_dir = Path(__file__).resolve().parents[2] / "ml" / "artifacts" / "voice_scripts"
    key = hashlib.sha256(f"{MATH_SPEECH_VERSION}|{text}".encode("utf-8")).hexdigest()
    target = cache_dir / f"{key}.txt"
    if target.exists():
        return target.read_text(encoding="utf-8").strip()

    instructions = """Tu prépares le texte oral d'un professeur de mathématiques francophone.
Réécris uniquement pour la prononciation, sans changer un nombre, un signe, une hypothèse ou le résultat.
Lis explicitement chaque opération et relation: plus, moins, multiplié par, divisé par, égale,
strictement inférieur/supérieur, inférieur/supérieur ou égal, appartient à. Lis correctement les
intervalles ouverts/fermés, l'infini, les puissances, racines, fractions, logarithmes, exponentielles,
dérivées, sommes et intégrales. Transforme les étapes du tableau en phrases naturelles et pédagogiques.
Ne renvoie ni markdown, ni commentaire, ni formule symbolique: uniquement le texte à faire prononcer."""
    try:
        response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"},
            json={
                "model": settings.openai_model,
                "instructions": instructions,
                "input": text,
                "reasoning": {"effort": "low"},
                "text": {"verbosity": "low"},
                "max_output_tokens": 1200,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        prepared = _response_text(response.json())
        if not prepared:
            return fallback
        cache_dir.mkdir(parents=True, exist_ok=True)
        target.write_text(prepared, encoding="utf-8")
        return prepared
    except (httpx.HTTPError, ValueError, OSError):
        return fallback

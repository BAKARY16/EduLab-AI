from __future__ import annotations

from typing import Any
import httpx


PEDAGOGICAL_INSTRUCTIONS = """Tu es le cerveau pédagogique d'EduLab AI, professeur de sciences du secondaire ivoirien.
Réponds en français clair et naturel. Adapte le vocabulaire au niveau indiqué.
Pour les cours: annonce le domaine, nomme la propriété, déroule chaque transformation sans saut, vérifie puis conclus.
Sépare ce qui vient du cours, ce qui vient d'une source web et ton explication. N'invente jamais une source.
Sur le tableau, écris chaque expression mathématique sur une ligne séparée préfixée par FORMULE: ou CALCUL:.
Conserve les symboles exacts au tableau. Dans les phrases explicatives, nomme oralement chaque symbole et chaque intervalle.
Termine par une courte question permettant d'évaluer la compréhension de l'apprenant."""


PEDAGOGICAL_INSTRUCTIONS += """
Utilise en priorité le contexte officiel DPFC fourni, puis les sources éducatives et web explicitement fournies.
Si le contexte est insuffisant, dis-le sans inventer. Ne transforme jamais une hypothèse en fait.
Pour une démonstration, structure la réponse avec DONNÉES, PROPRIÉTÉ, CALCULS, VÉRIFICATION et CONCLUSION.
"""


def generate_openai(settings: Any, payload: dict[str, Any]) -> dict[str, Any]:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY absente")
    user_input = f"Niveau: {payload['class_name']}\nMatière: {payload['subject']}\nConsigne: {payload['instruction']}\n\nCONTEXTE SOURCÉ:\n{payload.get('context','')}"
    response = httpx.post(
        "https://api.openai.com/v1/responses",
        headers={"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"},
        json={
            "model": settings.openai_model,
            "instructions": PEDAGOGICAL_INSTRUCTIONS,
            "input": user_input,
            "reasoning": {"effort": settings.openai_reasoning_effort},
            "text": {"verbosity": "medium"},
            "max_output_tokens": payload.get("max_new_tokens", 192) * 2,
            "store": False,
        }, timeout=45,
    )
    response.raise_for_status()
    data = response.json()
    answer = data.get("output_text")
    if not answer:
        answer = "".join(
            part.get("text", "") for item in data.get("output", []) if item.get("type") == "message"
            for part in item.get("content", []) if part.get("type") == "output_text"
        )
    return {"answer": answer.strip(), "mode": "openai_reasoning", "model": settings.openai_model, "response_id": data.get("id")}

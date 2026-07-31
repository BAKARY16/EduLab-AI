"""Optional Gemini research provider with Google Search grounding.

Gemini is used as an additional retrieval/research channel. OpenAI remains
the final pedagogical reasoning engine, so the learner receives one coherent
answer instead of a mixture of competing model outputs.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import httpx


@dataclass
class GeminiResearchResult:
    text: str
    sources: list[dict[str, Any]]
    model: str


def _domain(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def research_with_gemini(settings: Any, query: str, allowed_domains: set[str]) -> GeminiResearchResult | None:
    if not settings.gemini_api_key or not query.strip():
        return None
    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
    )
    prompt = (
        "Recherche des informations pédagogiques fiables pour un élève ivoirien. "
        "Privilégie les programmes officiels, universités et organismes éducatifs. "
        "N'invente aucune référence et distingue les faits vérifiés des explications.\n\n"
        f"Question : {query}"
    )
    response = httpx.post(
        endpoint,
        headers={"x-goog-api-key": settings.gemini_api_key, "Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "tools": [{"google_search": {}}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 900},
        },
        timeout=35,
    )
    response.raise_for_status()
    data = response.json()
    candidates = data.get("candidates") or []
    if not candidates:
        return None
    candidate = candidates[0]
    parts = candidate.get("content", {}).get("parts", [])
    text = "\n".join(part.get("text", "") for part in parts if part.get("text")).strip()
    metadata = candidate.get("groundingMetadata", {})
    sources: list[dict[str, Any]] = []
    for chunk in metadata.get("groundingChunks", []):
        web = chunk.get("web") or {}
        url = web.get("uri", "")
        domain = _domain(url)
        if not url or not any(domain == allowed or domain.endswith(f".{allowed}") for allowed in allowed_domains):
            continue
        sources.append({
            "document_id": None,
            "title": web.get("title") or domain,
            "url": url,
            "score": None,
            "official_status": "web_grounded",
            "validation_status": "web_unverified",
        })
    return GeminiResearchResult(text=text, sources=sources[:5], model=settings.gemini_model)

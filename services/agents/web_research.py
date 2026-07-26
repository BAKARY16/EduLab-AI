"""Recherche web contrôlée, limitée aux domaines autorisés, appelée seulement quand
le RAG local est insuffisant (pas de contenu, question précise, vérification externe).

Chaque résultat est étiqueté officiel (institutions ivoiriennes) ou communautaire
(Fomesoutra), et marqué non vérifié pédagogiquement : la présence dans la liste blanche
et l'accessibilité technique du lien ne valent pas validation humaine du contenu.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

OFFICIAL_DOMAINS = {"dpfc-ci.net", "ecole-ci.org", "education.gouv.ci", "men-deco.org", "gouv.ci"}
COMMUNITY_DOMAINS = {"fomesoutra.com"}
ALLOWED_DOMAINS = OFFICIAL_DOMAINS | COMMUNITY_DOMAINS

SERPAPI_URL = "https://serpapi.com/search.json"


@dataclass
class WebResult:
    title: str
    url: str
    excerpt: str
    domain: str
    official_status: str  # "official" | "community"
    verified: bool  # vérification technique seulement — pas une validation pédagogique humaine


def _domain_of(url: str) -> str:
    return urlparse(url).netloc.removeprefix("www.")


def _allowed(domain: str) -> bool:
    return any(domain == d or domain.endswith(f".{d}") for d in ALLOWED_DOMAINS)


def _official_status(domain: str) -> str:
    return "official" if any(domain == d or domain.endswith(f".{d}") for d in OFFICIAL_DOMAINS) else "community"


class WebResearchAgent:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("SERPAPI_API_KEY")

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def search(self, query: str, k: int = 3) -> list[WebResult]:
        if not self.configured or not query.strip():
            return []

        site_filter = " OR ".join(f"site:{d}" for d in ALLOWED_DOMAINS)
        params = {"engine": "google", "q": f"{query} ({site_filter})", "num": k, "api_key": self.api_key}
        try:
            response = httpx.get(SERPAPI_URL, params=params, timeout=15.0)
            response.raise_for_status()
            data = response.json()
        except Exception:
            return []

        results: list[WebResult] = []
        for item in data.get("organic_results", []):
            url = item.get("link", "")
            domain = _domain_of(url)
            # Défense en profondeur : on ignore tout résultat hors liste blanche même
            # si le filtre "site:" ci-dessus aurait dû suffire.
            if not _allowed(domain):
                continue
            results.append(
                WebResult(
                    title=item.get("title", ""),
                    url=url,
                    excerpt=item.get("snippet", ""),
                    domain=domain,
                    official_status=_official_status(domain),
                    verified=False,
                )
            )
            if len(results) >= k:
                break
        return results

"""Rassemble, avant chaque intervention du professeur, tout le contexte disponible :
passage principal (le tableau), passages complémentaires du RAG, sources citées,
formules/définitions détectées dans ces passages.

Les exercices liés et l'historique de difficulté de l'apprenant restent des listes vides
tant que les tables correspondantes (exercises, learner_attempts) ne sont pas alimentées
par de vraies données — ce module ne fabrique rien, il expose honnêtement ce qui manque
plutôt que de l'inventer.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

try:
    from rag.retrieval import search as rag_search
except Exception:
    rag_search = None

try:
    from services.agents.web_research import WebResearchAgent
except Exception:
    WebResearchAgent = None

FORMULA_OPERATOR_PATTERN = re.compile(r"[=<>≤≥±√∑∫]")
DEFINITION_PATTERN = re.compile(
    r"\b(on (appelle|dit que)|on d[ée]finit|d[ée]finition\s*[:.]|se d[ée]finit comme)\b",
    re.IGNORECASE,
)


@dataclass
class TeacherContext:
    principal_passage: str | None
    complementary_passages: list[str] = field(default_factory=list)
    formulas: list[str] = field(default_factory=list)
    definitions: list[str] = field(default_factory=list)
    sources: list[dict] = field(default_factory=list)
    related_exercises: list[dict] = field(default_factory=list)
    known_student_difficulties: list[str] = field(default_factory=list)

    def as_prompt_context(self, max_chars: int = 4000) -> str:
        parts = ([self.principal_passage] if self.principal_passage else []) + self.complementary_passages
        return "\n---\n".join(p for p in parts if p)[:max_chars]


def build_teacher_context(
    instruction: str, subject: str, course_step_text: str = "", k: int = 2, academic_class: str | None = None
) -> TeacherContext:
    principal = course_step_text or None
    complementary: list[str] = []
    sources_by_title: dict[str, dict] = {}

    rag_hits = []
    if rag_search is not None:
        try:
            rag_hits = rag_search(instruction, k=k, subject=subject, academic_class=academic_class)
        except Exception:
            rag_hits = []
        for hit in rag_hits:
            complementary.append(hit.text)
            sources_by_title[hit.source] = {
                "title": hit.source,
                "official_status": hit.official_status,
                "validation_status": hit.validation_status,
            }

    # Recherche web contrôlée : seulement si le RAG local n'a rien trouvé de pertinent.
    if not rag_hits and WebResearchAgent is not None:
        try:
            agent = WebResearchAgent()
            web_hits = agent.search(instruction, k=2) if agent.configured else []
        except Exception:
            web_hits = []
        for hit in web_hits:
            complementary.append(f"{hit.title} — {hit.excerpt}")
            sources_by_title[hit.url] = {
                "title": hit.title,
                "official_status": hit.official_status,
                "validation_status": "pending",
            }

    combined_text = "\n".join(filter(None, [principal, *complementary]))
    lines = [line.strip() for line in combined_text.splitlines() if line.strip()]
    formulas = [line for line in lines if len(line) <= 200 and FORMULA_OPERATOR_PATTERN.search(line)][:5]
    definitions = [line for line in lines if DEFINITION_PATTERN.search(line)][:3]

    return TeacherContext(
        principal_passage=principal,
        complementary_passages=complementary,
        formulas=formulas,
        definitions=definitions,
        sources=list(sources_by_title.values()),
    )

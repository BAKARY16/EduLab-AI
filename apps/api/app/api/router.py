import dataclasses
import hashlib
import re
import unicodedata
import sys
import httpx
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.schemas.common import AvatarCommand, BoardBlock, TutorStep

sys.path.insert(0, str(Path(__file__).resolve().parents[4]))
from services.agents.web_research import ALLOWED_DOMAINS, WebResearchAgent  # noqa: E402
from services.voice.providers import VoiceProviderError, get_stt_provider, get_tts_provider  # noqa: E402
from services.voice.math_speech import MATH_SPEECH_VERSION, prepare_for_speech_with_openai  # noqa: E402
from services.voice.providers import OpenAISpeechToTextProvider  # noqa: E402
from services.cache.semantic import tutor_cache  # noqa: E402
from services.llm.openai_provider import generate_openai  # noqa: E402
from services.llm.gemini_provider import research_with_gemini  # noqa: E402
from rag.retrieval.search import search as rag_search  # noqa: E402

router = APIRouter()


class TutorStartRequest(BaseModel):
    learner_id: str | None = None
    class_name: str
    series: str | None = None
    subject: str
    chapter: str
    lesson: str
    language: str = "fr"
    preferred_style: str = "visuel"
    duration_minutes: int = Field(default=20, ge=5, le=120)


class LearnerStateRequest(BaseModel):
    accuracy: float = Field(ge=0, le=1)
    attempts: int = Field(ge=0)
    hints_used: int = Field(ge=0)
    inactivity_days: int = Field(ge=0)


class ResearchRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    class_name: str
    subject: str
    allowed_domains: list[str] = []
    freshness_required: bool = False


class AvatarRequest(BaseModel):
    state: str
    emotion: str = "calm"
    target: str | None = None

class RagSearchRequest(BaseModel):
    query: str = Field(min_length=3,max_length=1000)
    class_name: str
    subject: str
    top_k: int = Field(default=4,ge=1,le=10)

class TutorGenerateRequest(BaseModel):
    instruction: str = Field(min_length=3,max_length=2000)
    learner_question: str | None = Field(default=None, min_length=2, max_length=1000)
    session_topic: str | None = Field(default=None, max_length=500)
    session_context: str = Field(default="", max_length=6000)
    class_name: str
    subject: str
    context: str = Field(default="",max_length=4000)
    use_rag: bool = True
    allow_web_research: bool = True
    max_new_tokens: int = Field(default=240, ge=64, le=512)

def _generate_with_teacher(payload: dict[str,Any]) -> dict[str,Any]:
    settings=get_settings()
    try:
        # Sur CPU, une génération longue peut dépasser plusieurs minutes. La
        # classe bascule après 18 s vers le résumé extractif RAG ci-dessous au
        # lieu de laisser l'apprenant devant un tableau bloqué.
        response=httpx.post(f"{settings.teacher_model_url.rstrip('/')}/generate",json=payload,timeout=18)
        response.raise_for_status(); return response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503,detail=f"Service professeur IA indisponible: {exc}") from exc

@router.post("/rag/search",tags=["rag"])
def search_knowledge(payload:RagSearchRequest)->dict[str,Any]:
    hits=rag_search(payload.query,k=payload.top_k,subject=payload.subject,academic_class=payload.class_name)
    return {"query":payload.query,"filters":{"class_name":payload.class_name,"subject":payload.subject},"count":len(hits),"results":[dataclasses.asdict(h) for h in hits],"fallback_used":False}

@router.post("/tutor/generate",tags=["tutor"])
def generate_tutor(payload:TutorGenerateRequest)->dict[str,Any]:
    # La question brute reste l'intention de référence. Les longues consignes UI
    # (cours courant, format, sources) ne doivent jamais détourner la recherche.
    retrieval_query=(payload.learner_question or payload.instruction).strip()
    research_query=" ".join(part for part in (payload.session_topic, retrieval_query) if part).strip()
    hits=rag_search(retrieval_query,k=6,subject=payload.subject,academic_class=payload.class_name,allow_cross_class_fallback=True) if payload.use_rag else []
    query_terms={token for token in re.findall(r"[a-z0-9]{4,}", unicodedata.normalize("NFKD", retrieval_query).encode("ascii", "ignore").decode().lower())}
    def relevant(hit: Any) -> bool:
        haystack=unicodedata.normalize("NFKD", f"{hit.text} {hit.lesson or ''} {hit.competency or ''}").encode("ascii", "ignore").decode().lower()
        return not query_terms or sum(term in haystack for term in query_terms) >= min(2, len(query_terms))
    hits=[hit for hit in hits if relevant(hit)][:4]
    web_hits = []
    if payload.allow_web_research and (payload.learner_question or not hits or hits[0].score < 0.45):
        agent = WebResearchAgent()
        if agent.configured:
            web_hits = agent.search(research_query, k=4, allow_general=bool(payload.learner_question))
    settings = get_settings()
    gemini_result = None
    if payload.allow_web_research and settings.gemini_api_key and (not hits or hits[0].score < 0.45):
        try:
            gemini_result = research_with_gemini(
                settings,
                f"{payload.subject}, niveau {payload.class_name}: {research_query}",
                ALLOWED_DOMAINS,
            )
        except httpx.HTTPError:
            gemini_result = None
    rag_context="\n\n".join(f"[{i+1}] {h.text}\nSource: {h.source}" for i,h in enumerate(hits))
    web_context = "\n\n".join(f"[WEB {i+1}] {h.excerpt}\nSource: {h.title} — {h.url}" for i,h in enumerate(web_hits))
    source_ids = [h.document_id for h in hits]
    gemini_context = f"[GEMINI + GOOGLE SEARCH]\n{gemini_result.text}" if gemini_result and gemini_result.text else ""
    cache_query=f"{payload.session_topic or ''} | {retrieval_query}"
    cached = tutor_cache.get(payload.class_name, payload.subject, cache_query, source_ids)
    if cached is not None:
        return cached
    # Le service du petit modèle limite volontairement le contexte à 4 000
    # caractères. Les chunks PDF peuvent être longs : conserver le début des
    # passages les mieux classés plutôt que provoquer une erreur Pydantic 422.
    session_context=(f"[COURS ACTUEL — SUJET VERROUILLÉ: {payload.session_topic or payload.subject}]\n{payload.session_context}" if payload.session_context else "")
    # Pendant une leçon ouverte, le plan validé est l'autorité pédagogique.
    # Des anciens chunks peuvent être mal étiquetés (ex. probabilités dans une
    # leçon de géométrie) : ils ne doivent jamais contaminer la réponse. Le RAG
    # et le Web restent utilisés quand aucune matière de session n'est fournie.
    external_context = "" if payload.learner_question and payload.session_context else "\n\n".join(
        x for x in (rag_context, web_context, gemini_context) if x
    )
    context="\n\n".join(x for x in (session_context,payload.context,external_context) if x)[:12000]
    try:
        exact_instruction=(
            f"COURS ACTUEL: {payload.session_topic or payload.subject}\nQUESTION EXACTE DE L'APPRENANT: {retrieval_query}\n"
            "Réponds directement dans le cadre exclusif du cours actuel. Ignore tout passage hors sujet. "
            "Si une démonstration est utile, écris DONNÉES, PROPRIÉTÉ, puis chaque CALCUL sur une ligne."
        ) if payload.learner_question else payload.instruction
        model_payload = {"instruction":exact_instruction,"context":context,"class_name":payload.class_name,"subject":payload.subject,"max_new_tokens":payload.max_new_tokens}
        if settings.openai_api_key and settings.llm_provider in {"hybrid", "openai"}:
            try:
                result = generate_openai(settings, model_payload)
            except (httpx.HTTPError, RuntimeError) as openai_exc:
                # Un quota OpenAI épuisé ne doit pas court-circuiter le LoRA local.
                # Le LoRA 0.5B est conservé comme preuve technique mais sa sortie
                # n'est pas assez fiable pour répondre seul à un apprenant.
                raise openai_exc
        else:
            if payload.learner_question:
                raise RuntimeError("Aucun modèle de raisonnement pédagogique fiable disponible")
            result = _generate_with_teacher({**model_payload, "context":context[:4000]})
    except (HTTPException, httpx.HTTPError, RuntimeError) as exc:
        # Le modèle CPU peut être trop lent, ou l'API OpenAI peut répondre en
        # erreur (429 quota/rate-limit, 5xx, timeout réseau) : ces deux cas
        # doivent dégrader gracieusement, jamais renvoyer un 500 brut au cours.
        detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
        def normalize(value: str) -> str:
            value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
            return re.sub(r"[^a-z0-9=]+", " ", value)

        stopwords = {"avec", "dans", "pour", "cours", "resume", "fais", "donne", "cette", "notion", "eleve", "trois", "idees", "question"}
        query_tokens = {token for token in normalize(retrieval_query).split() if len(token) > 2 and token not in stopwords}
        candidates: list[tuple[float, str]] = []
        evidence_texts = [payload.session_context] if payload.session_context else [hit.text for hit in hits]
        if not payload.session_context:
            evidence_texts.extend(hit.excerpt for hit in web_hits)
        for evidence in evidence_texts:
            clean = re.sub(r"\s+", " ", evidence).strip()
            for sentence in re.split(r"(?<=[.!?])\s+|\s*[•▪]\s*", clean):
                sentence = sentence.replace("\uf0b7", "").strip(" -–—|{}")
                if not 6 <= len(sentence) <= 280:
                    continue
                normalized = normalize(sentence)
                overlap = sum(1 for token in query_tokens if token in normalized)
                score = overlap * 3 + (2 if "=" in sentence else 0) + (1 if any(word in normalized for word in ("definition", "loi", "relation", "unite", "utiliser")) else 0)
                if score > 0:
                    candidates.append((score, sentence))
        sentences = []
        for _, sentence in sorted(candidates, key=lambda item: item[0], reverse=True):
            if sentence not in sentences:
                sentences.append(sentence)
            if len(sentences) == 4:
                break
        board_candidates = re.findall(r"Démonstration au tableau:\s*(.*?)(?:\.\s*Exercice:|$)", context, re.IGNORECASE | re.DOTALL)
        instruction_tokens = set(normalize(payload.instruction).split())
        selected_board = max(
            board_candidates,
            key=lambda value: sum(1 for token in instruction_tokens if token in normalize(value)),
            default="",
        )
        board_steps = [step.strip(" .") for step in selected_board.split(";") if step.strip()] if selected_board else []
        essentials = "\n".join(f"• {sentence}" for sentence in sentences) or "Le contexte indexé est insuffisant pour produire un résumé fiable."
        calculation = "\n\nDémonstration au tableau\n" + "\n".join(f"{i}. {step}" for i, step in enumerate(board_steps, 1)) if board_steps else ""
        result = {
            "mode": "grounded_extractive",
            "answer": (
                f"Réponse dans le cours — {payload.session_topic or payload.subject}\n\n"
                f"Question : {retrieval_query}\n\n{essentials}{calculation}\n\n"
                "Vérification : reformule cette réponse avec tes propres mots."
            ) if payload.learner_question else f"Essentiel à retenir — {payload.subject}\n\n{essentials}{calculation}\n\nQuestion de vérification : quelle idée principale peux-tu reformuler avec tes propres mots ?",
            "latency_seconds": None,
            "warning": detail,
        }
    result["sources"]=[{"document_id":h.document_id,"title":h.source,"url":h.source_url,"score":h.score,"official_status":h.official_status,"validation_status":h.validation_status} for h in hits]
    result["sources"].extend({"document_id":None,"title":h.title,"url":h.url,"score":None,"official_status":h.official_status,"validation_status":"web_unverified"} for h in web_hits)
    if gemini_result:
        result["sources"].extend(gemini_result.sources)
    result["rag_used"]=bool(hits)
    result["web_research_used"]=bool(web_hits)
    result["gemini_grounding_used"]=bool(gemini_result)
    result["pipeline"]={
        "retrieval":"hybrid_local" if hits else "none",
        "web":"serpapi" if web_hits else "none",
        "research_model":gemini_result.model if gemini_result else "none",
        "reasoning_model":result.get("model") or result.get("mode", "grounded-extractive"),
    }
    result["cache_hit"] = False
    tutor_cache.put(payload.class_name, payload.subject, cache_query, source_ids, result)
    return result


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    language: str = "fr-FR"


@router.get("/health", tags=["health"])
def health(db: Session = Depends(get_db)) -> dict[str, Any]:
    database = "ok"
    try:
        db.execute(text("select 1"))
    except Exception:
        database = "unavailable"
    settings = get_settings()
    return {"status": "ok" if database == "ok" else "degraded", "database": database, "llm_mode": settings.llm_provider}


@router.get("/courses", tags=["courses"])
def list_courses(
    class_name: str | None = Query(default=None),
    subject: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    clauses = ["validated = true"]
    params: dict[str, Any] = {"limit": limit}
    if class_name:
        clauses.append("level = :class_name")
        params["class_name"] = class_name
    if subject:
        clauses.append("subject = :subject")
        params["subject"] = subject
    query = text(f"select id, key, level, subject, chapter, lesson, title, summary, source, validated from courses where {' and '.join(clauses)} order by subject, chapter limit :limit")
    return [dict(row) for row in db.execute(query, params).mappings()]


@router.get("/documents", tags=["documents"])
def list_documents(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    rows = db.execute(
        text("""
          select d.id::text, d.title, d.academic_class, d.subject, d.document_type,
                 d.official_status, d.validation_status, d.year, d.source_url,
                 s.name as source_name,
                 (select count(*) from knowledge_chunks c where c.document_id = d.id) as chunk_count
          from knowledge_documents d
          left join sources s on s.id = d.source_id
          order by d.academic_class, d.subject, d.title
        """)
    ).mappings().all()
    documents = [dict(row) for row in rows]

    if documents:
        lesson_rows = db.execute(
            text("""
              select document_id::text, lesson
              from knowledge_chunks
              where document_id in :ids and lesson is not null
            """).bindparams(bindparam("ids", expanding=True)),
            {"ids": [d["id"] for d in documents]},
        ).mappings().all()
        lessons_by_document: dict[str, set[str]] = {}
        for row in lesson_rows:
            lessons_by_document.setdefault(row["document_id"], set()).add(row["lesson"])
        for doc in documents:
            doc["lessons"] = sorted(lessons_by_document.get(doc["id"], set()))

    return documents


@router.post("/ml/scientific-qa", tags=["ml"])
def scientific_qa() -> dict[str, Any]:
    raise HTTPException(status_code=503, detail="Aucun artefact Scientific QA validé n'est installé.")


@router.post("/ml/learner-state", tags=["ml"])
def learner_state(payload: LearnerStateRequest) -> dict[str, Any]:
    mastery = max(0.0, min(1.0, payload.accuracy - 0.03 * payload.hints_used))
    disengagement = min(1.0, payload.inactivity_days / 14 + (0.2 if payload.attempts == 0 else 0))
    return {
        "mode": "deterministic_baseline", "model_version": "heuristic-0.1.0",
        "mastery": round(mastery, 3), "needs_remediation": mastery < 0.6,
        "recommended_difficulty": "facile" if mastery < 0.5 else "moyen" if mastery < 0.8 else "difficile",
        "disengagement_risk": round(disengagement, 3),
        "warning": "Baseline heuristique, pas un modèle entraîné.",
    }


@router.post("/research/search", tags=["research"])
def research(payload: ResearchRequest) -> dict[str, Any]:
    rejected = sorted(set(payload.allowed_domains) - ALLOWED_DOMAINS) if payload.allowed_domains else []
    agent = WebResearchAgent()
    if not agent.configured:
        return {
            "results": [], "verified": False, "rejected_domains": rejected,
            "warning": "Aucun fournisseur de recherche serveur configuré; aucune réponse web envoyée à l'élève.",
        }
    hits = agent.search(payload.question, k=5)
    return {
        "results": [dataclasses.asdict(h) for h in hits],
        "verified": False,
        "rejected_domains": rejected,
        "warning": (
            "Résultats web restreints aux domaines autorisés — non validés pédagogiquement, "
            "vérification humaine requise avant utilisation en classe."
            if hits
            else "Aucun résultat trouvé sur les domaines autorisés pour cette question."
        ),
    }


@router.post("/avatar/command", tags=["avatar"])
def avatar_command(payload: AvatarRequest) -> AvatarCommand:
    try:
        return AvatarCommand(state=payload.state, emotion=payload.emotion, target=payload.target)  # type: ignore[arg-type]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/voice/health", tags=["voice"])
def voice_health() -> dict[str, Any]:
    settings = get_settings()
    tts_configured = bool(settings.elevenlabs_api_key and settings.elevenlabs_voice_id)
    stt_key = settings.elevenlabs_stt_api_key or settings.elevenlabs_api_key
    stt_configured = bool(stt_key)

    permission_available: bool | None = None
    stt_detail: str | None = None
    if settings.stt_provider == "elevenlabs" and stt_configured:
        try:
            get_stt_provider(settings).transcribe(b"", "audio/webm")
            permission_available = True
        except VoiceProviderError as exc:
            permission_available = False if exc.status_code == 401 else None
            stt_detail = exc.detail
        except Exception as exc:  # service ElevenLabs injoignable, etc.
            stt_detail = str(exc)

    return {
        "tts": {
            "provider": settings.tts_provider,
            "configured": tts_configured,
            "voice_id": settings.elevenlabs_voice_id,
        },
        "stt": {
            "provider": settings.stt_provider,
            "configured": stt_configured,
            "permission_available": permission_available,
            "detail": stt_detail,
        },
    }


@router.post("/voice/synthesize", tags=["voice"])
def voice_synthesize(payload: SynthesizeRequest) -> Response:
    settings = get_settings()
    provider = get_tts_provider(settings)
    spoken_text = prepare_for_speech_with_openai(payload.text, settings)
    cache_dir = Path(__file__).resolve().parents[4] / "ml" / "artifacts" / "voice_cache"
    cache_key = hashlib.sha256(f"{MATH_SPEECH_VERSION}|{settings.elevenlabs_voice_id}|{settings.elevenlabs_tts_model}|{payload.language}|{spoken_text}".encode()).hexdigest()
    cache_file = cache_dir / f"{cache_key}.mp3"
    if settings.voice_cache_enabled and cache_file.exists():
        return Response(content=cache_file.read_bytes(), media_type="audio/mpeg", headers={"X-EduLab-Cache": "HIT", "Cache-Control": "private, max-age=2592000"})
    try:
        audio = provider.synthesize(spoken_text, payload.language)
    except VoiceProviderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    if not audio:
        raise HTTPException(status_code=503, detail="Fournisseur TTS non configuré (voir GET /voice/health).")
    if settings.voice_cache_enabled:
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_file.write_bytes(audio)
    return Response(content=audio, media_type="audio/mpeg", headers={"X-EduLab-Cache": "MISS", "Cache-Control": "private, max-age=2592000"})


@router.post("/voice/transcribe", tags=["voice"])
async def voice_transcribe(file: UploadFile = File(...)) -> dict[str, Any]:
    settings = get_settings()
    provider = get_stt_provider(settings)
    audio = await file.read()
    try:
        transcript = provider.transcribe(audio, file.content_type or "audio/webm")
    except VoiceProviderError as exc:
        if not settings.openai_api_key:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        try:
            transcript = OpenAISpeechToTextProvider(settings.openai_api_key).transcribe(audio, file.content_type or "audio/webm")
        except VoiceProviderError as fallback_exc:
            raise HTTPException(status_code=fallback_exc.status_code, detail=fallback_exc.detail) from fallback_exc
    return {"text": transcript.text, "confidence": transcript.confidence, "provider": transcript.provider}

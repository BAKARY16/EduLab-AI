"""Fournisseurs de synthèse (TTS) et reconnaissance (STT) vocale.

ElevenLabs est le fournisseur serveur. Le navigateur assure son propre repli vocal.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class Transcript:
    text: str
    confidence: float | None
    timestamps: list[dict]
    provider: str


class VoiceProviderError(Exception):
    """Erreur remontée par un fournisseur voix, avec un code HTTP et un message directement exploitables."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class SpeechToTextProvider(ABC):
    @abstractmethod
    def transcribe(self, audio: bytes, content_type: str) -> Transcript: ...


class TextToSpeechProvider(ABC):
    @abstractmethod
    def synthesize(self, text: str, language: str = "fr-FR") -> bytes: ...


class BrowserSTTFallback(SpeechToTextProvider):
    def transcribe(self, audio: bytes, content_type: str) -> Transcript:
        raise RuntimeError("BrowserSTTFallback s'exécute dans le navigateur, pas sur le serveur")


class BrowserTTSFallback(TextToSpeechProvider):
    def synthesize(self, text: str, language: str = "fr-FR") -> bytes:
        raise RuntimeError("BrowserTTSFallback s'exécute dans le navigateur, pas sur le serveur")


class UnavailableVoiceProvider(SpeechToTextProvider, TextToSpeechProvider):
    def transcribe(self, audio: bytes, content_type: str) -> Transcript:
        raise VoiceProviderError(503, "Aucun fournisseur STT serveur n'est configuré.")

    def synthesize(self, text: str, language: str = "fr-FR") -> bytes:
        raise VoiceProviderError(503, "Aucun fournisseur TTS serveur n'est configuré.")


def _elevenlabs_error(response: httpx.Response, expected_permission: str) -> VoiceProviderError:
    message = response.text
    try:
        detail = response.json().get("detail")
        if isinstance(detail, dict):
            message = detail.get("message", message)
        elif detail:
            message = str(detail)
    except Exception:
        pass
    if response.status_code == 401 and "missing_permissions" in response.text:
        return VoiceProviderError(
            401,
            f"La clé ElevenLabs configurée n'a pas la permission '{expected_permission}'. Détail ElevenLabs : {message}",
        )
    if response.status_code == 401:
        return VoiceProviderError(401, f"Authentification ElevenLabs refusée. Détail : {message}")
    return VoiceProviderError(502, f"ElevenLabs a répondu {response.status_code} : {message}")


class ElevenLabsTextToSpeechProvider(TextToSpeechProvider):
    def __init__(self, api_key: str, voice_id: str, model: str, base_url: str = "https://api.elevenlabs.io"):
        self._api_key = api_key
        self._voice_id = voice_id
        self._model = model
        self._base_url = base_url.rstrip("/")

    def synthesize(self, text: str, language: str = "fr-FR") -> bytes:
        try:
            response = httpx.post(
                f"{self._base_url}/v1/text-to-speech/{self._voice_id}",
                headers={"xi-api-key": self._api_key, "content-type": "application/json", "accept": "audio/mpeg"},
                json={
                    "text": text,
                    "model_id": self._model,
                    "voice_settings": {
                        "stability": 0.42,
                        "similarity_boost": 0.82,
                        "style": 0.28,
                        "use_speaker_boost": True,
                    },
                },
                timeout=90.0,
            )
        except httpx.HTTPError as exc:
            raise VoiceProviderError(503, f"ElevenLabs TTS injoignable : {exc}") from exc
        if not response.is_success:
            raise _elevenlabs_error(response, "text_to_speech")
        return response.content


class ElevenLabsSpeechToTextProvider(SpeechToTextProvider):
    def __init__(self, api_key: str, model: str, base_url: str = "https://api.elevenlabs.io"):
        self._api_key = api_key
        self._model = model
        self._base_url = base_url.rstrip("/")

    def transcribe(self, audio: bytes, content_type: str) -> Transcript:
        try:
            response = httpx.post(
                f"{self._base_url}/v1/speech-to-text",
                headers={"xi-api-key": self._api_key},
                files={"file": ("audio", audio, content_type or "audio/webm")},
                data={"model_id": self._model},
                timeout=30.0,
            )
        except httpx.HTTPError as exc:
            raise VoiceProviderError(503, f"ElevenLabs STT injoignable : {exc}") from exc
        if not response.is_success:
            raise _elevenlabs_error(response, "speech_to_text")
        data = response.json()
        return Transcript(text=data.get("text", ""), confidence=None, timestamps=[], provider="elevenlabs")


class OpenAISpeechToTextProvider(SpeechToTextProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini-transcribe"):
        self._api_key = api_key
        self._model = model

    def transcribe(self, audio: bytes, content_type: str) -> Transcript:
        try:
            response = httpx.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {self._api_key}"},
                files={"file": ("question.webm", audio, content_type or "audio/webm")},
                data={
                    "model": self._model,
                    "language": "fr",
                    "prompt": "Cours de mathématiques. Transcrire fidèlement les nombres, opérations, intervalles et formules prononcés.",
                },
                timeout=60.0,
            )
        except httpx.HTTPError as exc:
            raise VoiceProviderError(503, f"OpenAI STT injoignable : {exc}") from exc
        if not response.is_success:
            raise VoiceProviderError(502, f"OpenAI STT a répondu {response.status_code} : {response.text}")
        data = response.json()
        return Transcript(text=data.get("text", "").strip(), confidence=None, timestamps=[], provider="openai")


def get_tts_provider(settings: Any) -> TextToSpeechProvider:
    if settings.tts_provider == "elevenlabs" and settings.elevenlabs_api_key and settings.elevenlabs_voice_id:
        return ElevenLabsTextToSpeechProvider(
            api_key=settings.elevenlabs_api_key,
            voice_id=settings.elevenlabs_voice_id,
            model=settings.elevenlabs_tts_model,
            base_url=settings.elevenlabs_base_url,
        )
    if settings.tts_provider == "browser":
        return BrowserTTSFallback()
    return UnavailableVoiceProvider()


def get_stt_provider(settings: Any) -> SpeechToTextProvider:
    api_key = settings.elevenlabs_stt_api_key or settings.elevenlabs_api_key
    if settings.stt_provider == "elevenlabs" and api_key:
        return ElevenLabsSpeechToTextProvider(api_key=api_key, model=settings.elevenlabs_stt_model, base_url=settings.elevenlabs_base_url)
    if settings.stt_provider == "browser":
        return BrowserSTTFallback()
    return UnavailableVoiceProvider()

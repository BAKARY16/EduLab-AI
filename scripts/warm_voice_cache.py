"""Génère une fois la voix des cours préchauffés avec la voix ElevenLabs configurée."""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps/api")); sys.path.insert(0, str(ROOT))
from app.core.config import get_settings  # noqa: E402
from services.voice.math_speech import MATH_SPEECH_VERSION, prepare_for_speech_with_openai  # noqa: E402
from services.voice.providers import VoiceProviderError, get_tts_provider  # noqa: E402


def warm() -> dict:
    settings = get_settings(); provider = get_tts_provider(settings)
    data = json.loads((ROOT / "data/curated/terminale_d_logarithmes.json").read_text(encoding="utf-8"))
    output = ROOT / "ml/artifacts/voice_cache"; output.mkdir(parents=True, exist_ok=True)
    generated = existing = 0; failures = []
    for lesson in data["lessons"]:
        text = (
            f"{lesson['title']}\n\nObjectif : {lesson['objective']}\n\nEssentiel à retenir\n{lesson['summary']}\n\n"
            + "Démonstration au tableau\n" + "\n".join(f"{i}. {step}" for i, step in enumerate(lesson["board_demo"], 1))
            + f"\n\nVérification : {lesson['exercises'][0]['question']}"
        )
        spoken = prepare_for_speech_with_openai(text, settings)
        key = hashlib.sha256(f"{MATH_SPEECH_VERSION}|{settings.elevenlabs_voice_id}|{settings.elevenlabs_tts_model}|fr-FR|{spoken}".encode()).hexdigest()
        target = output / f"{key}.mp3"
        if target.exists(): existing += 1; continue
        try:
            target.write_bytes(provider.synthesize(spoken, "fr-FR")); generated += 1
        except VoiceProviderError as exc:
            failures.append({"lesson": lesson["id"], "error": exc.detail})
    return {"generated": generated, "already_cached": existing, "failed": failures, "voice_id": settings.elevenlabs_voice_id}


if __name__ == "__main__": print(json.dumps(warm(), ensure_ascii=False))

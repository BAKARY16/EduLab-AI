from ml.nlp.classifier import classify
from rag.chunking import chunk_text
from services.avatar.controller import AvatarCommand, AvatarController


def test_nlp_subject_and_intent() -> None:
    result = classify("Explique-moi une équation avec un exercice")
    assert result.subject == "Mathématiques"
    assert result.intent == "exercise"


def test_chunking_preserves_content() -> None:
    text = "Titre\n\n" + ("Une explication scientifique. " * 200)
    chunks = chunk_text(text, max_chars=500, overlap=50)
    assert len(chunks) >= 2
    assert "Titre" in chunks[0]


def test_avatar_transition() -> None:
    controller = AvatarController()
    command = controller.transition(AvatarCommand(state="listen"))
    assert command.state == "listen"

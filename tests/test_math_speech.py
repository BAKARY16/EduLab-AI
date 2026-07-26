from services.voice.math_speech import prepare_for_speech


def test_math_pronunciation():
    spoken = prepare_for_speech("ln(x²) = 2 ln(x), x → +∞")
    assert "logarithme népérien" in spoken
    assert "au carré" in spoken
    assert "tend vers" in spoken
    assert "l'infini" in spoken


def test_intervals_and_relations_are_spoken_explicitly():
    spoken = prepare_for_speech("x ∈ ]0,+∞[, 2×x - 3 ≤ 5")
    assert "appartient à" in spoken
    assert "intervalle ouvert de 0 à" in spoken
    assert "multiplié par" in spoken
    assert "inférieur ou égal à" in spoken

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from create_presentation_video import synthesize, duration  # noqa: E402

OUT = ROOT / "output" / "presentation"
SOURCE = OUT / "real-demo" / "real-platform-demo.webm"
DEMO = OUT / "real-demo" / "real-platform-demo-narrated.mp4"
FINAL = OUT / "EduLab-AI-presentation-demo-reelle-3min.mp4"

NARRATION = """Voici maintenant la plateforme en fonctionnement réel. Nous commençons par la page de connexion, avec un compte élève de Terminale. Une fois connecté, l’apprenant retrouve son tableau de bord, ses recommandations et sa progression. Dans l’onglet Cours, les contenus sont organisés comme des dossiers : niveau, matière, chapitre, puis notion. L’élève peut ensuite ouvrir le professeur IA et lui poser une question, par exemple pour obtenir une explication simple de la loi d’Ohm. Le laboratoire permet de lancer une expérience interactive et de modifier les paramètres afin d’observer immédiatement leur influence. Dans l’espace Examens, les sujets du B E P C et du baccalauréat sont classés par année et par matière. L’élève peut choisir un mode d’entraînement ou un mode chronométré. Enfin, l’onglet Résultats rassemble les activités et les compétences travaillées. Toutes les pages que vous voyez ici sont les véritables pages de l’application, parcourues automatiquement comme le ferait un utilisateur."""


def main():
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    audio = synthesize(9, NARRATION)
    # La capture Playwright contient un canevas 1920x1080 avec la vue 1440x900.
    # On recadre la partie utile en 16:9 puis on accélère la navigation à 1,7x.
    subprocess.run([
        ffmpeg, "-y", "-i", str(SOURCE), "-i", str(audio),
        "-filter_complex", "[0:v]crop=1440:810:0:0,scale=1920:1080,setpts=PTS/1.7,fps=30[v];[1:a]apad=pad_dur=90[a]",
        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest", "-video_track_timescale", "15360", str(DEMO),
    ], check=True)

    selected = [
        OUT / "scenes" / "01.mp4", OUT / "scenes" / "02.mp4",
        OUT / "scenes" / "03.mp4", OUT / "scenes" / "04.mp4",
        DEMO,
        OUT / "scenes" / "07.mp4", OUT / "scenes" / "08.mp4",
    ]
    concat = OUT / "real-demo-concat.txt"
    concat.write_text("\n".join(f"file '{item.as_posix()}'" for item in selected), encoding="utf-8")
    subprocess.run([
        ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
        "-c", "copy", "-movflags", "+faststart", str(FINAL),
    ], check=True)
    print(f"{FINAL}\nDurée: {duration(ffmpeg, FINAL):.2f} secondes")


if __name__ == "__main__":
    main()

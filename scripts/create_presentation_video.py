from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg
import requests
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "presentation"
FRAMES = OUT / "frames"
AUDIO = OUT / "audio"
SCENES = OUT / "scenes"
W, H = 1920, 1080

INK = "#10271f"
FOREST = "#173c30"
GREEN = "#0d9b78"
MINT = "#70d5ae"
CREAM = "#f8f5ec"
AMBER = "#efb66f"
MUTED = "#557165"
WHITE = "#ffffff"

FONT = Path("C:/Windows/Fonts/arial.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size)


def env_value(name: str) -> str:
    for filename in (ROOT / ".env.local", ROOT / ".env"):
        if not filename.exists():
            continue
        for raw in filename.read_text(encoding="utf-8").splitlines():
            if raw.startswith(name + "="):
                return raw.split("=", 1)[1].strip().strip('"')
    return os.environ.get(name, "")


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def fit_text(draw, text, xy, max_width, size, fill, bold=False, spacing=10):
    words = text.split()
    lines, line = [], ""
    f = font(size, bold)
    for word in words:
        trial = (line + " " + word).strip()
        if draw.textbbox((0, 0), trial, font=f)[2] <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    draw.multiline_text(xy, "\n".join(lines), font=f, fill=fill, spacing=spacing)
    return len(lines) * (size + spacing)


def base(dark=False):
    image = Image.new("RGB", (W, H), FOREST if dark else CREAM)
    if not dark:
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse((1350, -260, 2150, 540), fill=(112, 213, 174, 75))
        gd.ellipse((-280, 700, 450, 1350), fill=(239, 182, 111, 55))
        image = Image.alpha_composite(image.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(70))).convert("RGB")
    return image


def brand(draw, dark=False):
    rounded(draw, (80, 58, 138, 116), 15, MINT if dark else FOREST)
    draw.text((98, 69), "A", font=font(26, True), fill=FOREST if dark else MINT)
    draw.text((158, 68), "EduLab", font=font(30, True), fill=WHITE if dark else INK)
    draw.text((278, 68), "AI", font=font(30, True), fill=MINT if dark else GREEN)


def chapter(draw, number, label, dark=False):
    color = MINT if dark else GREEN
    draw.text((82, 165), number, font=font(22, True), fill=color)
    draw.text((145, 165), label.upper(), font=font(22, True), fill=WHITE if dark else INK)
    draw.line((82, 210, 1838, 210), fill=(255, 255, 255, 45) if dark else "#ccd9d0", width=2)


def paste_cover(canvas, source, box, radius=30):
    img = Image.open(source).convert("RGB")
    x1, y1, x2, y2 = box
    ratio = max((x2-x1)/img.width, (y2-y1)/img.height)
    img = img.resize((int(img.width*ratio), int(img.height*ratio)), Image.Resampling.LANCZOS)
    left = (img.width-(x2-x1))//2
    top = (img.height-(y2-y1))//2
    img = img.crop((left, top, left+x2-x1, top+y2-y1))
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width, img.height), radius, fill=255)
    canvas.paste(img, (x1, y1), mask)


def frame_hero(path):
    im = base(); d = ImageDraw.Draw(im); brand(d)
    draw_y = 275
    d.text((85, draw_y), "COMPRENDRE AUJOURD’HUI", font=font(24, True), fill=GREEN)
    fit_text(d, "pour réussir demain.", (85, draw_y+58), 730, 78, INK, True, 4)
    fit_text(d, "Une classe numérique intelligente pensée pour accompagner les élèves ivoiriens.", (88, 520), 690, 30, MUTED, False, 10)
    rounded(d, (85, 705, 430, 775), 35, FOREST)
    d.text((132, 723), "Présentation · 3 minutes", font=font(25, True), fill=WHITE)
    paste_cover(im, ROOT / "public/images/edulab-dashboard-laptop.png", (880, 165, 1840, 900), 40)
    im.save(path)


def frame_cards(path, number, label, title, cards, dark=False):
    im = base(dark); d = ImageDraw.Draw(im); brand(d, dark); chapter(d, number, label, dark)
    fit_text(d, title, (82, 265), 1320, 58, WHITE if dark else INK, True, 6)
    card_w = 540 if len(cards) == 3 else 400
    gap = 38
    total = len(cards)*card_w + (len(cards)-1)*gap
    x = (W-total)//2
    for i, (head, body) in enumerate(cards):
        left = x+i*(card_w+gap)
        fill = "#23483c" if dark else WHITE
        outline = "#3f6759" if dark else "#d7e1d9"
        rounded(d, (left, 515, left+card_w, 880), 30, fill, outline, 2)
        rounded(d, (left+30, 545, left+86, 601), 16, MINT if dark else "#dff1e8")
        d.text((left+50, 556), str(i+1), font=font(24, True), fill=FOREST)
        fit_text(d, head, (left+30, 640), card_w-60, 30, WHITE if dark else INK, True, 5)
        fit_text(d, body, (left+30, 710), card_w-60, 22, "#c8d5cf" if dark else MUTED, False, 7)
    im.save(path)


def frame_technology(path):
    cards = [("IA générative + RAG", "Explications contextualisées à partir de ressources pédagogiques indexées."), ("Voix et laboratoire", "Dialogue oral en français et simulations scientifiques interactives."), ("Supabase + analytics", "Authentification, données, progression et contrôle des accès.")]
    frame_cards(path, "03", "La technologie", "Une architecture complète, pas un simple chatbot.", cards, True)


def frame_demo(path, mode):
    im = base(); d = ImageDraw.Draw(im); brand(d); chapter(d, "04", "La démonstration")
    if mode == 1:
        d.text((82, 270), "1. Connexion et tableau de bord", font=font(54, True), fill=INK)
        paste_cover(im, ROOT / "public/images/edulab-dashboard-laptop.png", (700, 255, 1840, 955), 35)
        for y, title, body in [(430, "Profil personnalisé", "Classe, objectifs et matières prioritaires"), (585, "Cours recommandés", "Activités adaptées aux besoins"), (740, "Progression réelle", "Tentatives et compétences enregistrées")]:
            rounded(d, (82, y, 620, y+120), 22, WHITE, "#d7e1d9", 2)
            d.text((112, y+22), title, font=font(27, True), fill=INK)
            d.text((112, y+66), body, font=font(20), fill=MUTED)
    else:
        d.text((82, 270), "2. Professeur IA et laboratoire", font=font(54, True), fill=INK)
        paste_cover(im, ROOT / "public/images/edulab-ai-classroom.png", (82, 370, 920, 955), 35)
        rounded(d, (980, 370, 1838, 955), 35, FOREST)
        d.text((1030, 420), "EXPÉRIENCE · LOI D’OHM", font=font(22, True), fill=MINT)
        d.text((1030, 500), "U = R × I", font=font(72, True), fill=WHITE)
        d.line((1080, 680, 1710, 680), fill=MINT, width=8)
        d.ellipse((1390, 657, 1438, 705), fill=AMBER)
        d.text((1030, 745), "Modifier · observer · expliquer", font=font(31, True), fill=WHITE)
        fit_text(d, "Le professeur guide le raisonnement puis vérifie la compréhension.", (1030, 810), 700, 24, "#c8d5cf")
    im.save(path)


def frame_impact(path):
    cards = [("Élèves", "Plus d’autonomie et de pratique."), ("Enseignants", "Des difficultés mieux identifiées."), ("Établissements", "Un complément accessible sur mobile.")]
    frame_cards(path, "05", "L’impact", "Rendre l’accompagnement et la pratique scientifique plus accessibles.", cards)


def frame_end(path):
    im = base(True); d = ImageDraw.Draw(im); brand(d, True)
    d.text((W//2, 280), "EDULAB AI", anchor="mm", font=font(34, True), fill=MINT)
    fit_text(d, "Comprendre aujourd’hui\npour réussir demain.", (440, 360), 1200, 72, WHITE, True, 8)
    rounded(d, (675, 700, 1245, 785), 42, MINT)
    d.text((960, 742), "Merci pour votre attention", anchor="mm", font=font(28, True), fill=FOREST)
    d.text((960, 875), "Cours · Professeur IA · Laboratoire · Examens · Progression", anchor="mm", font=font(23), fill="#c8d5cf")
    im.save(path)


NARRATION = [
    "En Côte d’Ivoire, beaucoup d’élèves veulent réussir, mais tous ne disposent pas des mêmes conditions pour comprendre et pratiquer. EduLab AI est une classe numérique intelligente, pensée pour les accompagner du collège au lycée.",
    "Notre défi porte sur trois difficultés concrètes. Dans les classes chargées, le temps d’accompagnement individuel reste limité. Sans laboratoire accessible, les sciences deviennent trop théoriques. Enfin, les cours, exercices et annales sont souvent dispersés, sans parcours clair pour l’élève.",
    "EduLab réunit donc six leviers dans un même espace : un professeur IA qui guide le raisonnement, des cours structurés, un laboratoire virtuel, une aide aux devoirs, la préparation au B E P C et au baccalauréat, puis un suivi personnalisé des compétences.",
    "Techniquement, la plateforme ne se limite pas à un chatbot. Elle combine une intelligence artificielle générative avec une recherche documentaire de type RAG, afin d’utiliser des ressources pédagogiques indexées. Elle intègre aussi la voix, des simulations interactives, Supabase pour l’authentification et les données, ainsi que des indicateurs de progression.",
    "Voici le parcours de démonstration. Après la connexion, l’élève retrouve un tableau de bord adapté à sa classe. Il voit les cours recommandés, les activités commencées et les notions à revoir. Les résultats affichés proviennent des activités réellement enregistrées.",
    "Dans un cours, l’élève peut demander une explication au professeur IA. Celui-ci reformule la notion, propose un indice et vérifie la compréhension. Dans le laboratoire, l’élève modifie par exemple la tension et la résistance d’un circuit. L’intensité et le graphique évoluent alors selon la loi d’Ohm. Il observe, formule une réponse, puis reçoit une correction expliquée.",
    "L’impact recherché est double : donner aux élèves plus d’autonomie et de pratique, tout en aidant les enseignants à identifier les difficultés. Les prochaines étapes sont de renforcer la validation pédagogique, d’étendre les cours et simulations, puis d’évaluer la solution avec des élèves et des enseignants.",
    "EduLab AI. Comprendre aujourd’hui pour réussir demain. Merci pour votre attention.",
]


def synthesize(index, text):
    target = AUDIO / f"{index:02d}.mp3"
    if target.exists() and target.stat().st_size > 1000:
        return target
    api_key = env_value("ELEVENLABS_API_KEY")
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY absente")
    # Adam: voix masculine multilingue, posée et articulée.
    voice_id = "pNInz6obpgDQGcFmaJgB"
    response = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": api_key, "content-type": "application/json", "accept": "audio/mpeg"},
        json={"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.58, "similarity_boost": 0.78, "style": 0.12, "use_speaker_boost": True}},
        timeout=120,
    )
    response.raise_for_status()
    target.write_bytes(response.content)
    return target


def duration(ffmpeg, audio):
    proc = subprocess.run([ffmpeg, "-i", str(audio)], capture_output=True, text=True, encoding="utf-8", errors="ignore")
    match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", proc.stderr)
    if not match:
        raise RuntimeError(f"Durée illisible pour {audio}")
    h, m, s = match.groups()
    return int(h)*3600 + int(m)*60 + float(s)


def render_scene(ffmpeg, index, frame, audio):
    target = SCENES / f"{index:02d}.mp4"
    seconds = duration(ffmpeg, audio) + 0.65
    vf = "scale=1920:1080,format=yuv420p"
    subprocess.run([ffmpeg, "-y", "-loop", "1", "-framerate", "30", "-i", str(frame), "-i", str(audio), "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-c:a", "aac", "-b:a", "192k", "-t", f"{seconds:.3f}", "-shortest", str(target)], check=True)
    return target


def main():
    for directory in (OUT, FRAMES, AUDIO, SCENES):
        directory.mkdir(parents=True, exist_ok=True)
    frame_builders = [
        frame_hero,
        lambda p: frame_cards(p, "01", "Le problème", "Trois obstacles limitent encore l’apprentissage.", [("Accompagnement limité", "Peu de temps individuel dans les classes chargées."), ("Sciences trop théoriques", "La pratique expérimentale reste difficile d’accès."), ("Ressources dispersées", "Cours et annales manquent d’un parcours unifié.")], True),
        lambda p: frame_cards(p, "02", "La solution", "Un environnement unique pour apprendre et pratiquer.", [("Professeur IA", "Explique, reformule et guide le raisonnement."), ("Cours + laboratoire", "Relie les notions à des expériences interactives."), ("Examens + suivi", "Entraîne, corrige et mesure la progression.")]),
        frame_technology,
        lambda p: frame_demo(p, 1),
        lambda p: frame_demo(p, 2),
        frame_impact,
        frame_end,
    ]
    frames = []
    for i, builder in enumerate(frame_builders, 1):
        path = FRAMES / f"{i:02d}.png"
        builder(path)
        frames.append(path)
    audios = [synthesize(i, text) for i, text in enumerate(NARRATION, 1)]
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    scenes = [render_scene(ffmpeg, i, frame, audio) for i, (frame, audio) in enumerate(zip(frames, audios), 1)]
    concat = OUT / "concat.txt"
    concat.write_text("\n".join(f"file '{scene.as_posix()}'" for scene in scenes), encoding="utf-8")
    final = OUT / "EduLab-AI-presentation-3min.mp4"
    subprocess.run([ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", "-movflags", "+faststart", str(final)], check=True)
    total = duration(ffmpeg, final)
    print(json.dumps({"video": str(final), "duration_seconds": round(total, 2), "voice": "Adam / ElevenLabs multilingual v2", "resolution": "1920x1080"}, ensure_ascii=False))


if __name__ == "__main__":
    main()

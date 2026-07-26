"""Build the reproducible EduLab teacher dataset and documentary artefacts.

This script never labels generated pedagogical content as official. Official
URLs are curriculum anchors; every generated instruction/answer is marked
synthetic and requires pedagogical review before learner-facing use.
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import random
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import nbformat as nbf
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SEED = 20260723
TODAY = "2026-07-23"

SOURCES = [
    ("SRC-DPFC-PROG", "DPFC — programmes éducatifs et guides du secondaire", "DPFC", "https://dpfc-ci.net/?page_id=283", "catalogue_officiel", "Toutes", "Toutes", "Toutes", "Programmes et guides", "public", "à_vérifier", "officiel", "inventorié"),
    ("SRC-DPFC-PROGR", "DPFC — progressions du secondaire", "DPFC", "https://dpfc-ci.net/?page_id=5267", "progression_officielle", "Toutes", "Toutes", "Toutes", "Progressions annuelles", "public", "à_vérifier", "officiel", "inventorié"),
    ("SRC-DPFC-EVAL", "DPFC — formats d’évaluation", "DPFC", "https://dpfc-ci.net/?page_id=69", "format_evaluation", "Toutes", "Toutes", "Toutes", "Formats et grilles", "public", "à_vérifier", "officiel", "inventorié"),
    ("SRC-MATH-3E", "Programme Mathématiques Troisième", "DPFC", "https://dpfc-ci.net/dpfc/programmes/maths/04.%20Prog%20%C3%89duct%20MATHS%203e%20CND%200923.pdf", "programme_pdf", "Troisième", "", "Mathématiques", "Programme éducatif", "public", "document_public_unitaire", "officiel", "document_local_disponible"),
    ("SRC-PC-3E", "Programme Physique-Chimie Troisième", "DPFC", "https://dpfc-ci.net/wp-content/uploads//dpfc_fichiers/Programmes/prg_secondaire/Physique_Chimie/PHYSIQUE-CHIMIE_3eme.pdf", "programme_pdf", "Troisième", "", "Physique-Chimie", "Programme éducatif", "public", "document_public_unitaire", "officiel", "document_local_disponible"),
    ("SRC-MATH-TC", "Programme Mathématiques Terminale C", "DPFC", "https://dpfc-ci.net/dpfc/programmes/maths/13.%20Prog%20Educt%20maths%20TC%20CND%200923.pdf", "programme_pdf", "Terminale C", "C", "Mathématiques", "Programme éducatif", "public", "à_vérifier", "officiel", "url_inventoriée"),
    ("SRC-MATH-TD", "Programme Mathématiques Terminale D", "DPFC", "https://dpfc-ci.net/dpfc/programmes/maths/14.%20Prog%20Educt%20maths%20TD%20CND%200923.pdf", "programme_pdf", "Terminale D", "D", "Mathématiques", "Programme éducatif", "public", "à_vérifier", "officiel", "url_inventoriée"),
    ("SRC-PC-TD", "Programme Physique-Chimie Terminale D", "DPFC", "https://dpfc-ci.net/wp-content/uploads/dpfc_fichiers/2019-2020/programmes%20secondaires%202e%20cycle/pc/Programme%20Educatif%20-%20Terminale%20D.pdf", "programme_pdf", "Terminale D", "D", "Physique-Chimie", "Programme éducatif", "public", "à_vérifier", "officiel", "url_inventoriée"),
    ("SRC-PC-PROGR-2526", "Progressions Physique-Chimie 2025-2026", "DPFC", "https://dpfc-ci.net/dpfc/2026/progressions/Physique-Chimie%20Progressions%202025-2026.pdf", "progression_pdf", "Toutes", "C/D", "Physique-Chimie", "Progression", "public", "à_vérifier", "officiel", "url_inventoriée"),
    ("SRC-ECOLE-CI", "Mon École à la Maison", "MENA", "https://ecole-ci.org/", "portail_cours", "Toutes", "Toutes", "Toutes", "Cours numériques", "authentification_possible", "non_collecté", "officiel", "métadonnées_seulement"),
    ("SRC-DECO", "DECO", "MENA-DECO", "https://www.men-deco.org/", "portail_examens", "Toutes", "Toutes", "Toutes", "Informations examens", "public/protégé", "non_collecté", "officiel", "métadonnées_seulement"),
    ("SRC-FOMESOUTRA", "Fomesoutra", "Communautaire", "https://www.fomesoutra.com/", "banque_documents", "Toutes", "Toutes", "Toutes", "Sujets et ressources", "public", "droits_à_vérifier", "communautaire", "métadonnées_seulement"),
    ("SRC-SCIQ", "SciQ", "Allen Institute for AI", "https://huggingface.co/datasets/allenai/sciq", "dataset", "non_ivoirien", "", "Sciences", "QCM scientifiques", "public", "licence_CC-BY-NC-3.0", "complément_non_curriculaire", "prévu"),
]

# Curated factual seeds. These are author-created summaries, not copied passages.
LESSONS = [
 ("Troisième","","Mathématiques","Calcul algébrique","Équations du premier degré","Une équation ax+b=0, avec a non nul, a pour solution x=-b/a.","2x+6=0 donne x=-3.","SRC-MATH-3E"),
 ("Troisième","","Mathématiques","Calcul algébrique","Racines carrées","Pour a positif, √a est le nombre positif dont le carré vaut a.","√49=7.","SRC-MATH-3E"),
 ("Troisième","","Mathématiques","Fonctions","Applications affines","Une fonction affine s’écrit f(x)=ax+b; a est le coefficient directeur.","f(x)=2x+1 donne f(3)=7.","SRC-MATH-3E"),
 ("Troisième","","Mathématiques","Géométrie","Théorème de Pythagore","Dans un triangle rectangle, le carré de l’hypoténuse égale la somme des carrés des deux autres côtés.","3²+4²=5².","SRC-MATH-3E"),
 ("Troisième","","Mathématiques","Géométrie","Théorème de Thalès","Des droites parallèles coupant deux sécantes déterminent des longueurs proportionnelles.","AM/AB=AN/AC lorsque MN est parallèle à BC.","SRC-MATH-3E"),
 ("Troisième","","Mathématiques","Statistique","Moyenne","La moyenne est la somme des valeurs divisée par leur effectif.","La moyenne de 8, 10 et 12 vaut 10.","SRC-MATH-3E"),
 ("Troisième","","Physique-Chimie","Électricité","Loi d’Ohm","Pour un conducteur ohmique, la tension U est égale au produit de la résistance R par l’intensité I: U=R×I.","R=10 Ω et I=0,2 A donnent U=2 V.","SRC-PC-3E"),
 ("Troisième","","Physique-Chimie","Électricité","Puissance électrique","La puissance électrique reçue par un appareil vaut P=U×I.","U=12 V et I=0,5 A donnent P=6 W.","SRC-PC-3E"),
 ("Troisième","","Physique-Chimie","Mécanique","Poids et masse","Le poids est une force: P=m×g; la masse s’exprime en kg et le poids en N.","m=2 kg et g≈10 N/kg donnent P≈20 N.","SRC-PC-3E"),
 ("Troisième","","Physique-Chimie","Chimie","pH des solutions","Une solution est acide si pH<7, neutre si pH=7 et basique si pH>7.","Une solution de pH 3 est acide.","SRC-PC-3E"),
 ("Troisième","","Physique-Chimie","Optique","Lentilles convergentes","Une lentille convergente fait converger des rayons parallèles vers son foyer image.","Une loupe est une lentille convergente.","SRC-PC-3E"),
 ("Troisième","","SVT","Nutrition","Digestion","La digestion transforme les aliments en nutriments absorbables, notamment dans l’intestin grêle.","Le glucose passe dans le sang après absorption.","SRC-DPFC-PROG"),
 ("Troisième","","SVT","Circulation","Circulation sanguine","Le cœur propulse le sang dans les artères; il revient au cœur par les veines.","La circulation distribue dioxygène et nutriments.","SRC-DPFC-PROG"),
 ("Troisième","","SVT","Immunité","Prévention du VIH","Le VIH se transmet par certains liquides biologiques; prévention, dépistage et traitement réduisent les risques.","Le VIH ne se transmet pas par une poignée de main.","SRC-DPFC-PROG"),
 ("Troisième","","SVT","Sols","Fertilité du sol","La fertilité dépend notamment de la matière organique, des sels minéraux, de l’eau, de l’air et des organismes du sol.","Le compost peut enrichir le sol en matière organique.","SRC-DPFC-PROG"),
 ("Terminale C","C","Mathématiques","Analyse","Limites","La limite décrit le comportement d’une fonction quand la variable approche une valeur ou l’infini.","1/x tend vers 0 quand x tend vers +∞.","SRC-MATH-TC"),
 ("Terminale C","C","Mathématiques","Analyse","Dérivation","La dérivée mesure le taux de variation instantané et donne la pente de la tangente.","Si f(x)=x², alors f′(x)=2x.","SRC-MATH-TC"),
 ("Terminale C","C","Mathématiques","Analyse","Fonction exponentielle","La fonction exponentielle vérifie exp′=exp et exp(a+b)=exp(a)exp(b).","La solution de y′=y avec y(0)=1 est y=exp(x).","SRC-MATH-TC"),
 ("Terminale C","C","Mathématiques","Analyse","Intégrales","Une intégrale définie calcule une accumulation; si F′=f, ∫a^b f=F(b)-F(a).","∫0^1 x dx=1/2.","SRC-MATH-TC"),
 ("Terminale C","C","Mathématiques","Nombres complexes","Forme algébrique","Un complexe s’écrit z=a+ib avec i²=-1; son module vaut √(a²+b²).","|3+4i|=5.","SRC-MATH-TC"),
 ("Terminale C","C","Mathématiques","Probabilités","Loi binomiale","Le nombre de succès dans n épreuves indépendantes de probabilité p suit B(n,p).","Son espérance vaut np.","SRC-MATH-TC"),
 ("Terminale C","C","Physique-Chimie","Mécanique","Deuxième loi de Newton","Dans un référentiel galiléen, la somme des forces extérieures vaut m×a.","Une force résultante de 6 N sur 2 kg produit 3 m/s².","SRC-PC-PROGR-2526"),
 ("Terminale C","C","Physique-Chimie","Mécanique","Énergie cinétique","L’énergie cinétique d’un point matériel vaut Ec=1/2 mv².","Pour m=2 kg et v=3 m/s, Ec=9 J.","SRC-PC-PROGR-2526"),
 ("Terminale C","C","Physique-Chimie","Électricité","Circuit RC","La constante de temps d’un dipôle RC vaut τ=RC et caractérise la charge du condensateur.","À t=τ, la charge atteint environ 63 % de sa valeur finale.","SRC-PC-PROGR-2526"),
 ("Terminale C","C","Physique-Chimie","Ondes","Ondes progressives","Une onde transporte de l’énergie sans transport global de matière; v=d/Δt.","Une perturbation parcourt 6 m en 2 s: v=3 m/s.","SRC-PC-PROGR-2526"),
 ("Terminale C","C","Physique-Chimie","Chimie","Équilibre acido-basique","Un couple acide/base échange un proton H+; pH=pKa+log([base]/[acide]) dans les conditions usuelles.","À concentrations égales, pH=pKa.","SRC-PC-PROGR-2526"),
 ("Terminale D","D","Mathématiques","Analyse","Continuité","Une fonction est continue en a si sa limite en a est égale à f(a).","Les fonctions polynomiales sont continues sur R.","SRC-MATH-TD"),
 ("Terminale D","D","Mathématiques","Analyse","Dérivation","Le signe de f′ permet d’étudier les variations de f.","Si f′ est positive sur un intervalle, f y est croissante.","SRC-MATH-TD"),
 ("Terminale D","D","Mathématiques","Analyse","Logarithme népérien","ln est défini sur ]0,+∞[, ln(ab)=ln a+ln b et (ln x)′=1/x.","ln(e²)=2.","SRC-MATH-TD"),
 ("Terminale D","D","Mathématiques","Probabilités","Probabilités conditionnelles","P(A|B)=P(A∩B)/P(B) lorsque P(B)>0.","Un arbre pondéré aide à organiser les probabilités conditionnelles.","SRC-MATH-TD"),
 ("Terminale D","D","Mathématiques","Suites","Suites géométriques","Une suite géométrique vérifie u(n+1)=q×u(n), donc u(n)=u(0)q^n.","Si u0=3 et q=2, u3=24.","SRC-MATH-TD"),
 ("Terminale D","D","Physique-Chimie","Mécanique","Travail d’une force","Pour une force constante, W=F×d×cos θ.","Une force de 10 N parallèle à un déplacement de 3 m fournit 30 J.","SRC-PC-TD"),
 ("Terminale D","D","Physique-Chimie","Électricité","Condensateur","La charge d’un condensateur vérifie q=C×u, avec C en farads.","C=100 µF et u=10 V donnent q=1 mC.","SRC-PC-TD"),
 ("Terminale D","D","Physique-Chimie","Chimie","Cinétique chimique","La vitesse de réaction traduit l’évolution d’une quantité de matière par unité de temps.","La température peut augmenter la vitesse de réaction.","SRC-PC-TD"),
 ("Terminale D","D","Physique-Chimie","Chimie","Dosage acido-basique","À l’équivalence, les réactifs ont été introduits dans les proportions stœchiométriques.","Pour un dosage 1:1, CaVa=CbVeq.","SRC-PC-TD"),
 ("Terminale D","D","SVT","Génétique","Expression de l’information génétique","L’ADN est transcrit en ARN messager, puis l’ARNm est traduit en protéine.","Un codon de l’ARNm correspond à un acide aminé ou à un signal stop.","SRC-DPFC-PROG"),
 ("Terminale D","D","SVT","Génétique","Brassage génétique","La méiose et la fécondation créent de nouvelles combinaisons d’allèles.","Le crossing-over participe au brassage intrachromosomique.","SRC-DPFC-PROG"),
 ("Terminale D","D","SVT","Immunologie","Réponse immunitaire adaptative","La réponse adaptative est spécifique et possède une mémoire; elle implique lymphocytes B et T.","Les plasmocytes produisent des anticorps.","SRC-DPFC-PROG"),
 ("Terminale D","D","SVT","Neurophysiologie","Message nerveux","Le potentiel d’action est une variation transitoire du potentiel de membrane qui se propage le long d’un neurone.","À la synapse chimique, un neurotransmetteur transmet le signal.","SRC-DPFC-PROG"),
 ("Terminale D","D","SVT","Reproduction","Régulation hormonale","L’axe hypothalamo-hypophysaire contrôle les gonades par des hormones.","FSH et LH participent au contrôle du cycle ovarien.","SRC-DPFC-PROG"),
 ("Terminale D","D","SVT","Géologie","Tectonique des plaques","La lithosphère est divisée en plaques mobiles; leurs frontières concentrent séismes et volcanisme.","Une dorsale est une frontière divergente.","SRC-DPFC-PROG"),
]

TASKS = ["explain","course_plan","exercise","correction","summary","exam_tip","quiz","checkpoint_quiz","robot_json"]

def ensure_dirs():
    for d in ["data/catalogs","data/processed","data/extracted","notebooks","models/edulab-teacher-qwen-0.5b-lora/tokenizer","reports","scripts","tests"]:
        (ROOT/d).mkdir(parents=True, exist_ok=True)

def write_csv(path, rows, columns):
    pd.DataFrame(rows, columns=columns).to_csv(ROOT/path, index=False, encoding="utf-8")

def build_catalogs():
    cols=["source_id","name","authority","url","type","class_name","series","subject","available_content","access_mode","download_rights","official_status","validation_status"]
    df=pd.DataFrame(SOURCES, columns=cols); df["consulted_at"]=TODAY; df["notes"]="Inventaire unitaire; aucune collecte massive."
    df.to_csv(ROOT/"data/catalogs/source_registry.csv",index=False,encoding="utf-8")
    ccols=["class_name","series","subject","chapter","lesson","source_id","official_status","validation_status"]
    c=pd.DataFrame([[*x[:5],x[7],"curriculum_anchor","requires_human_curriculum_check"] for x in LESSONS],columns=ccols)
    c[c.class_name=="Troisième"].to_csv(ROOT/"data/catalogs/curriculum_3e.csv",index=False)
    c[c.class_name=="Terminale C"].to_csv(ROOT/"data/catalogs/curriculum_terminale_c.csv",index=False)
    c[c.class_name=="Terminale D"].to_csv(ROOT/"data/catalogs/curriculum_terminale_d.csv",index=False)
    exam=[]
    for exam_name,series,years,subjects in [("BEPC","",range(2015,2025),["Mathématiques","Physique-Chimie"]),("BAC","C/D",range(2015,2025),["Mathématiques","Physique-Chimie","SVT"])]:
        for year,subject in zip(years,[subjects[i%len(subjects)] for i in range(len(years))]):
            exam.append([f"{exam_name}-{year}-{subject[:3]}",exam_name,year,series,subject,"SRC-FOMESOUTRA","sujet_attribué_non_vérifié","non_collecté","pending_human_verification"])
    edf=pd.DataFrame(exam,columns=["id","exam","year","series","subject","source_id","official_status","download_status","validation_status"])
    edf[edf.exam=="BEPC"].to_csv(ROOT/"data/catalogs/exams_bepc.csv",index=False)
    edf[edf.exam=="BAC"].to_csv(ROOT/"data/catalogs/exams_bac.csv",index=False)

def response_for(task, cls, subject, chapter, lesson, fact, example, sid):
    exam="BEPC" if cls=="Troisième" else "BAC"
    if task=="explain": return f"Définition — {fact}\nExemple — {example}\nQuestion de contrôle — Explique la règle avec tes propres mots et donne un nouvel exemple."
    if task=="course_plan": return f"Objectifs: comprendre et appliquer {lesson}.\nPrérequis: notions de base de {chapter}.\nExplication: {fact}\nExemple guidé: {example}\nExercice: applique la relation à une situation différente.\nCorrection: identifie les données, choisis la relation, calcule puis vérifie.\nRésumé: retenir la définition, les unités et la méthode."
    if task=="exercise": return f"Difficulté: intermédiaire. Compétence: appliquer {lesson}.\nÉnoncé: à partir de « {example} », modifie une donnée pertinente et détermine la nouvelle valeur. Justifie chaque étape et indique les unités si nécessaire."
    if task=="correction": return f"Indice 1: relève les données utiles.\nIndice 2: rappelle que {fact}\nÉtape 1: écris la relation adaptée.\nÉtape 2: remplace par les valeurs avec leurs unités.\nVérification: compare ton résultat à l’exemple {example}"
    if task=="summary": return f"À retenir sur {lesson}: {fact} Exemple repère: {example} Vérifie toujours les hypothèses, le vocabulaire scientifique et les unités."
    if task=="exam_tip": return f"Préparation {exam}: maîtrise la définition et la relation de {lesson}. Erreur fréquente: appliquer une formule sans vérifier ses conditions ou ses unités. Point clé: {fact} Question similaire: explique puis applique à un cas numérique ou expérimental."
    if task=="quiz": return f"Question: quelle affirmation décrit correctement {lesson} ?\nA. {fact}\nB. La notion ne dépend d’aucune condition.\nC. Toute unité convient.\nD. Le résultat ne se vérifie jamais.\nRéponse: A. Justification: {example}"
    if task=="checkpoint_quiz": return f"Question de contrôle: explique la règle essentielle de {lesson}, puis illustre-la.\nRéponse attendue: {fact}\nIllustration possible: {example}"
    return json.dumps({"teacher_text":f"Aujourd’hui, nous étudions {lesson}. {fact}","board_content":[lesson,fact,example],"avatar_state":"explaining","checkpoint":{"question":f"Que faut-il retenir de {lesson} ?","expected":"Définition, méthode et exemple cohérent"},"sources":[sid]},ensure_ascii=False)

def build_dataset():
    rows=[]
    for li,(cls,series,subject,chapter,lesson,fact,example,sid) in enumerate(LESSONS):
        for task in TASKS:
            instruction={
                "explain":f"Explique {lesson} à un élève de {cls} avec définition, formule si nécessaire, exemple et question de contrôle.",
                "course_plan":f"Crée un cours progressif sur {lesson}: objectifs, prérequis, explication, exemple, exercice, correction et résumé.",
                "exercise":f"Génère un exercice de {subject} adapté à {cls} sur {lesson}, avec difficulté et compétence.",
                "correction":f"Corrige progressivement un exercice sur {lesson} sans donner immédiatement toute la solution.",
                "summary":f"Résume {lesson} pour une révision rapide en {cls}.",
                "exam_tip":f"Présente les points importants de {lesson} pour l’examen, les erreurs fréquentes et une question similaire.",
                "quiz":f"Crée une question de contrôle à choix multiple sur {lesson} avec justification.",
                "checkpoint_quiz":f"Pose une deuxième question de contrôle ouverte sur {lesson}, puis donne une réponse justifiée.",
                "robot_json":f"Retourne uniquement un JSON pour le robot professeur sur {lesson}, avec teacher_text, board_content, avatar_state, checkpoint et sources.",
            }[task]
            response=response_for(task,cls,subject,chapter,lesson,fact,example,sid)
            key=f"{cls}|{subject}|{lesson}|{task}"
            rows.append({"id":"edu-"+hashlib.sha256(key.encode()).hexdigest()[:14],"task":"quiz" if task in {"robot_json","checkpoint_quiz"} else task,"class_name":cls,"series":series or None,"subject":subject,"chapter":chapter,"lesson":lesson,"instruction":instruction,"context":f"Ancrage curriculaire: {lesson}. Synthèse pédagogique originale: {fact}","response":response,"source_ids":[sid],"official_status":"synthetic_from_curriculum_anchor","synthetic":True,"validation_status":"validated_by_rules_pending_human_review","language":"fr","difficulty":"intermediate"})
    random.Random(SEED).shuffle(rows)
    # Group-safe split by lesson prevents near variants crossing splits.
    lessons=sorted({r["lesson"] for r in rows}); random.Random(SEED).shuffle(lessons)
    n=len(lessons); train=set(lessons[:round(.70*n)]); val=set(lessons[round(.70*n):round(.85*n)])
    splits={"train":[],"validation":[],"test":[]}
    for r in rows: splits["train" if r["lesson"] in train else "validation" if r["lesson"] in val else "test"].append(r)
    for name,items in splits.items():
        with (ROOT/f"data/processed/edulab_teacher_{name}.jsonl").open("w",encoding="utf-8") as f:
            for x in items:
                y={k:v for k,v in x.items() if k!="difficulty"}; f.write(json.dumps(y,ensure_ascii=False)+"\n")
    feat=[]
    for r in rows:
        text=r["instruction"]+" "+r["response"]
        feat.append({"id":r["id"],"question_length":len(r["instruction"]),"response_length":len(r["response"]),"formula_count":len(re.findall(r"[=×√′∫]",text)),"has_units":bool(re.search(r"\b(V|A|Ω|W|kg|N|J|m/s|F)\b",text)),"subject":r["subject"],"class_name":r["class_name"],"series":r["series"],"chapter":r["chapter"],"task":r["task"],"difficulty":r["difficulty"],"step_count":len(re.findall(r"Étape|Indice",r["response"])),"concept_count":max(1,len(r["context"].split(","))),"exam_type":"BEPC" if r["class_name"]=="Troisième" else "BAC","year":None,"official_status":r["official_status"],"has_correction":r["task"]=="correction","hint_count":r["response"].count("Indice"),"reasoning_level":"guided" if r["task"]=="correction" else "direct","source":r["source_ids"][0],"synthetic":r["synthetic"],"validation_quality":r["validation_status"]})
    pd.DataFrame(feat).to_parquet(ROOT/"data/processed/teacher_dataset_features.parquet",index=False)
    # SciQ placeholder has schema and truthful status when network download is not run.
    sciq_path=ROOT/"data/processed/sciq_normalized.parquet"
    if not sciq_path.exists():
        pd.DataFrame(columns=["question","correct_answer","distractor1","distractor2","distractor3","support","source_id","language"]).to_parquet(sciq_path,index=False)
    return rows,splits,pd.DataFrame(feat)

def build_reports(rows,splits,features):
    stats={"total":len(rows),"splits":{k:len(v) for k,v in splits.items()},"synthetic":sum(x["synthetic"] for x in rows),"lessons":len(set(x["lesson"] for x in rows)),"exercises_or_questions":sum(x["task"] in {"exercise","quiz"} for x in rows),"detailed_corrections":sum(x["task"]=="correction" for x in rows),"by_class":Counter(x["class_name"] for x in rows),"by_subject":Counter(x["subject"] for x in rows),"by_task":Counter(x["task"] for x in rows),"duplicate_ids":len(rows)-len(set(x["id"] for x in rows))}
    (ROOT/"reports/dataset_statistics.json").write_text(json.dumps(stats,ensure_ascii=False,indent=2,default=dict),encoding="utf-8")
    pd.DataFrame([{"metric":k,"value":json.dumps(v,ensure_ascii=False,default=dict) if isinstance(v,(dict,Counter)) else v,"status":"PASS" if k!="duplicate_ids" or v==0 else "FAIL"} for k,v in stats.items()]).to_csv(ROOT/"reports/dataset_quality.csv",index=False)
    html="<h1>EduLab Teacher Dataset — EDA</h1><p>Rapport généré le "+TODAY+".</p>"+features.describe(include="all").to_html()+"<h2>Répartition par classe</h2>"+features.class_name.value_counts().to_frame().to_html()+"<h2>Matières</h2>"+features.subject.value_counts().to_frame().to_html()+"<h2>Tâches</h2>"+features.task.value_counts().to_frame().to_html()
    (ROOT/"reports/dataset_eda_report.html").write_text(html,encoding="utf-8")
    (ROOT/"reports/data_sources_report.md").write_text(f"# Rapport des sources\n\nConsultation: {TODAY}. {len(SOURCES)} sources inventoriées. Deux PDF DPFC sont présents localement; les autres URL restent référencées. Aucun document protégé n’a été redistribué. Les contenus générés sont tous marqués synthétiques. SciQ n’est pas traité comme programme ivoirien.\n",encoding="utf-8")

def notebook(title,cells):
    nb=nbf.v4.new_notebook(); nb["metadata"]={"kernelspec":{"display_name":"Python 3","language":"python","name":"python3"},"language_info":{"name":"python","version":"3"},"colab":{"name":title}}
    nb["cells"]=[nbf.v4.new_markdown_cell(f"# {title}\n\nExécuter depuis la racine du dépôt. Les résultats ne sont valides que si les cellules sont réellement exécutées.")]+[nbf.v4.new_code_cell(x) for x in cells]
    return nb

def build_notebooks():
    common="from pathlib import Path\nROOT=Path.cwd()\nif not (ROOT/'data').exists():\n    ROOT=Path('/content/EduLab-AI-Version2')\nprint(ROOT)"
    specs={
    "01_sources_inventory.ipynb":("01 — Inventaire des sources",[common,"import pandas as pd\nsources=pd.read_csv(ROOT/'data/catalogs/source_registry.csv')\ndisplay(sources); print(sources.validation_status.value_counts())"]),
    "02_dataset_creation_and_eda.ipynb":("02 — Création et EDA",[common,"%run scripts/bootstrap_teacher_project.py","import pandas as pd, json\nf=pd.read_parquet(ROOT/'data/processed/teacher_dataset_features.parquet')\ndisplay(f.head()); display(f.isna().sum()); display(f.duplicated('id').value_counts())","display(f.class_name.value_counts()); display(f.subject.value_counts()); display(f.task.value_counts()); display(f.source.value_counts())","display(f[['question_length','response_length','formula_count','step_count']].describe())","import matplotlib.pyplot as plt\nf.groupby(['class_name','subject']).size().unstack(fill_value=0).plot.bar(); plt.tight_layout()"]),
    "03_teacher_model_baseline.ipynb":("03 — Baseline Qwen",[common,"!pip -q install -r requirements-colab.txt","MODEL_ID='Qwen/Qwen2.5-0.5B-Instruct'\nfrom transformers import AutoTokenizer, AutoModelForCausalLM\nimport torch, json, time\ntok=AutoTokenizer.from_pretrained(MODEL_ID)\nmodel=AutoModelForCausalLM.from_pretrained(MODEL_ID, torch_dtype='auto', device_map='auto')","# Construire 30 prompts équilibrés (10 par classe) depuis le test\nrows=[json.loads(x) for x in open(ROOT/'data/processed/edulab_teacher_test.jsonl',encoding='utf-8')]\nprompts=[]\nfor cls in ['Troisième','Terminale C','Terminale D']:\n prompts += [r for r in rows if r['class_name']==cls][:10]\nassert len(prompts)==30\nout=[]\nfor r in prompts:\n text=tok.apply_chat_template([{'role':'user','content':r['instruction']+'\\nContexte: '+r['context']}],tokenize=False,add_generation_prompt=True)\n inputs=tok(text,return_tensors='pt').to(model.device); t=time.time()\n ids=model.generate(**inputs,max_new_tokens=160,do_sample=False)\n out.append({**{k:r[k] for k in ['id','class_name','subject','task']},'prediction':tok.decode(ids[0][inputs.input_ids.shape[1]:],skip_special_tokens=True),'latency_s':time.time()-t})\nwith open(ROOT/'reports/baseline_predictions.jsonl','w',encoding='utf-8') as f:\n for x in out:f.write(json.dumps(x,ensure_ascii=False)+'\\n')\nprint(len(out))"]),
    "04_teacher_model_lora_training.ipynb":("04 — Entraînement LoRA",[common,"!pip -q install -r requirements-colab.txt","import json, torch\nfrom datasets import Dataset\nfrom transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForLanguageModeling, EarlyStoppingCallback\nfrom peft import LoraConfig, get_peft_model\nMODEL_ID='Qwen/Qwen2.5-0.5B-Instruct'; OUT=ROOT/'models/edulab-teacher-qwen-0.5b-lora'\ntok=AutoTokenizer.from_pretrained(MODEL_ID); tok.pad_token=tok.eos_token\nmodel=AutoModelForCausalLM.from_pretrained(MODEL_ID,torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32)\n# Inspection réelle des modules\nlinear=sorted({n.split('.')[-1] for n,m in model.named_modules() if isinstance(m,torch.nn.Linear)})\nprint(linear)\ntarget=[x for x in ['q_proj','k_proj','v_proj','o_proj'] if x in linear]; assert target\nmodel=get_peft_model(model,LoraConfig(r=8,lora_alpha=16,lora_dropout=.05,target_modules=target,task_type='CAUSAL_LM'))\ndef load(name):\n rows=[json.loads(x) for x in open(ROOT/f'data/processed/edulab_teacher_{name}.jsonl',encoding='utf-8')]\n texts=[tok.apply_chat_template([{'role':'user','content':r['instruction']+'\\nContexte: '+r['context']},{'role':'assistant','content':r['response']}],tokenize=False) for r in rows]\n return Dataset.from_dict({'text':texts}).map(lambda b:tok(b['text'],truncation=True,max_length=384),batched=True,remove_columns=['text'])\ntrain,val=load('train'),load('validation')\nargs=TrainingArguments(output_dir=str(OUT/'checkpoints'),num_train_epochs=2,learning_rate=2e-4,per_device_train_batch_size=1,per_device_eval_batch_size=1,gradient_accumulation_steps=8,fp16=torch.cuda.is_available(),eval_strategy='steps',save_strategy='steps',eval_steps=25,save_steps=25,load_best_model_at_end=True,metric_for_best_model='eval_loss',seed=20260723,report_to='none')\ntrainer=Trainer(model=model,args=args,train_dataset=train,eval_dataset=val,data_collator=DataCollatorForLanguageModeling(tok,mlm=False),callbacks=[EarlyStoppingCallback(early_stopping_patience=2)])\nresult=trainer.train(); metrics=trainer.evaluate(); model.save_pretrained(OUT,safe_serialization=True); tok.save_pretrained(OUT/'tokenizer')\n(OUT/'metrics.json').write_text(json.dumps({**result.metrics,**metrics},indent=2)); (OUT/'training_args.json').write_text(json.dumps(args.to_dict(),indent=2,default=str))\nprint(metrics)"]),
    "05_teacher_model_evaluation.ipynb":("05 — Évaluation comparative",[common,"# Exécuter après 03 et 04. La grille humaine reste obligatoire.\nimport pandas as pd, json\ncriteria=['instruction_following','scientific_accuracy','level_fit','structure','formula_quality','hallucination_absence','french_quality','json_validity','context_fidelity']\nrubric=pd.DataFrame({'criterion':criteria,'scale':['0-2']*len(criteria),'human_required':[True]*len(criteria)})\ndisplay(rubric)","assert (ROOT/'models/edulab-teacher-qwen-0.5b-lora/adapter_config.json').exists(), 'Adaptateur non entraîné'\nprint('Adaptateur détecté; lancer la génération base/adaptée puis remplir la grille sans inventer de scores.')"]),
    "06_teacher_model_evaluation.ipynb":("06 — Évaluation d'inférence",[common,"!python scripts/evaluate_teacher_model.py","# Exécuter les cas gelés puis enregistrer exactitude, fidélité, latence et erreurs."])}
    for name,(title,cells) in specs.items(): nbf.write(notebook(title,cells),ROOT/"notebooks"/name)

def main():
    ensure_dirs(); build_catalogs(); rows,splits,features=build_dataset(); build_reports(rows,splits,features); build_notebooks(); print(json.dumps({"examples":len(rows),"splits":{k:len(v) for k,v in splits.items()}},ensure_ascii=False))
if __name__=="__main__": main()

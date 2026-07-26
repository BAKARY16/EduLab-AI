/* ============================================================
   EduLab AI — Contenu pédagogique
   Programmes ivoiriens (DPFC / Mon École à la Maison),
   ressources validées. Chaque cours indique sa provenance.
   NB: contenu éditorial de démonstration, clairement identifié.
   ============================================================ */

export type CourseStep =
  | { kind: "intro"; title: string; body: string }
  | { kind: "explain"; body: string }
  | { kind: "formula"; body: string }
  | { kind: "example"; body: string }
  | { kind: "question"; q: string; choices: string[]; answer: number }
  | { kind: "encouragement"; body: string };

export interface LessonContent {
  objective: string;
  steps: CourseStep[];
  keyFormulas: string[];
  sources: string[];
}

export interface CourseDef {
  key: string;
  level: string;
  subject: string;
  chapter: string;
  lesson: string;
  skill: string;
  title: string;
  summary: string;
  content: LessonContent;
  source: string;
  experimentKey?: string;
}

export const SUBJECT_COLORS: Record<string, string> = {
  Mathématiques: "sky",
  "Physique-Chimie": "amber",
  SVT: "leaf",
  "Sciences de la Vie et de la Terre": "leaf",
};

/* ----------------------- COURS ----------------------- */

export const COURSES: CourseDef[] = [
  {
    key: "pythagore",
    level: "Collège",
    subject: "Mathématiques",
    chapter: "Géométrie",
    lesson: "Théorème de Pythagore",
    skill: "Calculer une longueur dans un triangle rectangle",
    title: "Le théorème de Pythagore",
    summary:
      "Comprendre et appliquer la relation entre les côtés d'un triangle rectangle.",
    source: "Programme officiel DPFC — 3e",
    experimentKey: "function",
    content: {
      objective:
        "À la fin de cette leçon, tu sauras utiliser le théorème de Pythagore pour calculer une longueur manquante.",
      keyFormulas: ["BC² = AB² + AC²"],
      sources: ["Programme officiel 3e (DPFC)", "Mon École à la Maison"],
      steps: [
        {
          kind: "intro",
          title: "Bienvenue !",
          body: "Aujourd'hui, nous allons découvrir une relation très puissante qui relie les trois côtés d'un triangle rectangle. Prêt ? On y va ensemble.",
        },
        {
          kind: "explain",
          body: "Un triangle rectangle possède un angle droit (90°). Le côté opposé à cet angle s'appelle l'hypoténuse : c'est toujours le plus long côté.",
        },
        {
          kind: "formula",
          body: "Si ABC est rectangle en A, alors :  BC² = AB² + AC²   (la carré de l'hypoténuse = somme des carrés des deux autres côtés)",
        },
        {
          kind: "example",
          body: "Soit AB = 3 cm et AC = 4 cm. Alors BC² = 3² + 4² = 9 + 16 = 25, donc BC = √25 = 5 cm. C'est le fameux triangle 3-4-5 !",
        },
        {
          kind: "question",
          q: "Dans un triangle rectangle en A avec AB = 6 et AC = 8, que vaut l'hypoténuse BC ?",
          choices: ["10", "12", "14", "48"],
          answer: 0,
        },
        {
          kind: "encouragement",
          body: "Excellent ! Tu maîtrises le calcul de l'hypoténuse. Tu peux maintenant le faire pour n'importe quelles longueurs.",
        },
      ],
    },
  },
  {
    key: "fonctions",
    level: "Lycée",
    subject: "Mathématiques",
    chapter: "Étude de fonctions",
    lesson: "Fonctions affines",
    skill: "Représenter et interpréter une fonction affine",
    title: "Les fonctions affines",
    summary:
      "Découvrir f(x) = ax + b, tracer la droite et interpréter pente et ordonnée.",
    source: "Programme officiel DPFC — Seconde / Terminale",
    experimentKey: "function",
    content: {
      objective:
        "Tu sauras tracer et interpréter une fonction affine f(x) = ax + b.",
      keyFormulas: ["f(x) = a·x + b"],
      sources: ["Programme officiel (DPFC)", "Mon École à la Maison"],
      steps: [
        {
          kind: "intro",
          title: "Bonjour !",
          body: "Les fonctions affines modélisent beaucoup de situations de la vie courante : une facture d'eau, un salaire, une vitesse... Voyons comment.",
        },
        {
          kind: "formula",
          body: "Une fonction affine s'écrit  f(x) = a·x + b .  'a' est le coefficient directeur (la pente), 'b' est l'ordonnée à l'origine.",
        },
        {
          kind: "explain",
          body: "Si a > 0 la droite monte. Si a < 0 elle descend. 'b' correspond à la valeur de f(x) lorsque x = 0.",
        },
        {
          kind: "example",
          body: "f(x) = 2x + 1. En x=0, f=1. En x=1, f=3. La droite passe par (0,1) et (1,3) : elle monte de 2 unités quand x augmente de 1.",
        },
        {
          kind: "question",
          q: "Pour f(x) = -3x + 5, que vaut f(2) ?",
          choices: ["11", "1", "-1", "-6"],
          answer: 2,
        },
        {
          kind: "encouragement",
          body: "Parfait ! Tu sais maintenant calculer l'image d'un nombre par une fonction affine.",
        },
      ],
    },
  },
  {
    key: "ohm",
    level: "Collège",
    subject: "Physique-Chimie",
    chapter: "Électricité",
    lesson: "La loi d'Ohm",
    skill: "Relier tension, intensité et résistance",
    title: "La loi d'Ohm",
    summary:
      "Comprendre la relation U = R × I et l'expérimenter dans un circuit.",
    source: "Programme officiel DPFC — 3e",
    experimentKey: "ohm",
    content: {
      objective:
        "Tu sauras utiliser U = R·I pour calculer tension, intensité ou résistance.",
      keyFormulas: ["U = R × I", "R = U / I", "I = U / R"],
      sources: ["Programme officiel 3e (DPFC)", "Fomesoutra — fiches 3e"],
      steps: [
        {
          kind: "intro",
          title: "Salut !",
          body: "Pourquoi une ampoule brille-t-elle plus ou moins fort ? Tout dépend de la tension, de l'intensité et d'un petit composant : la résistance.",
        },
        {
          kind: "formula",
          body: "Loi d'Ohm :  U = R × I.   U en volts (V), R en ohms (Ω), I en ampères (A).",
        },
        {
          kind: "explain",
          body: "Plus la résistance est grande, plus elle freine le courant : pour une même tension, l'intensité diminue.",
        },
        {
          kind: "example",
          body: "Si R = 10 Ω et I = 0,5 A, alors U = 10 × 0,5 = 5 V. Tu peux lancer la simulation pour le voir en direct !",
        },
        {
          kind: "question",
          q: "Avec U = 12 V et R = 4 Ω, quelle est l'intensité I ?",
          choices: ["48 A", "3 A", "8 A", "0,33 A"],
          answer: 1,
        },
        {
          kind: "encouragement",
          body: "Génial ! Maintenant, direction le laboratoire virtuel pour manipuler la loi d'Ohm toi-même.",
        },
      ],
    },
  },
  {
    key: "ph",
    level: "Collège",
    subject: "Physique-Chimie",
    chapter: "Chimie des solutions",
    lesson: "Le pH et les solutions",
    skill: "Mesurer et interpréter le pH d'une solution",
    title: "Le pH d'une solution",
    summary:
      "Acide, basique ou neutre ? Comprendre l'échelle de pH et la dilution.",
    source: "Programme officiel DPFC — 3e / 2nde",
    experimentKey: "ph",
    content: {
      objective:
        "Tu sauras classer une solution et comprendre l'effet d'une dilution sur le pH.",
      keyFormulas: ["pH = -log₁₀(H⁺)", "0 ≤ pH ≤ 14"],
      sources: ["Programme officiel (DPFC)", "Fiches validated — 3e/2nde"],
      steps: [
        {
          kind: "intro",
          title: "Coucou !",
          body: "Le citron est acide, le savon est basique. Comment les comparer scientifiquement ? Grâce au pH !",
        },
        {
          kind: "formula",
          body: "Le pH est un nombre entre 0 et 14.   pH < 7 : acide   |   pH = 7 : neutre   |   pH > 7 : basique.",
        },
        {
          kind: "explain",
          body: "Diluer une solution acide (en ajoutant de l'eau) rapproche son pH de 7 : l'acidité diminue.",
        },
        {
          kind: "example",
          body: "Un vinaigre a un pH ≈ 3 (acide). En le diluant beaucoup, son pH se rapproche de 7 (neutre).",
        },
        {
          kind: "question",
          q: "Une solution de pH = 9 est...",
          choices: ["Acide", "Neutre", "Basique", "Toxique"],
          answer: 2,
        },
        {
          kind: "encouragement",
          body: "Bravo ! Tu peux maintenant tester différents pH dans le laboratoire virtuel.",
        },
      ],
    },
  },
  {
    key: "respiration",
    level: "Collège",
    subject: "SVT",
    chapter: "Respiration",
    lesson: "Les échanges respiratoires",
    skill: "Décrire les échanges de gaz au niveau des alvéoles",
    title: "La respiration et les échanges de gaz",
    summary:
      "Comprendre comment l'O₂ et le CO₂ sont échangés dans les poumons.",
    source: "Programme officiel DPFC — 3e / 2nde",
    experimentKey: "respiration",
    content: {
      objective:
        "Tu sauras décrire le trajet de l'air et les échanges gazeux alvéolaires.",
      keyFormulas: ["Air inspiré : 21% O₂", "Air expiré : 16% O₂, 4% CO₂"],
      sources: ["Programme officiel (DPFC)", "Mon École à la Maison"],
      steps: [
        {
          kind: "intro",
          title: "Bienvenue en SVT !",
          body: "On respire environ 20 000 fois par jour sans y penser. Que se passe-t-il vraiment dans nos poumons ?",
        },
        {
          kind: "explain",
          body: "L'air suit ce trajet : nez/mouth → trachée → bronches → alvéoles pulmonaires. C'est là qu'ont lieu les échanges de gaz.",
        },
        {
          kind: "formula",
          body: "Au niveau des alvéoles : l'O₂ passe dans le sang, et le CO₂ (déchet) passe du sang vers l'air expiré.",
        },
        {
          kind: "example",
          body: "L'air inspiré contient ~21% d'O₂ et très peu de CO₂. L'air expiré contient ~16% d'O₂ et ~4% de CO₂.",
        },
        {
          kind: "question",
          q: "Lors de la respiration, le gaz qui passe du sang vers les poumons est...",
          choices: ["L'oxygène (O₂)", "Le dioxyde de carbone (CO₂)", "L'azote", "L'hydrogène"],
          answer: 1,
        },
        {
          kind: "encouragement",
          body: "Très bien ! Tu as compris le principe des échanges gazeux.",
        },
      ],
    },
  },
  {
    key: "genetique",
    level: "Lycée",
    subject: "SVT",
    chapter: "Génétique",
    lesson: "Transmission des caractères",
    skill: "Prévoir les descendance grâce au croisement",
    title: "Génétique — croisements et hérédité",
    summary:
      "Prévoir la descendance d'un croisement à l'aide d'un échiquier.",
    source: "Programme officiel DPFC — Terminale D",
    experimentKey: "genetics",
    content: {
      objective:
        "Tu sauras construire un échiquier de Punnett et prévoir les proportions.",
      keyFormulas: ["Allèle dominant (A) / récessif (a)"],
      sources: ["Programme officiel Terminale D (DPFC)", "DECO — sujets BAC"],
      steps: [
        {
          kind: "intro",
          title: "Bonjour !",
          body: "Comment les caractères des parents sont-ils transmis aux enfants ? La génétique nous donne les clés.",
        },
        {
          kind: "explain",
          body: "Chaque caractère est porté par des allèles. Un allèle est dominant (s'exprime) ou récessif (masqué). Le génotype est noté AA, Aa ou aa.",
        },
        {
          kind: "formula",
          body: "Croisement Aa × Aa → l'échiquier donne : 25% AA, 50% Aa, 25% aa. Phénotype dominant : 75%.",
        },
        {
          kind: "example",
          body: "Si A = couleur dominante et a = récessive, deux parents Aa produiront 3/4 d'enfants au phénotype dominant et 1/4 au récessif.",
        },
        {
          kind: "question",
          q: "Dans un croisement Aa × Aa, quelle proportion d'individus aa (récessif) obtient-on ?",
          choices: ["1/4", "1/2", "3/4", "100%"],
          answer: 0,
        },
        {
          kind: "encouragement",
          body: "Parfait ! Lance la simulation de génétique pour visualiser l'échiquier.",
        },
      ],
    },
  },
];

/* ----------------------- LABORATOIRE ----------------------- */

export interface ExperimentDef {
  key: string;
  subject: string;
  lesson: string;
  title: string;
  summary: string;
  icon: string;
  difficulty: string;
  /** Slug d'une simulation PhET (Université du Colorado, CC-BY) intégrée en français. */
  phetSim?: string;
}

export const EXPERIMENTS: ExperimentDef[] = [
  {
    key: "phet-circuits",
    subject: "Physique-Chimie",
    lesson: "Le circuit électrique",
    title: "Labo — Construction de circuits",
    summary:
      "Monte de vrais circuits : piles, ampoules, interrupteurs, résistances, ampèremètre et voltmètre. Court-circuits et ampoules grillées inclus.",
    icon: "zap",
    difficulty: "6e/3e",
    phetSim: "circuit-construction-kit-dc",
  },
  {
    key: "phet-optique",
    subject: "Physique-Chimie",
    lesson: "Les lentilles",
    title: "Labo — Optique géométrique",
    summary:
      "Place un objet devant une lentille convergente ou divergente, trace les rayons et observe l'image réelle ou virtuelle se former.",
    icon: "eye",
    difficulty: "3e",
    phetSim: "geometric-optics-basics",
  },
  {
    key: "phet-acide-base",
    subject: "Physique-Chimie",
    lesson: "Acides & bases",
    title: "Labo — Solutions acido-basiques",
    summary:
      "Teste des solutions au pH-mètre, au papier indicateur et à la conductivité. Compare acides forts et faibles à l'échelle des molécules.",
    icon: "droplet",
    difficulty: "3e/2nde",
    phetSim: "acid-base-solutions",
  },
  {
    key: "phet-etats-matiere",
    subject: "Physique-Chimie",
    lesson: "Solides et liquides",
    title: "Labo — États de la matière",
    summary:
      "Chauffe ou refroidis néon, argon, oxygène et eau : observe les molécules passer de solide à liquide puis à gaz.",
    icon: "thermometer",
    difficulty: "5e",
    phetSim: "states-of-matter-basics",
  },
  {
    key: "phet-densite",
    subject: "Physique-Chimie",
    lesson: "Volume d'un liquide et d'un solide",
    title: "Labo — Masse, volume et densité",
    summary:
      "Plonge des blocs de matières différentes dans l'eau, mesure le volume déplacé et découvre pourquoi certains flottent.",
    icon: "scale",
    difficulty: "6e/5e",
    phetSim: "density",
  },
  {
    key: "titration",
    subject: "Physique-Chimie",
    lesson: "Acides & bases",
    title: "Paillasse 3D — Dosage acide-base",
    summary:
      "Manipule une vraie paillasse en 3D : burette, erlenmeyer, agitateur magnétique. Verse la soude, observe le BBT virer, trace la courbe pH et déduis la concentration inconnue.",
    icon: "flask-conical",
    difficulty: "3e/2nde",
  },
  {
    key: "ohm",
    subject: "Physique-Chimie",
    lesson: "Loi d'Ohm",
    title: "Circuit & loi d'Ohm",
    summary:
      "Fais varier la tension et la résistance, observe l'intensité et la courbe U = f(I).",
    icon: "zap",
    difficulty: "3e",
  },
  {
    key: "circuit",
    subject: "Physique-Chimie",
    lesson: "Circuits électriques",
    title: "Résistances en série & parallèle",
    summary:
      "Ajoute des résistances en série ou en parallèle, calcule la résistance équivalente.",
    icon: "git-branch",
    difficulty: "3e",
  },
  {
    key: "force",
    subject: "Physique-Chimie",
    lesson: "Mécanique",
    title: "Force, masse & accélération",
    summary:
      "Applique une force à une masse et observe l'accélération selon F = m·a.",
    icon: "rocket",
    difficulty: "2nde",
  },
  {
    key: "function",
    subject: "Mathématiques",
    lesson: "Fonctions",
    title: "Traceur de fonctions",
    summary:
      "Visualise affine, quadratique et sinusoïde en modifiant les paramètres.",
    icon: "line-chart",
    difficulty: "2nde/Tle",
  },
  {
    key: "stats",
    subject: "Mathématiques",
    lesson: "Statistiques",
    title: "Analyse statistique",
    summary:
      "Saisis une série, calcule moyenne/médiane/écart-type et dessine l'histogramme.",
    icon: "bar-chart-3",
    difficulty: "2nde",
  },
  {
    key: "ph",
    subject: "Physique-Chimie",
    lesson: "pH & dilution",
    title: "pH et dilution",
    summary:
      "Choisis une concentration et un volume de dilution, observe le pH évoluer.",
    icon: "droplet",
    difficulty: "3e/2nde",
  },
  {
    key: "respiration",
    subject: "SVT",
    lesson: "Respiration",
    title: "Échanges gazeux respiratoires",
    summary:
      "Anime la respiration et compare les concentrations de O₂ et CO₂.",
    icon: "wind",
    difficulty: "3e",
  },
  {
    key: "genetics",
    subject: "SVT",
    lesson: "Génétique",
    title: "Échiquier de croisement",
    summary:
      "Sélectionne les génotypes parentaux et génère l'échiquier de Punnett.",
    icon: "dna",
    difficulty: "Tle D",
  },
];

/* ----------------------- EXAMENS ----------------------- */

export interface ExamQuestion {
  q: string;
  choices: string[];
  answer: number;
  chapter: string;
  notion: string;
}

export interface ExamDef {
  key: string;
  exam: "BEPC" | "BAC";
  year: string;
  subject: string;
  chapter: string;
  difficulty: string;
  title: string;
  questions: ExamQuestion[];
  source: string;
}

export const EXAMS: ExamDef[] = [
  {
    key: "bepc-math-2023",
    exam: "BEPC",
    year: "2023",
    subject: "Mathématiques",
    chapter: "Mixte",
    difficulty: "moyen",
    title: "BEPC Mathématiques — Sujets types",
    source: "DECO — Banque de sujets BEPC",
    questions: [
      {
        q: "Calculer la valeur de 3x + 5 = 20.",
        choices: ["x = 5", "x = 15", "x = 3", "x = 7"],
        answer: 0,
        chapter: "Équations",
        notion: "Résolution d'équation du 1er degré",
      },
      {
        q: "Dans un triangle rectangle de côtés 5 et 12, l'hypoténuse vaut ?",
        choices: ["13", "17", "60", "7"],
        answer: 0,
        chapter: "Pythagore",
        notion: "Théorème de Pythagore",
      },
      {
        q: "Calculer 15% de 200.",
        choices: ["30", "15", "45", "20"],
        answer: 0,
        chapter: "Proportionnalité",
        notion: "Pourcentages",
      },
      {
        q: "Factoriser : x² - 9.",
        choices: ["(x-3)(x+3)", "(x-3)²", "(x+9)(x-1)", "x(x-9)"],
        answer: 0,
        chapter: "Calcul littéral",
        notion: "Identités remarquables",
      },
    ],
  },
  {
    key: "bepc-pc-2022",
    exam: "BEPC",
    year: "2022",
    subject: "Physique-Chimie",
    chapter: "Électricité",
    difficulty: "facile",
    title: "BEPC Physique-Chimie — Loi d'Ohm",
    source: "Fomesoutra — Annales BEPC",
    questions: [
      {
        q: "Si U = 6 V et R = 3 Ω, alors I = ?",
        choices: ["2 A", "18 A", "0,5 A", "9 A"],
        answer: 0,
        chapter: "Loi d'Ohm",
        notion: "U = R·I",
      },
      {
        q: "L'unité de la résistance est le ...",
        choices: ["Ohm (Ω)", "Volt (V)", "Ampère (A)", "Watt (W)"],
        answer: 0,
        chapter: "Grandeurs électriques",
        notion: "Unités SI",
      },
      {
        q: "Une solution de pH = 2 est ...",
        choices: ["Très acide", "Neutre", "Basique", "Salée"],
        answer: 0,
        chapter: "pH",
        notion: "Échelle de pH",
      },
    ],
  },
  {
    key: "bac-svt-d",
    exam: "BAC",
    year: "2023",
    subject: "SVT",
    chapter: "Génétique",
    difficulty: "difficile",
    title: "BAC Série D — Génétique",
    source: "DECO — Sujets BAC Série D",
    questions: [
      {
        q: "Croisement Aa × Aa : proportion de phénotype récessif ?",
        choices: ["1/4", "1/2", "3/4", "1"],
        answer: 0,
        chapter: "Génétique",
        notion: "Échiquier de Punnett",
      },
      {
        q: "Un allèle qui ne s'exprime qu'à l'état homozygote est dit...",
        choices: ["Récessif", "Dominant", "Létal", "Neutre"],
        answer: 0,
        chapter: "Génétique",
        notion: "Dominance/récessivité",
      },
      {
        q: "Le gaz libéré par les poumons lors de l'expiration est surtout...",
        choices: ["Le CO₂", "L'O₂", "L'azote", "Le dihydrogène"],
        answer: 0,
        chapter: "Respiration",
        notion: "Échanges gazeux",
      },
    ],
  },
];

export function getCourseByKey(key: string) {
  return COURSES.find((c) => c.key === key);
}
export function getExperimentByKey(key: string) {
  return EXPERIMENTS.find((e) => e.key === key);
}

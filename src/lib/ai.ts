/** Configuration des services IA et transformations déterministes de signaux réels. */
export const AGENTS = [
  { id: "recherche", name: "Agent Recherche RAG", role: "Interroge les cours indexés et la recherche autorisée", icon: "search" },
  { id: "professeur", name: "Professeur IA", role: "Résume, explique et démontre au tableau", icon: "presentation" },
  { id: "evaluation", name: "Agent Évaluateur", role: "Corrige et explique les erreurs", icon: "check-circle-2" },
  { id: "devoirs", name: "Assistant de devoirs", role: "Fournit des indices progressifs", icon: "pencil-ruler" },
  { id: "suivi", name: "Agent de suivi pédagogique", role: "Estime la maîtrise depuis les événements réels", icon: "gauge" },
  { id: "voix", name: "Service STT/TTS", role: "Reconnaissance et synthèse vocales", icon: "mic" },
  { id: "avatar", name: "Contrôleur du professeur 3D", role: "Synchronise parole et gestes", icon: "bot" },
] as const;

export function masteryLabel(value: number): { label: string; color: string } {
  if (value >= .8) return { label: "Maîtrisé", color: "leaf" };
  if (value >= .5) return { label: "En progrès", color: "amber" };
  if (value > 0) return { label: "À renforcer", color: "sky" };
  return { label: "Non débuté", color: "night" };
}

export function nextActivity(mastery: number): string {
  if (mastery < .3) return "Revoir la leçon avec le professeur, puis résoudre un exercice guidé.";
  if (mastery < .6) return "Continuer avec des exercices moyens et des indices progressifs.";
  if (mastery < .85) return "Passer aux exercices difficiles ou à un sujet chronométré.";
  return "Consolider cette compétence avec un sujet d'examen.";
}

export function adaptDifficulty(mastery: number): "facile" | "moyen" | "difficile" {
  return mastery < .4 ? "facile" : mastery < .75 ? "moyen" : "difficile";
}

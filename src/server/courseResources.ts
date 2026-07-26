import "server-only";

export type CourseResource = {
  id: string;
  title: string;
  kind: "pdf";
  authority: string;
  available: boolean;
  viewerUrl?: string;
  externalUrl?: string;
};

type ResourceDefinition = CourseResource & { localPath?: string };

const RESOURCE_DEFINITIONS: Record<string, ResourceDefinition> = {
  "SRC-MATH-3E": {
    id: "SRC-MATH-3E",
    title: "Programme officiel de Mathématiques — Troisième",
    kind: "pdf",
    authority: "DPFC",
    available: true,
    viewerUrl: "/api/resources/SRC-MATH-3E",
    localPath: "data/raw/dpfc/Troisième/Mathématiques/MATHS_3eme.pdf",
  },
  "SRC-PC-3E": {
    id: "SRC-PC-3E",
    title: "Programme officiel de Physique-Chimie — Troisième",
    kind: "pdf",
    authority: "DPFC",
    available: true,
    viewerUrl: "/api/resources/SRC-PC-3E",
    localPath: "data/raw/dpfc/Troisième/Physique-Chimie/PHYSIQUE-CHIMIE_3eme.pdf",
  },
  "FOM-LN-COURSE-1": { id: "FOM-LN-COURSE-1", title: "Cours TD Maths Tle S — Fonction logarithme", kind: "pdf", authority: "Fomesoutra", available: true, externalUrl: "https://www.fomesoutra.com/cours/secondaire/terminale/terminale-d/cours-de-mathematiques-terminale-d/8756-cours-td-maths-tle-s-by-m-m-tehua/file" },
  "FOM-LN-COURSE-2": { id: "FOM-LN-COURSE-2", title: "Mathématiques Terminale S — Fonction logarithme", kind: "pdf", authority: "Fomesoutra", available: true, externalUrl: "https://www.fomesoutra.com/cours/secondaire/terminale/terminale-d/cours-de-mathematiques-terminale-d/19195-cours-de-maths-tle-s-by-tehua/file" },
  "FOM-LN-COURSE-3": { id: "FOM-LN-COURSE-3", title: "Super cours de Maths Terminale D", kind: "pdf", authority: "Fomesoutra", available: true, externalUrl: "https://www.fomesoutra.com/cours/secondaire/terminale/terminale-d/cours-de-mathematiques-terminale-d/27564-super-cours-de-maths-tle-d-by-tehua/file" },
  "FOM-LN-EXO-1": { id: "FOM-LN-EXO-1", title: "TD Fonction logarithme Tle D", kind: "pdf", authority: "Fomesoutra", available: true, externalUrl: "https://www.fomesoutra.com/sujets/secondaire-1/terminale-1/sujets-de-terminale-d/sujets-de-mathematiques-niveau-terminale-d/devoirs-et-tp-de-mathematiques-niveau-terminale-d/22101-travaux-diriges-maths-fonction-logarithme-tle-d-by-tehua" },
  "FOM-LN-EXO-2": { id: "FOM-LN-EXO-2", title: "Fiche d'exercice ln et exponentielle", kind: "pdf", authority: "Fomesoutra", available: true, externalUrl: "https://www.fomesoutra.com/sujets/secondaire-1/terminale-1/sujets-de-terminale-d/sujets-de-mathematiques-niveau-terminale-d/devoirs-et-tp-de-mathematiques-niveau-terminale-d/22090-fiche-dexercice-maths-ln-et-expo-tle-d-by-tehua" },
  "FOM-LN-EXO-3": { id: "FOM-LN-EXO-3", title: "Série d'exercices Fonctions ln", kind: "pdf", authority: "Fomesoutra", available: true, externalUrl: "https://www.fomesoutra.com/sujets/secondaire-1/terminale-1/sujets-de-terminale-d/sujets-de-mathematiques-niveau-terminale-d/devoirs-et-tp-de-mathematiques-niveau-terminale-d/21377-serie-dexercices-fonctions-ln-tle-s-by-tehua" },
  "FOM-PROBA-TD": { id: "FOM-PROBA-TD", title: "Cours de Mathématiques Terminale D — Probabilités", kind: "pdf", authority: "Fomesoutra", available: true, externalUrl: "https://www.fomesoutra.com/cours/secondaire/terminale/terminale-d/cours-de-mathematiques-terminale-d/21660-cours-limites-rappels-by-tehua/file" },
  "FOM-CHIMIE-TD": { id: "FOM-CHIMIE-TD", title: "Cours complet de Chimie — Terminale D", kind: "pdf", authority: "Fomesoutra", available: true, externalUrl: "https://www.fomesoutra.com/cours/secondaire/terminale/terminale-d/cours-physique-chimie-terminale-d/cours-de-physiques-terminale-d/21661-cours-complet-chimie-tle-d-by-tehua/file" },
};

export function getCourseResource(sourceId: string) {
  return RESOURCE_DEFINITIONS[sourceId];
}

export function getPublicCourseResources(sourceIds: string[]): CourseResource[] {
  return sourceIds
    .map(getCourseResource)
    .filter((resource): resource is ResourceDefinition => Boolean(resource))
    .map(({ localPath: _localPath, ...resource }) => resource);
}

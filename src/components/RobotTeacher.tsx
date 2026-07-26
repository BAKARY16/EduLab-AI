"use client";

import { RobotProfessor3D } from "@/components/RobotProfessor3D";

export type RobotState = "arrivee" | "salutation" | "ecoute" | "reflexion" | "parole" | "ecriture" | "encouragement" | "correction" | "felicitation";

export function RobotTeacher({ state = "arrivee", size = 220, speaking = false, speechEnergy }: { state?: RobotState; size?: number; speaking?: boolean; speechEnergy?: { current: number } }) {
  return <RobotProfessor3D state={state} size={size} speaking={speaking} speechEnergy={speechEnergy}/>;
}

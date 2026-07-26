"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { RobotState } from "@/components/RobotTeacher";

type SpeechEnergyRef = { current: number };
type Props = { state: RobotState; speaking?: boolean; size?: number; speechEnergy?: SpeechEnergyRef };
type GroupRef = THREE.Group | null;

const silver = new THREE.MeshStandardMaterial({ color: "#c8c9c5", metalness: .72, roughness: .25 });
const silverDark = new THREE.MeshStandardMaterial({ color: "#687078", metalness: .8, roughness: .24 });
const copper = new THREE.MeshStandardMaterial({ color: "#a86636", metalness: .58, roughness: .3 });
const blue = new THREE.MeshStandardMaterial({ color: "#537f99", metalness: .52, roughness: .28 });
const dark = new THREE.MeshStandardMaterial({ color: "#111820", metalness: .35, roughness: .22 });
const paper = new THREE.MeshStandardMaterial({ color: "#ece3ce", roughness: .78 });

export function RobotProfessor3D({ state, speaking = false, size = 260, speechEnergy }: Props) {
  return <div style={{ width: size, height: size * 1.15 }} className="relative shrink-0" role="img" aria-label={`Professeur IA 3D, état ${state}`}>
    <Canvas dpr={[1, 1.65]} camera={{ position: [0, 1.2, 6.4], fov: 31 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
      <Suspense fallback={null}><RobotRig state={state} speaking={speaking} speechEnergy={speechEnergy}/></Suspense>
      <ambientLight intensity={1.5}/><directionalLight position={[4, 6, 5]} intensity={3.2} color="#fff7e8"/><directionalLight position={[-4, 2, 3]} intensity={1.4} color="#b9dddf"/>
      <ContactShadows position={[0, -2.45, 0]} opacity={.24} scale={5} blur={2.7} far={4}/>
    </Canvas>
  </div>;
}

function RobotRig({ state, speaking, speechEnergy }: { state: RobotState; speaking: boolean; speechEnergy?: SpeechEnergyRef }) {
  const root = useRef<GroupRef>(null), head = useRef<GroupRef>(null), jaw = useRef<GroupRef>(null), leftArm = useRef<GroupRef>(null), rightArm = useRef<GroupRef>(null), leftFore = useRef<GroupRef>(null), rightFore = useRef<GroupRef>(null), pupils = useRef<GroupRef>(null);
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const { pointer } = useThree();

  useFrame(({ clock }, delta) => {
    if (!root.current || !head.current || !jaw.current || !leftArm.current || !rightArm.current || !leftFore.current || !rightFore.current || !pupils.current) return;
    const t = clock.elapsedTime, smooth = Math.min(1, delta * 6), activeSpeech = speaking || state === "parole";
    const breathe = reducedMotion ? 0 : Math.sin(t * 1.45) * .025;
    root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, breathe, smooth);
    root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, reducedMotion ? 0 : Math.sin(t * .55) * .012, smooth);

    const targetHeadX = state === "ecriture" ? -.12 : state === "reflexion" ? .11 : -pointer.y * .07;
    const targetHeadY = state === "ecriture" ? -.24 : pointer.x * .11;
    head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, targetHeadX + (activeSpeech ? Math.sin(t * 3.1) * .018 : 0), smooth);
    head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, targetHeadY, smooth);
    pupils.current.position.x = THREE.MathUtils.lerp(pupils.current.position.x, pointer.x * .035, smooth);
    pupils.current.position.y = THREE.MathUtils.lerp(pupils.current.position.y, pointer.y * .025, smooth);

    const measuredEnergy = speechEnergy?.current ?? 0;
    const jawOpen = activeSpeech && !reducedMotion ? (measuredEnergy > .008 ? THREE.MathUtils.clamp(measuredEnergy * 2.8, .025, .16) : .028 + Math.abs(Math.sin(t * 10.7) + Math.sin(t * 6.2) * .5) * .065) : 0;
    jaw.current.scale.y = THREE.MathUtils.lerp(jaw.current.scale.y, .25 + jawOpen * 5, Math.min(1, delta * 18));

    let leftZ = .16, rightZ = -.16, leftX = 0, rightX = 0, leftForeZ = -.7, rightForeZ = .7;
    if (state === "salutation" || state === "felicitation") { rightZ = -1.68; rightX = -.2; rightForeZ = -.35 + Math.sin(t * 5) * .18; }
    else if (state === "ecriture") { rightZ = -1.1; rightX = -.36; rightForeZ = -.95; }
    else if (state === "reflexion") { rightZ = -.75; rightX = -.35; rightForeZ = -1.25; }
    else if (activeSpeech) { leftZ = .3 + Math.sin(t * 2.4) * .12; rightZ = -.35 - Math.sin(t * 2.4 + 1) * .14; leftForeZ = -.55; rightForeZ = .55; }
    leftArm.current.rotation.set(THREE.MathUtils.lerp(leftArm.current.rotation.x, leftX, smooth), 0, THREE.MathUtils.lerp(leftArm.current.rotation.z, leftZ, smooth));
    rightArm.current.rotation.set(THREE.MathUtils.lerp(rightArm.current.rotation.x, rightX, smooth), 0, THREE.MathUtils.lerp(rightArm.current.rotation.z, rightZ, smooth));
    leftFore.current.rotation.z = THREE.MathUtils.lerp(leftFore.current.rotation.z, leftForeZ, smooth);
    rightFore.current.rotation.z = THREE.MathUtils.lerp(rightFore.current.rotation.z, rightForeZ, smooth);
  });

  return <group ref={root} position={[0, -.18, 0]} scale={1.03}>
    <group position={[0, -1.05, 0]}>
      <RoundedBox args={[1.42, 1.45, .82]} radius={.38} smoothness={5} material={silver}/>
      <mesh position={[0, .13, .43]} material={blue} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.23, .23, .09, 32]}/></mesh>
      <mesh position={[0, .13, .49]} material={dark} rotation={[Math.PI / 2,0,0]}><cylinderGeometry args={[.12,.12,.07,32]}/></mesh>
      <mesh position={[0, -.55, .43]} material={silverDark}><boxGeometry args={[.68,.08,.08]}/></mesh>
    </group>

    <mesh position={[0, -.23, 0]} material={dark}><cylinderGeometry args={[.23,.26,.34,24]}/></mesh>
    <group ref={head} position={[0, .58, .03]}>
      <RoundedBox args={[1.75, 1.34, 1.05]} radius={.46} smoothness={6} material={silver}/>
      <RoundedBox args={[1.44, .2, .94]} radius={.1} smoothness={3} position={[0,.62,.02]} material={copper}/>
      <mesh position={[-.95,.03,0]} rotation={[0,0,Math.PI/2]} material={copper}><cylinderGeometry args={[.28,.28,.18,32]}/></mesh>
      <mesh position={[.95,.03,0]} rotation={[0,0,Math.PI/2]} material={copper}><cylinderGeometry args={[.28,.28,.18,32]}/></mesh>
      <group ref={pupils} position={[0, .12, .56]}>
        <Eye x={-.38}/><Eye x={.38}/>
      </group>
      <mesh position={[0,.53,.56]} material={silverDark}><sphereGeometry args={[.085,20,20]}/></mesh>
      <group ref={jaw} position={[0,-.29,.565]} scale={[1,.25,1]}><RoundedBox args={[.48,.12,.07]} radius={.055} smoothness={3} material={dark}/><mesh position={[0,-.035,.035]} material={new THREE.MeshStandardMaterial({color:"#b16c62",roughness:.7})}><boxGeometry args={[.32,.035,.025]}/></mesh></group>
    </group>

    <Arm side="left" shoulder={[-.85,-.66,0]} upperRef={leftArm} foreRef={leftFore}/><Arm side="right" shoulder={[.85,-.66,0]} upperRef={rightArm} foreRef={rightFore}/>
    <group position={[0,-1.17,.7]} rotation={[-.11,0,0]}>
      <RoundedBox args={[1.18,.82,.12]} radius={.05} smoothness={3} material={dark}/>
      <mesh position={[0,.43,.015]} material={copper}><boxGeometry args={[1.23,.07,.15]}/></mesh>
      <mesh position={[0,0,.075]} material={paper}><boxGeometry args={[1.02,.67,.025]}/></mesh>
      <mesh position={[0,0,.095]} material={blue}><boxGeometry args={[.025,.66,.018]}/></mesh>
    </group>
  </group>;
}

function Eye({ x }: { x: number }) { return <group position={[x,0,0]}><mesh material={paper}><sphereGeometry args={[.285,32,24]}/></mesh><mesh position={[0,0,.22]} material={dark}><sphereGeometry args={[.17,32,24]}/></mesh><mesh position={[-.045,.06,.365]} material={paper}><sphereGeometry args={[.045,16,12]}/></mesh></group>; }

function Arm({ side, shoulder, upperRef, foreRef }: { side: "left" | "right"; shoulder: [number,number,number]; upperRef: React.RefObject<GroupRef>; foreRef: React.RefObject<GroupRef> }) {
  const s = side === "left" ? -1 : 1;
  return <group ref={upperRef} position={shoulder}>
    <mesh material={silver} rotation={[0,0,Math.PI/2]}><capsuleGeometry args={[.24,.27,8,20]}/></mesh><mesh position={[s*.34,-.31,0]} rotation={[0,0,s*.08]} material={silverDark}><capsuleGeometry args={[.14,.42,8,18]}/></mesh>
    <group ref={foreRef} position={[s*.4,-.62,0]} rotation={[0,0,s*.7]}><mesh position={[s*.26,-.18,0]} material={silver}><capsuleGeometry args={[.13,.4,8,18]}/></mesh><mesh position={[s*.48,-.34,.05]} material={copper}><sphereGeometry args={[.18,24,18]}/></mesh></group>
  </group>;
}

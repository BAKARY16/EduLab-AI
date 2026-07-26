"use client";

/**
 * Paillasse 3D — Dosage acide-base (programme Physique-Chimie 3e/2nde).
 * Chimie réelle : HCl (Ca inconnue, Va = 20 mL) dosé par NaOH (Cb = 0,10 mol/L).
 * pH calculé par les vraies formules (acide fort / base forte), indicateur BBT
 * (jaune < 6, vert 6–7,6, bleu > 7,6). L'élève relève (Vb, pH), trace la courbe,
 * repère l'équivalence et en déduit Ca — exactement le protocole du TP réel.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Beaker, Droplets, FlaskConical, Pause, Play, RotateCcw, Table2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";

/* ----------------------- Chimie réelle ----------------------- */

const VA_ML = 20; // volume d'acide dans l'erlenmeyer
const CB = 0.1; // concentration de la soude dans la burette (mol/L)
const BURETTE_ML = 25;
const CA_CHOICES = [0.04, 0.05, 0.06, 0.08];

function computePh(ca: number, vbMl: number): number {
  const na = ca * VA_ML; // mmol d'acide
  const nb = CB * vbMl; // mmol de base versée
  const totalL = (VA_ML + vbMl) / 1000;
  if (Math.abs(na - nb) < 1e-6) return 7;
  if (nb < na) return -Math.log10((na - nb) / 1000 / totalL);
  return 14 + Math.log10((nb - na) / 1000 / totalL);
}

/** Couleur du BBT selon le pH — transitions continues autour des zones de virage. */
function bbtColor(ph: number, hasIndicator: boolean): THREE.Color {
  if (!hasIndicator) return new THREE.Color("#dfe9ee"); // solution incolore, léger reflet
  const yellow = new THREE.Color("#e8c832");
  const green = new THREE.Color("#3f9d5a");
  const blue = new THREE.Color("#2456b3");
  if (ph <= 6) return yellow.lerp(green, THREE.MathUtils.clamp((ph - 5.4) / 0.6, 0, 1) * 0.35);
  if (ph < 7.6) return green.clone().lerp(ph < 7 ? yellow : blue, Math.abs(ph - 6.8) / 1.6);
  return blue.lerp(green, THREE.MathUtils.clamp((8.2 - ph) / 0.6, 0, 1) * 0.35);
}

/* ----------------------- Matériaux partagés ----------------------- */

const glassMat = new THREE.MeshPhysicalMaterial({
  color: "#ffffff", transmission: 0.92, thickness: 0.25, roughness: 0.06,
  ior: 1.45, transparent: true, opacity: 0.35, depthWrite: false,
});
const steelMat = new THREE.MeshStandardMaterial({ color: "#9aa3a8", metalness: 0.85, roughness: 0.3 });
const steelDark = new THREE.MeshStandardMaterial({ color: "#4c565c", metalness: 0.8, roughness: 0.35 });
const benchMat = new THREE.MeshStandardMaterial({ color: "#1d3b2f", roughness: 0.55, metalness: 0.08 });
const stirrerMat = new THREE.MeshStandardMaterial({ color: "#e8e4da", roughness: 0.5 });

/* ----------------------- Scène 3D ----------------------- */

function LabScene({ vbRef, phRef, hasIndicator, flowing }: {
  vbRef: { current: number }; phRef: { current: number }; hasIndicator: boolean; flowing: boolean;
}) {
  const flaskLiquid = useRef<THREE.Mesh>(null);
  const flaskLiquidMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const buretteLiquid = useRef<THREE.Mesh>(null);
  const drop = useRef<THREE.Mesh>(null);
  const stirBar = useRef<THREE.Mesh>(null);
  const surface = useRef<THREE.Mesh>(null);
  const dropT = useRef(0);

  useFrame((_, delta) => {
    const vb = vbRef.current;
    // Niveau burette : descend au fur et à mesure du volume versé
    if (buretteLiquid.current) {
      const level = Math.max(0.001, (BURETTE_ML - vb) / BURETTE_ML);
      buretteLiquid.current.scale.y = level;
      buretteLiquid.current.position.y = 3.05 + (level * 1.5) / 2;
    }
    // Volume et couleur dans l'erlenmeyer
    if (flaskLiquid.current && flaskLiquidMat.current) {
      const fill = THREE.MathUtils.clamp((VA_ML + vb) / (VA_ML + BURETTE_ML), 0.3, 1);
      flaskLiquid.current.scale.setScalar(0.94 * fill ** 0.5);
      const target = bbtColor(phRef.current, hasIndicator);
      flaskLiquidMat.current.color.lerp(target, Math.min(1, delta * 3.5));
      if (surface.current) {
        surface.current.position.y = 0.62 + fill * 0.55;
        surface.current.scale.setScalar(0.55 + fill * 0.32);
        (surface.current.material as THREE.MeshStandardMaterial).color.copy(flaskLiquidMat.current.color);
      }
    }
    // Barreau aimanté : rotation continue + légère ondulation de surface
    if (stirBar.current) stirBar.current.rotation.y += delta * 9;
    if (surface.current) surface.current.rotation.y += delta * 1.8;
    // Goutte : chute cyclique depuis le robinet quand la burette coule
    if (drop.current) {
      if (flowing && vb < BURETTE_ML) {
        dropT.current = (dropT.current + delta * 2.6) % 1;
        drop.current.visible = true;
        drop.current.position.y = 2.85 - dropT.current * 1.55;
        drop.current.scale.setScalar(0.045 + dropT.current * 0.012);
      } else {
        drop.current.visible = false;
        dropT.current = 0;
      }
    }
  });

  return (
    <group position={[0, -1.6, 0]}>
      {/* Paillasse */}
      <RoundedBox args={[7.2, 0.28, 4.4]} radius={0.06} position={[0, -0.15, 0]} material={benchMat} />
      <RoundedBox args={[6.9, 0.06, 4.1]} radius={0.03} position={[0, 0.02, 0]}
        material={new THREE.MeshStandardMaterial({ color: "#24493a", roughness: 0.25, metalness: 0.15 })} />

      {/* Potence */}
      <mesh position={[-1.65, 0.1, -0.6]} material={steelDark}><cylinderGeometry args={[0.5, 0.55, 0.12, 32]} /></mesh>
      <mesh position={[-1.65, 2.4, -0.6]} material={steelMat}><cylinderGeometry args={[0.045, 0.045, 4.6, 16]} /></mesh>
      <mesh position={[-0.85, 3.6, -0.6]} rotation={[0, 0, Math.PI / 2]} material={steelMat}>
        <cylinderGeometry args={[0.035, 0.035, 1.7, 12]} />
      </mesh>
      {/* Pince de burette */}
      <mesh position={[0, 3.6, -0.6]} material={steelDark}><torusGeometry args={[0.16, 0.035, 10, 24]} /></mesh>

      {/* Burette (verre) + graduations */}
      <mesh position={[0, 3.8, -0.6]} material={glassMat}><cylinderGeometry args={[0.11, 0.11, 1.9, 24]} /></mesh>
      <mesh ref={buretteLiquid} position={[0, 3.8, -0.6]}>
        <cylinderGeometry args={[0.088, 0.088, 1.5, 20]} />
        <meshPhysicalMaterial color="#cfe4f5" transmission={0.4} roughness={0.1} transparent opacity={0.85} />
      </mesh>
      {[...Array(6)].map((_, i) => (
        <mesh key={i} position={[0.1, 3.1 + i * 0.28, -0.6]} rotation={[0, 0, Math.PI / 2]} material={steelDark}>
          <cylinderGeometry args={[0.004, 0.004, 0.06, 6]} />
        </mesh>
      ))}
      {/* Robinet */}
      <mesh position={[0, 2.95, -0.6]} material={glassMat}><cylinderGeometry args={[0.055, 0.03, 0.35, 16]} /></mesh>
      <mesh position={[0.09, 2.95, -0.6]} rotation={[0, 0, Math.PI / 2]} material={steelDark}>
        <cylinderGeometry args={[0.03, 0.03, 0.16, 10]} />
      </mesh>

      {/* Goutte */}
      <mesh ref={drop} position={[0, 2.8, -0.6]} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshPhysicalMaterial color="#cfe4f5" transmission={0.5} roughness={0.05} transparent opacity={0.9} />
      </mesh>

      {/* Agitateur magnétique */}
      <RoundedBox args={[1.5, 0.3, 1.2]} radius={0.07} position={[0, 0.2, -0.6]} material={stirrerMat} />
      <mesh position={[0.55, 0.37, -0.25]} material={new THREE.MeshStandardMaterial({ color: "#c94f35", roughness: 0.4 })}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
      </mesh>

      {/* Erlenmeyer (verre) */}
      <group position={[0, 0.36, -0.6]}>
        <mesh position={[0, 0.55, 0]} material={glassMat}><cylinderGeometry args={[0.42, 0.95, 1.1, 32, 1, true]} /></mesh>
        <mesh position={[0, 1.32, 0]} material={glassMat}><cylinderGeometry args={[0.24, 0.24, 0.55, 24, 1, true]} /></mesh>
        <mesh position={[0, 0.01, 0]} material={glassMat}><cylinderGeometry args={[0.95, 0.95, 0.03, 32]} /></mesh>
        {/* Liquide (cône tronqué, couleur = BBT/pH) */}
        <mesh ref={flaskLiquid} position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.52, 0.9, 0.85, 28]} />
          <meshPhysicalMaterial ref={flaskLiquidMat} color="#dfe9ee" transmission={0.25}
            roughness={0.15} transparent opacity={0.92} />
        </mesh>
        {/* Surface du liquide, tourne avec l'agitation */}
        <mesh ref={surface} position={[0, 0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.62, 28]} />
          <meshStandardMaterial color="#dfe9ee" roughness={0.05} metalness={0.1} transparent opacity={0.85} />
        </mesh>
        {/* Barreau aimanté */}
        <mesh ref={stirBar} position={[0, 0.1, 0]} material={new THREE.MeshStandardMaterial({ color: "#f4f2ec", roughness: 0.35 })}>
          <capsuleGeometry args={[0.06, 0.4, 6, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/* ----------------------- Composant principal ----------------------- */

export default function TitrationLab3D() {
  const [ca] = useState(() => CA_CHOICES[Math.floor(Math.random() * CA_CHOICES.length)]);
  const [vb, setVb] = useState(0);
  const [flowing, setFlowing] = useState(false);
  const [hasIndicator, setHasIndicator] = useState(false);
  const [readings, setReadings] = useState<{ vb: number; ph: number }[]>([]);
  const [guess, setGuess] = useState("");
  const [verdict, setVerdict] = useState<null | boolean>(null);
  const curveRef = useRef<HTMLCanvasElement>(null);

  const ph = useMemo(() => computePh(ca, vb), [ca, vb]);
  const vbRef = useRef(0);
  const phRef = useRef(ph);
  vbRef.current = vb;
  phRef.current = ph;

  const veq = (ca * VA_ML) / CB;

  // Écoulement continu (~0,9 mL/s), arrêt automatique burette vide
  useEffect(() => {
    if (!flowing) return;
    const id = setInterval(() => {
      setVb((v) => {
        const next = Math.min(BURETTE_ML, v + 0.045);
        if (next >= BURETTE_ML) setFlowing(false);
        return Number(next.toFixed(3));
      });
    }, 50);
    return () => clearInterval(id);
  }, [flowing]);

  const addDrop = useCallback(() => setVb((v) => Number(Math.min(BURETTE_ML, v + 0.05).toFixed(3))), []);
  const record = useCallback(() => {
    setReadings((r) => [...r.filter((x) => x.vb !== vb), { vb, ph }].sort((a, b) => a.vb - b.vb));
  }, [vb, ph]);
  const reset = useCallback(() => {
    setVb(0); setFlowing(false); setReadings([]); setGuess(""); setVerdict(null);
  }, []);

  // Courbe pH = f(Vb) : points relevés + courbe théorique en pointillé après 3 relevés
  useEffect(() => {
    const canvas = curveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);
    const px = (v: number) => 34 + (v / BURETTE_ML) * (w - 46);
    const py = (p: number) => h - 24 - (p / 14) * (h - 36);
    ctx.strokeStyle = "#c9d4cd"; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(34, 10); ctx.lineTo(34, h - 24); ctx.lineTo(w - 10, h - 24); ctx.stroke();
    ctx.fillStyle = "#5b6f64"; ctx.font = "10px Inter, sans-serif";
    ctx.fillText("pH", 6, 16); ctx.fillText("Vb (mL)", w - 52, h - 8);
    [0, 7, 14].forEach((p) => { ctx.fillText(String(p), 16, py(p) + 3); });
    [0, 5, 10, 15, 20, 25].forEach((v) => { ctx.fillText(String(v), px(v) - 5, h - 10); });
    if (readings.length >= 3) {
      ctx.strokeStyle = "#8fb8a1"; ctx.setLineDash([4, 4]); ctx.beginPath();
      for (let v = 0; v <= BURETTE_ML; v += 0.1) {
        const p = computePh(ca, v);
        if (v === 0) ctx.moveTo(px(v), py(p)); else ctx.lineTo(px(v), py(p));
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = "#1f6b4e";
    readings.forEach(({ vb: v, ph: p }) => {
      ctx.beginPath(); ctx.arc(px(v), py(p), 3.5, 0, Math.PI * 2); ctx.fill();
    });
  }, [readings, ca]);

  const checkGuess = () => {
    const value = Number(guess.replace(",", "."));
    if (!Number.isFinite(value)) return;
    setVerdict(Math.abs(value - ca) / ca < 0.12);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* Scène 3D */}
      <Card className="overflow-hidden lg:col-span-3">
        <div className="h-[440px] bg-gradient-to-b from-[#eef2ec] to-[#dde6dd]">
          <Canvas dpr={[1, 1.5]} camera={{ position: [2.6, 1.4, 5.6], fov: 36 }} gl={{ antialias: true }}>
            <Suspense fallback={null}>
              <LabScene vbRef={vbRef} phRef={phRef} hasIndicator={hasIndicator} flowing={flowing} />
            </Suspense>
            <ambientLight intensity={1.1} />
            <directionalLight position={[5, 7, 4]} intensity={2.6} color="#fff6e6" />
            <directionalLight position={[-4, 3, -2]} intensity={0.9} color="#cfe3d8" />
            <ContactShadows position={[0, -1.86, 0]} opacity={0.3} scale={9} blur={2.4} far={4} />
            <OrbitControls enablePan={false} minDistance={3.4} maxDistance={9}
              minPolarAngle={0.6} maxPolarAngle={1.5} target={[0, 0.4, -0.4]} />
          </Canvas>
        </div>
        <p className="border-t border-night-900/10 px-4 py-2 text-[11px] text-night-800/55">
          Fais tourner la caméra (glisser) et zoome (molette) pour observer la paillasse sous tous les angles.
        </p>
      </Card>

      {/* Pupitre de TP */}
      <div className="space-y-4 lg:col-span-2">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-night-900">
              <FlaskConical className="h-4 w-4 text-turq" /> Protocole
            </p>
            <Badge color="amber">Ca inconnue</Badge>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-night-800/70">
            Erlenmeyer : {VA_ML} mL de HCl de concentration <strong>Ca inconnue</strong>. Burette : NaOH à Cb = {CB} mol/L.
            Ajoute le BBT, verse la soude, relève pH et volume, puis déduis Ca à l&apos;équivalence.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-night-900/5 p-2.5">
              <p className="text-[11px] text-night-800/60">Volume versé Vb</p>
              <p className="text-xl font-bold text-night-900">{vb.toFixed(2)} <span className="text-xs font-medium">mL</span></p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: `#${bbtColor(ph, hasIndicator).getHexString()}22` }}>
              <p className="text-[11px] text-night-800/60">pH-mètre</p>
              <p className="text-xl font-bold text-night-900">{ph.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {!hasIndicator && (
              <Button size="sm" variant="soft" onClick={() => setHasIndicator(true)}>
                <Droplets className="h-4 w-4" /> Ajouter le BBT
              </Button>
            )}
            <Button size="sm" onClick={() => setFlowing((f) => !f)} disabled={vb >= BURETTE_ML}>
              {flowing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {flowing ? "Fermer le robinet" : "Ouvrir le robinet"}
            </Button>
            <Button size="sm" variant="outline" onClick={addDrop} disabled={flowing || vb >= BURETTE_ML}>
              Goutte à goutte (+0,05 mL)
            </Button>
            <Button size="sm" variant="outline" onClick={record}>
              <Table2 className="h-4 w-4" /> Relever (Vb, pH)
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" /> Réinitialiser</Button>
          </div>
        </Card>

        <Card className="p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-night-900">
            <Beaker className="h-4 w-4 text-turq" /> Courbe de dosage pH = f(Vb)
          </p>
          <canvas ref={curveRef} width={430} height={190} className="mt-2 w-full" />
          {readings.length > 0 && (
            <div className="mt-2 max-h-24 overflow-y-auto rounded-lg border border-night-900/10">
              <table className="w-full text-xs">
                <thead className="bg-night-900/5 text-night-800/70">
                  <tr><th className="px-2 py-1 text-left">Vb (mL)</th><th className="px-2 py-1 text-left">pH</th></tr>
                </thead>
                <tbody>
                  {readings.map((r) => (
                    <tr key={r.vb} className="border-t border-night-900/5">
                      <td className="px-2 py-1">{r.vb.toFixed(2)}</td><td className="px-2 py-1">{r.ph.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 rounded-xl bg-sky-edu/5 p-3">
            <p className="text-xs font-semibold text-night-900">Exploitation : quelle est la concentration Ca ?</p>
            <p className="mt-0.5 text-[11px] text-night-800/60">
              À l&apos;équivalence : Ca × Va = Cb × Véq, donc Ca = Cb × Véq / Va.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={guess}
                onChange={(e) => { setGuess(e.target.value); setVerdict(null); }}
                placeholder="Ca en mol/L (ex : 0,05)"
                className="flex-1 rounded-lg border border-night-900/15 px-3 py-1.5 text-xs outline-none focus:border-turq"
              />
              <Button size="sm" onClick={checkGuess}>Vérifier</Button>
            </div>
            {verdict !== null && (
              <p className={`mt-2 text-xs font-semibold ${verdict ? "text-leaf" : "text-amber-edu"}`}>
                {verdict
                  ? `Exact ! Véq ≈ ${veq.toFixed(1)} mL, donc Ca = ${CB} × ${veq.toFixed(1)} / ${VA_ML} = ${ca.toFixed(2)} mol/L.`
                  : "Pas encore — repère le volume Véq où le BBT vire au vert (pH = 7), puis applique Ca = Cb × Véq / Va."}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

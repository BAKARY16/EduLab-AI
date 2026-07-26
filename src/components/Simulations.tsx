"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  Zap,
  GitBranch,
  Rocket,
  LineChart,
  BarChart3,
  Droplet,
  Wind,
  Dna,
  CheckCircle2,
  XCircle,
  Beaker,
  Lightbulb,
} from "lucide-react";

/* Shared building blocks */
function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-night-900/10 bg-white p-5">
      {title && <p className="mb-3 text-sm font-bold text-night-900">{title}</p>}
      {children}
    </div>
  );
}

function Slider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-night-800">{label}</span>
        <span className="font-bold text-turq">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full"
      />
    </div>
  );
}

function Obs({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-sky-edu/5 p-3 text-sm text-night-800">
      <span className="font-semibold text-sky-edu">Observation : </span>
      {children}
    </div>
  );
}

function Quiz({ q, choices, answer }: { q: string; choices: string[]; answer: number }) {
  const [sel, setSel] = useState<number | null>(null);
  const done = sel !== null;
  return (
    <div className="mt-4 rounded-xl bg-violet-edu/5 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-violet-edu">
        <Lightbulb className="h-4 w-4" /> Quiz
      </p>
      <p className="mt-1 text-sm text-night-800">{q}</p>
      <div className="mt-2 space-y-1.5">
        {choices.map((c, i) => (
          <button
            key={i}
            onClick={() => setSel(i)}
            disabled={done}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
              done && i === answer ? "border-leaf bg-leaf/10" : done && sel === i ? "border-red-400 bg-red-50" : "border-night-900/15 hover:border-violet-edu"
            }`}
          >
            {c}
            {done && i === answer && <CheckCircle2 className="h-4 w-4 text-leaf" />}
            {done && sel === i && i !== answer && <XCircle className="h-4 w-4 text-red-500" />}
          </button>
        ))}
      </div>
    </div>
  );
}

const ICONS: Record<string, typeof Zap> = {
  ohm: Zap, circuit: GitBranch, force: Rocket, function: LineChart, stats: BarChart3, ph: Droplet, respiration: Wind, genetics: Dna,
};

/* ========================= OHM ========================= */
function OhmSim() {
  const [u, setU] = useState(6);
  const [r, setR] = useState(10);
  const i = u / r;
  const brightness = Math.min(1, i / 1.5);
  const points = useRef<{ x: number; y: number }[]>([]);
  useEffect(() => {
    const cv = document.getElementById("ohm-graph") as HTMLCanvasElement | null;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    // axes
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(30, 10); ctx.lineTo(30, H - 20); ctx.lineTo(W - 10, H - 20); ctx.stroke();
    ctx.fillStyle = "#64748b"; ctx.font = "10px sans-serif";
    ctx.fillText("I(A)", 4, 16); ctx.fillText("U(V)", W - 22, H - 6);
    // line U = R*I  => for given R
    ctx.strokeStyle = "#14b8a6"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    const maxI = 2;
    for (let ii = 0; ii <= maxI; ii += 0.05) {
      const U = r * ii;
      const px = 30 + (ii / maxI) * (W - 45);
      const py = H - 20 - (U / 24) * (H - 35);
      ii === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    // current point
    ctx.fillStyle = "#f97316";
    const px = 30 + (i / maxI) * (W - 45);
    const py = H - 20 - (u / 24) * (H - 35);
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    points.current.push({ x: px, y: py });
  }, [u, r, i]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <Panel title="Paramètres">
          <div className="space-y-3">
            <Slider label="Tension U" value={u} min={0} max={24} step={1} unit=" V" onChange={setU} />
            <Slider label="Résistance R" value={r} min={1} max={50} step={1} unit=" Ω" onChange={setR} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Metric label="U" value={`${u}`} unit="V" />
            <Metric label="R" value={`${r}`} unit="Ω" />
            <Metric label="I" value={i.toFixed(2)} unit="A" highlight />
          </div>
          <Obs>Intensité I = U / R = {u} / {r} = <strong>{i.toFixed(2)} A</strong>. Plus R augmente, plus I diminue.</Obs>
        </Panel>
      </div>
      <div className="space-y-4">
        <Panel title="Circuit & ampoule">
          <svg viewBox="0 0 260 160" className="mx-auto w-full max-w-xs">
            <rect x="20" y="20" width="220" height="120" rx="8" fill="none" stroke="#0a1a3b" strokeWidth="3" />
            {/* battery */}
            <line x1="20" y1="80" x2="20" y2="80" stroke="#0a1a3b" />
            <rect x="10" y="60" width="10" height="40" rx="2" fill="#0a1a3b" />
            <text x="6" y="115" fontSize="9">{u}V</text>
            {/* resistor */}
            <rect x="90" y="14" width="80" height="12" rx="3" fill="#f97316" />
            <text x="110" y="10" fontSize="9">R={r}Ω</text>
            {/* bulb */}
            <circle cx="240" cy="80" r="14" fill={`rgba(255,${Math.round(120 + 135 * brightness)},0,${0.3 + brightness * 0.7})`} stroke="#0a1a3b" />
            <circle cx="240" cy="80" r="20" fill={`rgba(255,200,0,${brightness * 0.25})`} />
            {/* moving electrons */}
            {[0, 1, 2, 3].map((k) => (
              <circle key={k} r="3" fill="#3b82f6">
                <animateMotion dur={`${Math.max(1, 4 / (i + 0.3))}s`} repeatCount="indefinite" path="M20,80 H240" begin={`${k * 0.5}s`} />
              </circle>
            ))}
          </svg>
          <p className="text-center text-xs text-night-800/60">L'ampoule brille selon l'intensité du courant.</p>
        </Panel>
        <Panel title="Caractéristique U = f(I)">
          <canvas id="ohm-graph" width={260} height={140} className="mx-auto w-full" />
        </Panel>
        <Quiz q="Si on double la résistance (en gardant U constant), l'intensité I…" choices={["Est divisée par 2", "Est doublée", "Ne change pas", "Devient nulle"]} answer={0} />
      </div>
    </div>
  );
}

/* ========================= CIRCUIT ========================= */
function CircuitSim() {
  const [mode, setMode] = useState<"series" | "parallel">("series");
  const [n, setN] = useState(2);
  const r = 10;
  const req = mode === "series" ? n * r : r / n;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Configuration">
        <div className="flex gap-2">
          {(["series", "parallel"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition ${mode === m ? "bg-turq text-white" : "bg-night-900/5 text-night-800"}`}>
              {m === "series" ? "En série" : "En parallèle"}
            </button>
          ))}
        </div>
        <Slider label="Nombre de résistances (R = 10 Ω chacune)" value={n} min={1} max={6} step={1} unit="" onChange={setN} />
        <div className="mt-4 text-center">
          <Metric label="R équivalente" value={`${req.toFixed(1)}`} unit="Ω" highlight big />
        </div>
        <Obs>
          {mode === "series"
            ? `En série, les résistances s'additionnent : Req = ${n} × 10 = ${req} Ω.`
            : `En parallèle, 1/Req = 1/R₁ + ... → Req = 10 / ${n} = ${req.toFixed(1)} Ω.`}
        </Obs>
      </Panel>
      <Panel title="Schéma">
        <svg viewBox="0 0 260 160" className="mx-auto w-full max-w-sm">
          <rect x="15" y="15" width="230" height="130" rx="6" fill="none" stroke="#0a1a3b" strokeWidth="3" />
          {mode === "series" ? (
            <>
              {Array.from({ length: n }).map((_, k) => (
                <g key={k}>
                  <rect x={40 + k * (180 / n)} y="9" width={180 / n - 10} height="12" rx="3" fill="#f97316" />
                  <text x={45 + k * (180 / n)} y="6" fontSize="8">R{k + 1}</text>
                </g>
              ))}
            </>
          ) : (
            <>
              {Array.from({ length: n }).map((_, k) => {
                const x = 60 + k * 30;
                return (
                  <g key={k}>
                    <line x1={x} y1="15" x2={x} y2="60" stroke="#0a1a3b" strokeWidth="2" />
                    <rect x={x - 14} y="60" width="28" height="12" rx="3" fill="#f97316" />
                    <line x1={x} y1="72" x2={x} y2="145" stroke="#0a1a3b" strokeWidth="2" />
                  </g>
                );
              })}
              <line x1="60" y1="15" x2={60 + (n - 1) * 30} y2="15" stroke="#0a1a3b" strokeWidth="2" />
            </>
          )}
        </svg>
        <Quiz q="Deux résistances de 10 Ω en parallèle donnent :" choices={["20 Ω", "5 Ω", "10 Ω", "0 Ω"]} answer={1} />
      </Panel>
    </div>
  );
}

/* ========================= FORCE ========================= */
function ForceSim() {
  const [f, setF] = useState(20);
  const [m, setM] = useState(5);
  const a = f / m;
  const tRef = useRef(0);
  const [pos, setPos] = useState(0);
  useEffect(() => {
    let raf = 0; let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      tRef.current += dt;
      setPos((p) => {
        const np = (p + a * dt * 8) % 80;
        return np;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [a]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Paramètres (F = m·a)">
        <Slider label="Force F" value={f} min={1} max={60} step={1} unit=" N" onChange={setF} />
        <div className="mt-3" />
        <Slider label="Masse m" value={m} min={1} max={20} step={1} unit=" kg" onChange={setM} />
        <div className="mt-4 text-center">
          <Metric label="Accélération a = F/m" value={a.toFixed(2)} unit="m/s²" highlight big />
        </div>
        <Obs>Pour une même force, plus la masse est grande, plus l'accélération est faible.</Obs>
      </Panel>
      <Panel title="Mouvement du bloc">
        <div className="relative h-40 overflow-hidden rounded-xl bg-night-950">
          <div className="absolute bottom-0 h-3 w-full bg-night-700" />
          <div className="absolute bottom-3 transition-none" style={{ left: `${pos}%` }}>
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-gradient-to-br from-amber-edu to-amber-edu-light text-white shadow-lg">
              {m}kg
            </div>
          </div>
          <div className="absolute left-2 top-2 text-xs text-turq-light">v ∝ a (animation accélérée)</div>
        </div>
        <Quiz q="Si la masse double et la force reste constante, l'accélération…" choices={["Est divisée par 2", "Double", "Ne change pas", "Est multipliée par 4"]} answer={0} />
      </Panel>
    </div>
  );
}

/* ========================= FUNCTION PLOTTER ========================= */
function FunctionSim() {
  const [type, setType] = useState<"affine" | "carree" | "sin">("affine");
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  useEffect(() => {
    const cv = document.getElementById("fn-graph") as HTMLCanvasElement | null;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    // grid + axes
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath(); ctx.moveTo((i / 10) * W, 0); ctx.lineTo((i / 10) * W, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (i / 10) * H); ctx.lineTo(W, (i / 10) * H); ctx.stroke();
    }
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.lineTo(W, H / 2);
    ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    // curve
    ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    const fx = (x: number) => type === "affine" ? a * x + b : type === "carree" ? a * x * x + b * x + c : a * Math.sin(b * x + c);
    let first = true;
    for (let px = 0; px <= W; px++) {
      const x = (px / W) * 10 - 5;
      const y = fx(x);
      const py = H / 2 - (y / 10) * (H / 2);
      if (py < -50 || py > H + 50) { first = true; continue; }
      first ? (ctx.moveTo(px, py), first = false) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [type, a, b, c]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Type & paramètres">
        <div className="flex gap-2">
          {([["affine", "ax+b"], ["carree", "ax²+bx+c"], ["sin", "a·sin(bx+c)"]] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => setType(k)} className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${type === k ? "bg-turq text-white" : "bg-night-900/5 text-night-800"}`}>{lbl}</button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-5} max={5} step={0.5} onChange={setB} />
          {type !== "affine" && <Slider label="c" value={c} min={-5} max={5} step={0.5} onChange={setC} />}
        </div>
        <p className="mt-3 text-center formula text-turq">
          {type === "affine" ? `f(x) = ${a}x + ${b}` : type === "carree" ? `f(x) = ${a}x² + ${b}x + ${c}` : `f(x) = ${a}·sin(${b}x + ${c})`}
        </p>
      </Panel>
      <Panel title="Représentation graphique">
        <canvas id="fn-graph" width={300} height={220} className="mx-auto w-full" />
        <Quiz q="Une fonction affine avec a < 0 est représentée par une droite…" choices={["Décroissante", "Croissante", "Horizontale", "Verticale"]} answer={0} />
      </Panel>
    </div>
  );
}

/* ========================= STATISTICS ========================= */
function StatsSim() {
  const [raw, setRaw] = useState("8; 12; 7; 15; 10; 9; 12; 6");
  const data = raw.split(/[;,]/).map((s) => Number(s.trim())).filter((n) => !isNaN(n));
  const n = data.length;
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = n ? sum / n : 0;
  const sorted = [...data].sort((a, b) => a - b);
  const median = n ? (n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2) : 0;
  const variance = n ? data.reduce((a, b) => a + (b - mean) ** 2, 0) / n : 0;
  const std = Math.sqrt(variance);
  useEffect(() => {
    const cv = document.getElementById("stats-graph") as HTMLCanvasElement | null;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    if (!n) return;
    const max = Math.max(...data, 1);
    const bw = (W - 20) / n;
    data.forEach((d, i) => {
      const h = (d / max) * (H - 30);
      ctx.fillStyle = ["#14b8a6", "#3b82f6", "#7c5cfc", "#10b981", "#f97316"][i % 5];
      ctx.fillRect(10 + i * bw, H - 20 - h, bw - 4, h);
    });
    ctx.fillStyle = "#64748b"; ctx.font = "10px sans-serif";
    data.forEach((d, i) => ctx.fillText(String(d), 10 + i * bw + 2, H - 6));
  }, [raw]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Série de valeurs (séparées par ; )">
        <textarea
          value={raw} onChange={(e) => setRaw(e.target.value)} rows={3}
          className="w-full rounded-xl border border-night-900/15 p-3 text-sm outline-none focus:border-sky-edu"
        />
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <Metric label="Moyenne" value={mean.toFixed(1)} highlight />
          <Metric label="Médiane" value={median.toFixed(1)} highlight />
          <Metric label="Écart-type" value={std.toFixed(2)} />
          <Metric label="Effectif" value={`${n}`} />
        </div>
        <Obs>La moyenne résume la série ; l'écart-type mesure la dispersion autour de cette moyenne.</Obs>
      </Panel>
      <Panel title="Histogramme">
        <canvas id="stats-graph" width={300} height={220} className="mx-auto w-full" />
        <Quiz q="La médiane d'une série est…" choices={["La valeur du milieu quand la série est triée", "Toujours égale à la moyenne", "La plus grande valeur", "Le nombre de valeurs"]} answer={0} />
      </Panel>
    </div>
  );
}

/* ========================= pH ========================= */
function PhSim() {
  const [conc, setConc] = useState(2); // initial concentration index (10^-conc)
  const [dilution, setDilution] = useState(1); // factor
  const finalConc = (10 ** -conc) / dilution;
  const pH = Math.min(14, Math.max(0, -Math.log10(finalConc)));
  const hue = pH * 14; // 0 red → 14 blue/green
  const color = pH < 7 ? `hsl(${10 + pH * 5}, 85%, 55%)` : pH > 7 ? `hsl(${190 + (14 - pH) * 8}, 70%, 50%)` : "#22c55e";
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Solution acide (H⁺)">
        <Slider label="Concentration initiale [H⁺]" value={conc} min={1} max={6} step={1} unit={` (10⁻${conc} mol/L)`} onChange={setConc} />
        <div className="mt-3" />
        <Slider label="Facteur de dilution" value={dilution} min={1} max={100} step={1} unit="×" onChange={setDilution} />
        <div className="mt-4 text-center">
          <Metric label="pH final" value={pH.toFixed(2)} unit="" highlight big />
        </div>
        <Obs>En diluant, on rapproche le pH de 7 (neutre). pH = -log([H⁺]).</Obs>
      </Panel>
      <Panel title="Bécher & indicateur">
        <div className="flex flex-col items-center">
          <div className="relative h-40 w-28">
            <div className="absolute inset-x-0 bottom-0 h-32 rounded-b-2xl rounded-t-lg border-2 border-night-900/30 transition-colors" style={{ backgroundColor: color }} />
            <div className="absolute inset-x-2 top-2 text-center text-xs font-bold text-white/90">{pH < 7 ? "ACIDE" : pH > 7 ? "BASIQUE" : "NEUTRE"}</div>
          </div>
          <div className="mt-3 flex w-full max-w-xs justify-between text-[10px] text-night-800/60">
            <span>0 acide</span><span>7 neutre</span><span>14 basique</span>
          </div>
          <div className="mt-1 h-3 w-full max-w-xs rounded-full" style={{ background: "linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#06b6d4,#3b82f6)" }} />
        </div>
        <Quiz q="Une solution acide diluée tend vers un pH de :" choices={["7", "0", "14", "1"]} answer={0} />
      </Panel>
    </div>
  );
}

/* ========================= RESPIRATION ========================= */
function RespirationSim() {
  const [inspire, setInspire] = useState(true);
  const o2 = inspire ? 21 : 16;
  const co2 = inspire ? 0.04 : 4;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Contrôle de la respiration">
        <div className="flex gap-2">
          <button onClick={() => setInspire(true)} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${inspire ? "bg-turq text-white" : "bg-night-900/5 text-night-800"}`}>Inspiration</button>
          <button onClick={() => setInspire(false)} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${!inspire ? "bg-amber-edu text-white" : "bg-night-900/5 text-night-800"}`}>Expiration</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <Metric label="O₂" value={`${o2}`} unit="%" highlight />
          <Metric label="CO₂" value={`${co2}`} unit="%" highlight />
        </div>
        <Obs>{inspire ? "À l'inspiration, l'air riche en O₂ entre dans les alvéoles puis dans le sang." : "À l'expiration, l'air chargé en CO₂ (déchet) quitte les poumons."}</Obs>
      </Panel>
      <Panel title="Échanges alvéolaires">
        <svg viewBox="0 0 260 170" className="mx-auto w-full max-w-sm">
          {/* lungs */}
          <ellipse cx="100" cy="70" rx="38" ry={inspire ? 52 : 40} fill="#fbcfe8" stroke="#db2777" strokeWidth="2" />
          <ellipse cx="170" cy="70" rx="38" ry={inspire ? 52 : 40} fill="#fbcfe8" stroke="#db2777" strokeWidth="2" />
          <line x1="135" y1="20" x2="135" y2="60" stroke="#9ca3af" strokeWidth="4" />
          {/* gas flow arrows */}
          {inspire ? (
            <>
              <circle cx="135" cy="10" r="6" fill="#3b82f6" />
              <line x1="135" y1="16" x2="135" y2="40" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arr)" />
              <text x="145" y="20" fontSize="9" fill="#3b82f6">O₂ →</text>
            </>
          ) : (
            <>
              <circle cx="135" cy="60" r="6" fill="#f97316" />
              <line x1="135" y1="44" x2="135" y2="16" stroke="#f97316" strokeWidth="3" markerEnd="url(#arr2)" />
              <text x="145" y="20" fontSize="9" fill="#f97316">CO₂ →</text>
            </>
          )}
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6" /></marker>
            <marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f97316" /></marker>
          </defs>
          <text x="90" y="150" fontSize="9" fill="#64748b">Alvéoles pulmonaires</text>
        </svg>
        <Quiz q="Lors de l'expiration, le gaz rejeté est surtout :" choices={["Le CO₂", "L'O₂", "L'azote pur", "L'hydrogène"]} answer={0} />
      </Panel>
    </div>
  );
}

/* ========================= GENETICS ========================= */
function GeneticsSim() {
  const alleles = ["AA", "Aa", "aa"];
  const [p1, setP1] = useState("Aa");
  const [p2, setP2] = useState("Aa");
  const a1 = p1.split("");
  const a2 = p2.split("");
  const grid = [
    a1[0] + a2[0], a1[0] + a2[1],
    a1[1] + a2[0], a1[1] + a2[1],
  ].map((g) => g.split("").sort().join(""));
  const domCount = grid.filter((g) => g.includes("A")).length;
  const recCount = grid.filter((g) => g === "aa").length;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Génotypes parentaux">
        <div className="space-y-3">
          <div>
            <span className="text-sm text-night-800">Parent 1 (dominant A / récessif a)</span>
            <div className="mt-1.5 flex gap-2">
              {alleles.map((g) => (
                <button key={g} onClick={() => setP1(g)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${p1 === g ? "bg-violet-edu text-white" : "bg-night-900/5 text-night-800"}`}>{g}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm text-night-800">Parent 2</span>
            <div className="mt-1.5 flex gap-2">
              {alleles.map((g) => (
                <button key={g} onClick={() => setP2(g)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${p2 === g ? "bg-violet-edu text-white" : "bg-night-900/5 text-night-800"}`}>{g}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <Metric label="Phénotype dominant" value={`${(domCount / 4) * 100}`} unit="%" highlight />
          <Metric label="Phénotype récessif" value={`${(recCount / 4) * 100}`} unit="%" />
        </div>
        <Obs>Croisement {p1} × {p2} → {domCount}/4 dominant, {recCount}/4 récessif.</Obs>
      </Panel>
      <Panel title="Échiquier de Punnett">
        <table className="mx-auto border-collapse text-center">
          <thead>
            <tr><th></th><th className="px-4 py-2 text-violet-edu">{a2[0]}</th><th className="px-4 py-2 text-violet-edu">{a2[1]}</th></tr>
          </thead>
          <tbody>
            <tr><td className="px-4 py-2 font-bold text-violet-edu">{a1[0]}</td>
              {grid.slice(0, 2).map((g, i) => (<td key={i} className={`border border-night-900/10 px-6 py-4 font-bold ${g.includes("A") ? "bg-leaf/10 text-leaf" : "bg-amber-edu/10 text-amber-edu"}`}>{g}</td>))}
            </tr>
            <tr><td className="px-4 py-2 font-bold text-violet-edu">{a1[1]}</td>
              {grid.slice(2, 4).map((g, i) => (<td key={i} className={`border border-night-900/10 px-6 py-4 font-bold ${g.includes("A") ? "bg-leaf/10 text-leaf" : "bg-amber-edu/10 text-amber-edu"}`}>{g}</td>))}
            </tr>
          </tbody>
        </table>
        <Quiz q="Dans Aa × Aa, quel pourcentage a le phénotype dominant ?" choices={["75%", "25%", "50%", "100%"]} answer={0} />
      </Panel>
    </div>
  );
}

function Metric({ label, value, unit, highlight, big }: { label: string; value: string; unit?: string; highlight?: boolean; big?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-gradient-to-br from-turq/15 to-sky-edu/10" : "bg-night-900/5"}`}>
      <p className="text-[11px] uppercase tracking-wide text-night-800/60">{label}</p>
      <p className={`font-bold text-night-900 ${big ? "text-2xl" : "text-lg"}`}>{value}<span className="text-sm font-normal text-night-800/60">{unit}</span></p>
    </div>
  );
}

// Paillasse 3D chargée à la demande : three.js ne doit peser que sur la page du TP.
const TitrationLab3D = dynamic(() => import("@/components/lab/TitrationLab3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-72 place-items-center rounded-3xl border border-night-900/10 bg-white text-sm text-night-800/60">
      Préparation de la paillasse 3D…
    </div>
  ),
});

export const SIMULATIONS: Record<string, () => ReactNode> = {
  ohm: OhmSim, circuit: CircuitSim, force: ForceSim, function: FunctionSim,
  stats: StatsSim, ph: PhSim, respiration: RespirationSim, genetics: GeneticsSim,
  titration: () => <TitrationLab3D />,
};



import Link from "next/link";
import { ArrowRight,BookOpen,CheckCircle2,Clock3,Flame,Play,Send,TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getProgressWithCourses,getRecentAttempts } from "@/lib/queries";
import { COURSES } from "@/lib/content";
import { RobotTeacher } from "@/components/RobotTeacher";
import { Badge,ProgressBar } from "@/components/ui";
export const dynamic="force-dynamic";

export default async function DashboardPage(){
 const user=await getCurrentUser();if(!user)return null;
 const rows=await getProgressWithCourses(user.id);const allAttempts=await getRecentAttempts(user.id,60);const attempts=allAttempts.slice(0,5);
 const mastered=rows.filter(x=>(x.progress.mastery??0)>=.8).length;
 const overall=rows.length?rows.reduce((n,x)=>n+(x.progress.mastery??0),0)/rows.length:0;
 const active=rows.filter(x=>x.progress.status==="in_progress");
 const cards=(active.length?active.map(x=>x.course):COURSES).slice(0,4);
 const first=user.name.split(" ")[0];
 // Répartition réelle par matière : part des cours suivis (base de données, pas de valeurs fixes)
 const SUBJECT_COLORS:[string,string][]=[["Mathématiques","#175c44"],["Physique-Chimie","#d97836"],["SVT","#91a94e"]];
 const subjectCounts=SUBJECT_COLORS.map(([name])=>rows.filter(x=>x.course.subject===name).length);
 const subjectTotal=subjectCounts.reduce((a,b)=>a+b,0);
 let acc=0;
 const donutSegments=subjectTotal?SUBJECT_COLORS.map(([,color],i)=>{const from=acc/subjectTotal*100;acc+=subjectCounts[i];return `${color} ${from}% ${acc/subjectTotal*100}%`;}).join(","):"";
 // Progression réelle des 7 derniers jours : tentatives par jour depuis la base
 const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d;});
 const dayCounts=days.map((d,i)=>{const end=new Date(d);end.setDate(end.getDate()+1);return allAttempts.filter(a=>{const t=a.createdAt?new Date(a.createdAt):null;return t&&t>=d&&t<end;}).length;});
 const dayLabels=["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
 return <div className="space-y-7">
  <div><p className="text-sm text-night-800/45">Prêt à apprendre aujourd’hui ?</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-night-900">Bonjour, {first} !</h1></div>
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
   <div className="space-y-6">
    <section><p className="mb-3 text-sm font-bold text-night-900">Vue d’ensemble</p><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Cours suivis" value={`${rows.length}`} note="Bibliothèque personnalisée" icon={BookOpen}/><Metric label="Activités" value={`${attempts.length}`} note="Dernières tentatives" icon={CheckCircle2}/><Metric label="Score moyen" value={`${Math.round(overall*100)}%`} note="Progression globale" icon={TrendingUp}/><Metric label="Notions maîtrisées" value={`${mastered}`} note="Continue comme ça" icon={Flame}/></div></section>
    <section className="grid gap-4 lg:grid-cols-[1.35fr_.9fr]"><div className="rounded-3xl border border-night-900/8 bg-white p-5 shadow-[0_10px_35px_rgba(26,61,47,.04)]"><div className="flex items-center justify-between"><div><p className="font-bold text-night-900">Progression</p><p className="text-xs text-night-800/45">Les sept derniers jours</p></div><span className="rounded-xl border border-night-900/10 px-3 py-1.5 text-xs">Cette semaine</span></div><ProgressChart counts={dayCounts} labels={days.map(d=>dayLabels[d.getDay()])}/></div><div className="rounded-3xl border border-night-900/8 bg-white p-5 shadow-[0_10px_35px_rgba(26,61,47,.04)]"><p className="font-bold text-night-900">Répartition par matière</p>{subjectTotal?<div className="mt-5 flex items-center gap-5"><div className="h-28 w-28 shrink-0 rounded-full" style={{background:`conic-gradient(${donutSegments})`}}><div className="m-[18px] h-[76px] rounded-full bg-white"/></div><div className="space-y-3 text-xs">{SUBJECT_COLORS.map(([name,color],i)=><Legend key={name} color={color} label={name} value={`${Math.round(subjectCounts[i]/subjectTotal*100)}%`}/>)}</div></div>:<div className="mt-5 rounded-2xl bg-[#f5f6f1] p-4 text-xs text-night-800/55">Commence un cours pour voir ta répartition par matière.</div>}</div></section>
    <section><div className="mb-3 flex items-center justify-between"><p className="font-bold text-night-900">Reprendre un cours</p><Link href="/app/cours" className="text-xs font-semibold text-[#175c44]">Voir la bibliothèque</Link></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((course)=>{const mastery=rows.find(x=>x.course.key===course.key)?.progress.mastery;return <Link key={course.key} href={`/app/cours/${course.key}`} className="group overflow-hidden rounded-2xl border border-night-900/8 bg-white shadow-[0_8px_28px_rgba(26,61,47,.04)] transition hover:-translate-y-1 hover:shadow-lg"><div className={`relative h-28 ${course.subject.includes('Math')?'bg-[#173f35]':course.subject.includes('Phys')?'bg-[#3f3128]':'bg-[#284437]'}`}><div className="absolute inset-0 opacity-40" style={{backgroundImage:"radial-gradient(circle at 20% 30%,rgba(255,255,255,.22),transparent 25%),linear-gradient(130deg,transparent 40%,rgba(255,255,255,.12))"}}/><span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#175c44]"><Play className="h-4 w-4 fill-current"/></span></div><div className="p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-night-800/40">{course.subject}</p><h3 className="mt-1 line-clamp-1 text-sm font-bold text-night-900">{course.title}</h3>{mastery!=null?<><p className="mt-2 text-xs text-night-800/45">{Math.round(mastery*100)}% terminé</p><ProgressBar value={mastery} color="leaf" className="mt-2"/></>:<p className="mt-2 text-xs font-semibold text-[#57936f]">Nouveau — commence quand tu veux</p>}</div></Link>})}</div></section>
   </div>
   <aside className="space-y-4"><section className="rounded-[2rem] border border-[#d9e2d9] bg-[#f9f8f2] p-5 shadow-[0_15px_40px_rgba(26,61,47,.06)]"><div className="mx-auto w-fit rounded-[1.75rem] bg-[#e9eee6] px-5 pt-2"><RobotTeacher state="salutation" size={155}/></div><h2 className="mt-3 text-lg font-bold text-[#174c3a]">Votre tuteur IA</h2><p className="mt-1 text-sm leading-6 text-night-800/60">Je suis là pour vous aider. Que voulez-vous apprendre aujourd’hui ?</p><div className="mt-4 space-y-2">{["Expliquer un concept","Aide aux devoirs","Quiz personnalisé"].map(x=><Link key={x} href={`/app/ia`} className="flex items-center justify-between rounded-xl border border-night-900/8 bg-white px-3 py-2.5 text-xs font-semibold text-night-800/75 shadow-sm">{x}<ArrowRight className="h-3.5 w-3.5"/></Link>)}</div><Link href="/app/ia" className="mt-3 flex items-center gap-2 rounded-xl border border-night-900/8 bg-white p-2 pl-3 text-xs text-night-800/40"><span className="flex-1">Posez votre question…</span><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#175c44] text-white"><Send className="h-3.5 w-3.5"/></span></Link></section>
    <section className="rounded-3xl border border-night-900/8 bg-white p-5"><p className="font-bold text-night-900">Activité récente</p><div className="mt-4 space-y-4">{attempts.length?attempts.map((a,i)=><div key={a.id} className="flex gap-3"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${a.correct?'bg-[#e3f2e6] text-[#2d8059]':'bg-[#fff0db] text-[#d97836]'}`}>{a.correct?<CheckCircle2 className="h-4 w-4"/>:<Clock3 className="h-4 w-4"/>}</span><div><p className="text-xs font-semibold text-night-900">{a.scope==='exam'?'Examen réalisé':'Exercice travaillé'}</p><p className="text-[11px] text-night-800/45">{a.subject||'Activité pédagogique'}</p></div></div>):<div className="rounded-2xl bg-[#f5f6f1] p-4 text-xs text-night-800/55">Commence un cours pour voir ton activité ici.</div>}</div></section>
   </aside>
  </div>
 </div>
}
function Metric({label,value,note,icon:Icon}:{label:string;value:string;note:string;icon:React.ComponentType<{className?:string}>}){return <div className="rounded-2xl border border-night-900/8 bg-white p-4 shadow-[0_8px_25px_rgba(26,61,47,.035)]"><div className="flex items-center justify-between"><p className="text-xs text-night-800/50">{label}</p><Icon className="h-4 w-4 text-[#2f7a5c]"/></div><p className="mt-3 text-2xl font-semibold text-night-900">{value}</p><p className="mt-1 text-[10px] text-[#57936f]">{note}</p></div>}
function Legend({color,label,value}:{color:string;label:string;value:string}){return <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{background:color}}/><span className="flex-1 text-night-800/65">{label}</span><span className="font-semibold text-night-900">{value}</span></div>}
/** Courbe réelle : nombre d'activités par jour sur les 7 derniers jours (base de données). */
function ProgressChart({counts,labels}:{counts:number[];labels:string[]}){
 const max=Math.max(1,...counts);
 const pts=counts.map((c,i)=>({x:35+i*(540/6),y:170-(c/max)*135}));
 const line=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
 const hasData=counts.some(c=>c>0);
 return <svg viewBox="0 0 600 190" className="mt-4 w-full" role="img" aria-label="Activités des 7 derniers jours">
  <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4d9874" stopOpacity=".35"/><stop offset="1" stopColor="#4d9874" stopOpacity="0"/></linearGradient></defs>
  {[35,80,125,170].map(y=><line key={y} x1="35" y1={y} x2="575" y2={y} stroke="#e9ece6"/>)}
  {hasData?<>
   <path d={`${line} L575 170 L35 170Z`} fill="url(#area)"/>
   <path d={line} fill="none" stroke="#2f7658" strokeWidth="3" strokeLinecap="round"/>
   {pts.map((p,i)=>counts[i]>0&&<circle key={i} cx={p.x} cy={p.y} r="4" fill="#2f7658"/>)}
  </>:<text x="305" y="105" textAnchor="middle" fontSize="12" fill="#708078">Aucune activité cette semaine — lance un exercice ou un examen blanc.</text>}
  {labels.map((d,i)=><text key={i} x={35+i*(540/6)} y="188" textAnchor="middle" fontSize="11" fill="#708078">{d}</text>)}
 </svg>;
}

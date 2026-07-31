"use client";
import { useState,type ReactNode,type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard,BookOpen,FlaskConical,PencilRuler,GraduationCap,LineChart,User,Atom,Menu,X,LogOut,ChevronRight,Bot } from "lucide-react";
import { logoutAction } from "@/app/actions";

type NavItem={href:string;label:string;icon:ComponentType<{className?:string}>};
const STUDENT_NAV:NavItem[]=[
 {href:"/app",label:"Accueil",icon:LayoutDashboard},{href:"/app/cours",label:"Cours",icon:BookOpen},
 {href:"/app/labo",label:"Laboratoire",icon:FlaskConical},{href:"/app/aide",label:"Aide aux devoirs",icon:PencilRuler},
 {href:"/app/ia",label:"Professeur IA",icon:Bot},{href:"/app/examens",label:"Examens",icon:GraduationCap},
 {href:"/app/suivi",label:"Résultats",icon:LineChart},{href:"/app/profil",label:"Profil",icon:User},
];
export function AppShell({user,nav,children}:{user:{name:string;email:string;role:string};nav:NavItem[];accent?:string;children:ReactNode}){
 const [open,setOpen]=useState(false);const pathname=usePathname();
 const current=nav.find(item=>pathname===item.href||(item.href!=="/app"&&pathname.startsWith(item.href)))||nav[0];
 return <div className="min-h-screen bg-[#f7f5ef]">
  <aside className={`fixed inset-y-0 left-0 z-50 w-[17rem] transform border-r border-[#dfe5dc] bg-[#fbfaf5] text-night-900 transition-transform duration-300 lg:translate-x-0 ${open?"translate-x-0":"-translate-x-full"}`}>
   <div className="flex h-full flex-col"><div className="flex items-center justify-between px-6 py-6"><Link href="/app" className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#175c44] text-white shadow-sm"><Atom className="h-5 w-5"/></span><span className="text-lg font-bold tracking-tight">EduLab<span className="text-[#267457]"> AI</span></span></Link><button aria-label="Fermer le menu" onClick={()=>setOpen(false)} className="lg:hidden"><X className="h-5 w-5"/></button></div>
   <p className="px-6 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.2em] text-night-800/35">Navigation</p>
   <nav className="flex-1 space-y-1 px-3 py-2">{nav.map(item=>{const active=pathname===item.href||(item.href!=="/app"&&pathname.startsWith(item.href));const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${active?"bg-[#175c44] text-white shadow-[0_8px_22px_rgba(23,92,68,.18)]":"text-night-800/70 hover:bg-[#edf3ed] hover:text-night-900"}`}><Icon className="h-[18px] w-[18px] shrink-0"/><span className="flex-1">{item.label}</span>{active&&<ChevronRight className="h-4 w-4"/>}</Link>})}</nav>
   <div className="border-t border-[#dfe5dc] p-4"><div className="flex items-center gap-3 rounded-2xl border border-[#dfe5dc] bg-white p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#dceadf] font-bold text-[#175c44]">{user.name.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-night-800/45">{user.email}</p></div></div><form action={logoutAction}><button type="submit" className="mt-2 flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-night-800/55 transition hover:bg-red-500/10 hover:text-red-600"><LogOut className="h-4 w-4"/>Déconnexion</button></form></div></div>
  </aside>
  {open&&<div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={()=>setOpen(false)}/>}
  <div className="lg:pl-[17rem]"><header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#e2e6df] bg-[#f7f5ef]/90 px-5 py-3.5 backdrop-blur lg:hidden"><button aria-label="Ouvrir le menu" onClick={()=>setOpen(true)}><Menu className="h-6 w-6"/></button><span className="flex items-center gap-2 font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#175c44] text-white"><Atom className="h-4 w-4"/></span>EduLab <span className="text-[#267457]">AI</span></span></header>
   <header className="hidden h-[4.75rem] items-center justify-between border-b border-[#e2e6df] bg-[#f7f5ef]/90 px-8 backdrop-blur lg:flex"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#175c44]/65">Espace pédagogique</p><p className="mt-0.5 text-lg font-semibold text-night-900">{current?.label||"EduLab AI"}</p></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-semibold text-night-900">{user.name}</p><p className="text-xs text-night-800/45">{user.role==="student"?"Apprenant":user.role==="teacher"?"Enseignant":"Administrateur"}</p></div><span className="grid h-10 w-10 place-items-center rounded-full bg-[#175c44] text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span></div></header>
   <main className="min-h-[calc(100vh-4.75rem)]"><div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:py-8">{children}</div></main>
  </div>
 </div>
}
export {STUDENT_NAV};

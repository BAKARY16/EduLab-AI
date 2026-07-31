import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { getPublicCourseResources, type CourseResource } from "@/server/courseResources";
import { COURSES, type CourseStep } from "@/lib/content";

export type PedagogicalSection={id:string;kind:"situation"|"objective"|"prerequisite"|"explanation"|"rule"|"example"|"exercise"|"correction"|"summary";title:string;content:string;choices?:string[];correct_index?:number};
export type PedagogicalPlan={title:string;objective:string;sections:PedagogicalSection[];sources:string[];validation_status:string};
export type CatalogLesson={id:string;title:string;chapter:string;class_name:string;series:string|null;subject:string;source_ids:string[];official_status:string;validation_status:string;available:boolean;resources?:CourseResource[];pedagogical_plan?:PedagogicalPlan};
export type CatalogChapter={id:string;title:string;lessons:CatalogLesson[]};
export type CatalogSubject={id:string;title:string;folder_url:string|null;source_status:string;chapters:CatalogChapter[]};
export type CatalogLevel={id:string;title:string;exam:string;subjects:CatalogSubject[]};
export type CourseTree={version:string;scope:string;source_policy:string;levels:CatalogLevel[]};

type DatasetRow={task?:string;class_name?:string;subject?:string;lesson?:string;response?:string;source_ids?:string[];validation_status?:string};
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const key=(className:string,subject:string,lesson:string)=>`${normalize(className)}|${normalize(subject)}|${normalize(lesson)}`;

function curatedSection(step:CourseStep,index:number):PedagogicalSection|null{
 if(step.kind==="intro") return {id:`situation-${index}`,kind:"situation",title:step.title || "Situation de départ",content:step.body};
 if(step.kind==="explain") return {id:`explanation-${index}`,kind:"explanation",title:"Explication progressive",content:step.body};
 if(step.kind==="formula") return {id:`rule-${index}`,kind:"rule",title:"Propriété et formule",content:step.body};
 if(step.kind==="example") return {id:`example-${index}`,kind:"example",title:"Exemple guidé",content:step.body};
 if(step.kind==="question") return {id:`exercise-${index}`,kind:"exercise",title:"Vérification des acquis",content:step.q,choices:step.choices,correct_index:step.answer};
 if(step.kind==="encouragement") return {id:`summary-${index}`,kind:"summary",title:"Bilan de la leçon",content:step.body};
 return null;
}

function curatedPlan(title:string):PedagogicalPlan|undefined{
 const wanted=normalize(title);
 const course=COURSES.find(item=>[item.title,item.lesson].some(value=>normalize(value).includes(wanted)||wanted.includes(normalize(value))));
 if(!course) return undefined;
 const sections:PedagogicalSection[]=[
  {id:"objective",kind:"objective",title:"Objectif d’apprentissage",content:course.content.objective},
  {id:"prerequisite",kind:"prerequisite",title:"Prérequis",content:`Connaître le vocabulaire et les notions de base du chapitre « ${course.chapter} ».`},
 ];
 course.content.steps.forEach((step,index)=>{const section=curatedSection(step,index);if(section)sections.push(section);});
 sections.push({id:"key-formulas",kind:"summary",title:"Trace écrite à retenir",content:course.content.keyFormulas.join("\n")});
 return {title:course.title,objective:course.content.objective,sections,sources:course.content.sources,validation_status:"curated"};
}

function datasetPlan(lesson:CatalogLesson,row:DatasetRow):PedagogicalPlan|undefined{
 if(!row.response) return undefined;
 const mapping:Record<string,PedagogicalSection["kind"]>={objectifs:"objective",prerequis:"prerequisite",explication:"explanation","exemple guide":"example",exercice:"exercise",correction:"correction",resume:"summary"};
 const sections:PedagogicalSection[]=[];
 for(const [index,line] of row.response.split(/\r?\n/).entries()){
  const match=line.match(/^([^:]+):\s*(.+)$/); if(!match)continue;
  const label=normalize(match[1]); const kind=mapping[label]; if(!kind)continue;
  sections.push({id:`${kind}-${index}`,kind,title:match[1].trim(),content:match[2].trim()});
 }
 if(sections.length<4)return undefined;
 const objective=sections.find(section=>section.kind==="objective")?.content || `Comprendre et appliquer ${lesson.title}.`;
 return {title:lesson.title,objective,sections,sources:row.source_ids || lesson.source_ids,validation_status:row.validation_status || "pending_human_review"};
}

export async function getCourseTree():Promise<CourseTree>{
 const file=path.join(process.cwd(),"data","catalogs","course_tree.json");
 const tree=JSON.parse(await readFile(file,"utf8")) as CourseTree;
 const rows:DatasetRow[]=[];
 for(const split of ["train","validation","test"]){
  const datasetFile=path.join(process.cwd(),"data","processed",`edulab_teacher_${split}.jsonl`);
  try{for(const line of (await readFile(datasetFile,"utf8")).split(/\r?\n/)){if(line.trim())rows.push(JSON.parse(line) as DatasetRow);}}catch{}
 }
 const plans=new Map(rows.filter(row=>row.task==="course_plan"&&row.class_name&&row.subject&&row.lesson).map(row=>[key(row.class_name!,row.subject!,row.lesson!),row]));
 for(const level of tree.levels) for(const subject of level.subjects) for(const chapter of subject.chapters) for(const lesson of chapter.lessons){
  lesson.resources=getPublicCourseResources(lesson.source_ids);
  lesson.pedagogical_plan=curatedPlan(lesson.title) || datasetPlan(lesson,plans.get(key(lesson.class_name,lesson.subject,lesson.title)) || {});
 }
 return tree;
}

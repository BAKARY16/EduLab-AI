import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { getPublicCourseResources, type CourseResource } from "@/server/courseResources";

export type CatalogLesson={id:string;title:string;chapter:string;class_name:string;series:string|null;subject:string;source_ids:string[];official_status:string;validation_status:string;available:boolean;resources?:CourseResource[]};
export type CatalogChapter={id:string;title:string;lessons:CatalogLesson[]};
export type CatalogSubject={id:string;title:string;folder_url:string|null;source_status:string;chapters:CatalogChapter[]};
export type CatalogLevel={id:string;title:string;exam:string;subjects:CatalogSubject[]};
export type CourseTree={version:string;scope:string;source_policy:string;levels:CatalogLevel[]};

export async function getCourseTree():Promise<CourseTree>{
 const file=path.join(process.cwd(),"data","catalogs","course_tree.json");
 const tree=JSON.parse(await readFile(file,"utf8")) as CourseTree;
 for(const level of tree.levels) for(const subject of level.subjects) for(const chapter of subject.chapters) for(const lesson of chapter.lessons){
  lesson.resources=getPublicCourseResources(lesson.source_ids);
 }
 return tree;
}

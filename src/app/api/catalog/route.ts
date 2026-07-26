import { NextResponse } from "next/server";
import { getCourseTree } from "@/server/courseCatalog";
export async function GET(){return NextResponse.json(await getCourseTree(),{headers:{"cache-control":"public, max-age=300, stale-while-revalidate=3600"}})}


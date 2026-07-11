import { NextResponse } from "next/server";
import { confirmConcept } from "@/server/memoryStore";

export async function POST(req: Request) {
  let body: { concept?: string; understanding?: string; from_paper?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.concept) {
    return NextResponse.json({ error: "concept is required" }, { status: 400 });
  }
  const learner = confirmConcept(
    body.concept,
    body.understanding ?? "",
    body.from_paper ?? "unknown"
  );
  return NextResponse.json({ ok: true, concept: learner.concepts[body.concept] });
}

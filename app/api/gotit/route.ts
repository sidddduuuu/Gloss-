import { NextResponse } from "next/server";
import { confirmConcept } from "@/server/memoryStore";
import { addMemory, flush } from "@/server/everos";

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
  const conceptLabel = body.concept.replace(/_/g, " ");
  const learner = confirmConcept(
    body.concept,
    body.understanding ?? "",
    body.from_paper ?? "unknown"
  );

  // Write the confirmed understanding to EverOS as real memory (fire-and-forget).
  addMemory(
    `I now understand ${conceptLabel}${
      body.understanding ? `: ${body.understanding}` : ""
    }. I confirmed this while reading ${body.from_paper ?? "a paper"}.`,
    { sessionId: "gloss" }
  ).then((ok) => ok && flush("gloss"));

  return NextResponse.json({ ok: true, concept: learner.concepts[body.concept] });
}

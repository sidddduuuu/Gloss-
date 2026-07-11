import { NextResponse } from "next/server";
import { downgradeConcept } from "@/server/memoryStore";

export async function POST(req: Request) {
  let body: { concept?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const concept = body.concept ?? "reward_signal";
  const learner = downgradeConcept(concept);
  return NextResponse.json({ ok: true, concept: learner.concepts[concept] ?? null });
}

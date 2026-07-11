import { NextResponse } from "next/server";
import type { ExplainRequest } from "@/lib/contract";
import { explain } from "@/server/agent";

export async function POST(req: Request) {
  let body: Partial<ExplainRequest>;
  try {
    body = (await req.json()) as Partial<ExplainRequest>;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.learner_id !== "string" ||
    typeof body.paper_id !== "string" ||
    typeof body.selection !== "string" ||
    body.selection.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "learner_id, paper_id and a non-empty selection are required" },
      { status: 400 }
    );
  }

  const response = await explain({
    learner_id: body.learner_id,
    paper_id: body.paper_id,
    selection: body.selection.trim(),
    context: typeof body.context === "string" ? body.context : "",
    mode: "explain",
  });
  return NextResponse.json(response);
}

import { NextResponse } from "next/server";
import { readLearner, resetLearner } from "@/server/memoryStore";

export async function GET() {
  return NextResponse.json(readLearner());
}

// Reset to the seeded baseline — demo rehearsal helper.
export async function DELETE() {
  return NextResponse.json(resetLearner());
}

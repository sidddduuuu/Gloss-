import { NextResponse } from "next/server";
import { readLearner, resetLearner } from "@/server/memoryStore";
import { everosEnabled, getMemories } from "@/server/everos";

export async function GET() {
  const learner = readLearner();
  // Pull real records from EverOS for the Memory Reveal panel.
  const [episodes, profiles] = everosEnabled()
    ? await Promise.all([getMemories("episodic_memory", 20), getMemories("profile", 5)])
    : [[], []];
  return NextResponse.json({
    ...learner,
    everos: { enabled: everosEnabled(), episodes, profiles },
  });
}

// Reset local structured state to the seeded baseline — demo rehearsal helper.
export async function DELETE() {
  return NextResponse.json(resetLearner());
}

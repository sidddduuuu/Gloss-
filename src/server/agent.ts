// The /explain agent: retrieve → ground → personalize → respond.
// Real path calls the Butterbase AI gateway with retrieved EverOS-style memory;
// any failure or missing config falls back to the deterministic mock.

import type { ExplainRequest, ExplainResponse } from "@/lib/contract";
import { buildMockExplain } from "@/server/mockExplain";
import { readLearner, type LearnerRecord } from "@/server/memoryStore";
import { callGateway, gatewayConfigured } from "@/server/gateway";

function buildSystemPrompt(learner: LearnerRecord): string {
  const confirmed = Object.entries(learner.concepts)
    .filter(([, c]) => c.status === "confirmed")
    .map(([id, c]) => `- ${id} (from "${c.from_paper}"): ${c.understanding}`)
    .join("\n");

  return [
    "You are Gloss, a reading tutor. You explain the learner's selected passage.",
    "",
    "TRUST RULES (absolute):",
    "- The passage supplies WHAT you explain. Never invent facts, numbers, or citations.",
    "- If the passage doesn't support a claim, hedge explicitly ('the passage doesn't say').",
    "- Retrieved memory shapes only HOW you explain: the level, the style, and which known concepts to build on.",
    "",
    `LEARNER STYLE: ${learner.style.length}, ${learner.style.approach}. Struggles: ${learner.style.struggles.join(", ")}.`,
    "",
    confirmed
      ? `CONFIRMED CONCEPTS (build on these when relevant, and say so):\n${confirmed}`
      : "No confirmed concepts yet — explain cold, in the learner's style.",
    "",
    "Respond with ONLY a JSON object with keys: explanation (string), grounded (boolean),",
    'built_on (array of {concept, from_paper}), resume_note (string or null),',
    'new_concept ({concept, understanding, status:"pending"} or null).',
  ].join("\n");
}

function buildUserPrompt(req: ExplainRequest): string {
  return [
    `SELECTION: "${req.selection}"`,
    "",
    "SURROUNDING PASSAGE:",
    req.context || "(no additional context captured)",
  ].join("\n");
}

export async function explain(req: ExplainRequest): Promise<ExplainResponse> {
  const learner = readLearner();
  const mock = buildMockExplain(req, learner);
  if (!gatewayConfigured()) return mock;

  const raw = await callGateway([
    { role: "system", content: buildSystemPrompt(learner) },
    { role: "user", content: buildUserPrompt(req) },
  ]);
  if (!raw) return mock;

  try {
    const parsed = JSON.parse(raw.replace(/^```(json)?|```$/g, "").trim()) as Partial<ExplainResponse>;
    if (typeof parsed.explanation !== "string") return mock;
    // Model supplies the words; graph_ops and memory_excerpt stay deterministic
    // (derived the same way as the mock) so the graph never depends on model output.
    return {
      ...mock,
      explanation: parsed.explanation,
      grounded: parsed.grounded ?? true,
      built_on: Array.isArray(parsed.built_on) ? parsed.built_on : mock.built_on,
      resume_note: parsed.resume_note ?? mock.resume_note,
      new_concept: parsed.new_concept ?? mock.new_concept,
    };
  } catch {
    return mock;
  }
}

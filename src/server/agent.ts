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
    "Respond with ONLY a JSON object with keys: title (short concept heading),",
    "explanation (2-4 short sentences in the learner's style), analogy (one concrete",
    "everyday analogy), grounded (boolean), built_on (array of {concept, from_paper} —",
    "only concepts from the confirmed list above that you actually built on),",
    'resume_note (string or null), new_concept ({concept, understanding, status:"pending"} or null).',
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

    const builtOn = Array.isArray(parsed.built_on) ? parsed.built_on : mock.built_on;
    const conceptId = mock.new_concept?.concept;

    // Model supplies the words; the node for the new concept stays deterministic
    // (from the mock) so ids align with Got-it. When the model connects the
    // selection to a known concept, synthesize a cross-paper edge so real
    // explanations grow the graph too. Edges to absent nodes are skipped client-side.
    const graphOps = [...mock.graph_ops];
    if (conceptId) {
      for (const b of builtOn) {
        const target = slugify(b.concept);
        if (target && target !== conceptId) {
          graphOps.push({ op: "update_node", id: target, state: "confirmed" });
          graphOps.push({ op: "add_edge", from: conceptId, to: target, kind: "cross_paper" });
        }
      }
    }

    return {
      ...mock,
      explanation: parsed.explanation,
      grounded: parsed.grounded ?? true,
      built_on: builtOn,
      resume_note: parsed.resume_note ?? mock.resume_note,
      title: parsed.title ?? mock.title,
      analogy: parsed.analogy ?? mock.analogy,
      new_concept: mock.new_concept
        ? { ...mock.new_concept, understanding: parsed.new_concept?.understanding ?? mock.new_concept.understanding }
        : mock.new_concept,
      graph_ops: graphOps,
    };
  } catch {
    return mock;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

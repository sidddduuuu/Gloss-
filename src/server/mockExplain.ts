// Deterministic mock behind the same interface as the real agent, so the full demo
// runs with zero credentials. Selection matching is loose (keyword-based) so live
// selections on real PDF text hit the canned demo responses.

import type { ExplainRequest, ExplainResponse } from "@/lib/contract";
import type { LearnerRecord } from "@/server/memoryStore";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function lastSession(learner: LearnerRecord): string | null {
  const s = learner.sessions[learner.sessions.length - 1];
  return s ? `Last session you were ${s.summary} — picking up there.` : null;
}

export function buildMockExplain(
  req: ExplainRequest,
  learner: LearnerRecord
): ExplainResponse {
  const sel = req.selection.toLowerCase();

  if (sel.includes("reward signal") || sel.includes("reward")) {
    return {
      explanation:
        "In this passage, the reward signal is the feedback the system uses to know it did well — like a training treat for a dog, but here it's a burst of predictable input given to the neurons after a good move. The passage frames it as the loop's teaching signal: behave usefully, receive predictable stimulation.",
      grounded: true,
      built_on: [],
      resume_note: lastSession(learner),
      new_concept: {
        concept: "reward_signal",
        understanding:
          "feedback that tells a learning system how well it just did",
        status: "pending",
      },
      graph_ops: [
        {
          op: "add_node",
          id: "reward_signal",
          state: "pending",
          label: "reward signal",
          paper: "embodied_neurocomputation",
        },
      ],
      memory_excerpt: {
        retrieved_for: "reward signal",
        style: learner.style,
        note: "No confirmed related concepts yet — explaining cold, in Sam's preferred style.",
      },
    };
  }

  if (sel.includes("temporal") || sel.includes("td")) {
    const rewardSignal = learner.concepts["reward_signal"];
    if (rewardSignal && rewardSignal.status === "confirmed") {
      const source = rewardSignal.from_paper;
      return {
        explanation:
          `You already understood the reward signal from ${source} — the feedback that says "that worked." The temporal-difference error is just the gap between the reward the agent expected and the reward it actually got. Expected a big treat, got a small one? Negative TD error — adjust. It's the same signal you know, turned into a running prediction check.`,
        grounded: true,
        built_on: [
          {
            concept: "reward_signal",
            from_paper: source,
          },
        ],
        resume_note: lastSession(learner),
        new_concept: {
          concept: "td_error",
          understanding: "gap between expected and actual reward",
          status: "pending",
        },
        graph_ops: [
          {
            op: "add_node",
            id: "td_error",
            state: "pending",
            label: "TD error",
            paper: "rl_paper_2",
          },
          {
            op: "add_edge",
            from: "td_error",
            to: "reward_signal",
            kind: "cross_paper",
          },
        ],
        memory_excerpt: {
          retrieved_for: "temporal-difference error",
          recalled_concept: { reward_signal: rewardSignal },
          style: learner.style,
          note: "reward_signal is confirmed — building the explanation on it.",
        },
      };
    }

    // Curveball path: reward_signal shaky (or absent) → simpler, standalone re-explanation.
    return {
      explanation:
        "Let's take this one slowly, from the passage itself. An agent guesses how good things will be, then sees what actually happens. The temporal-difference error is just: actual minus expected. Guessed 5, got 3 → error of −2 → lower the guess next time. That running correction is the whole idea.",
      grounded: true,
      built_on: [],
      resume_note: null,
      new_concept: {
        concept: "td_error",
        understanding: "actual outcome minus expected outcome",
        status: "pending",
      },
      graph_ops: [
        {
          op: "add_node",
          id: "td_error",
          state: "pending",
          label: "TD error",
          paper: "rl_paper_2",
        },
        ...(rewardSignal
          ? [{ op: "update_node", id: "reward_signal", state: "shaky" } as const]
          : []),
      ],
      memory_excerpt: {
        retrieved_for: "temporal-difference error",
        recalled_concept: rewardSignal ? { reward_signal: rewardSignal } : null,
        style: learner.style,
        note: rewardSignal
          ? "reward_signal is shaky right now — dropping the shortcut and re-explaining simply."
          : "No related confirmed concepts — explaining from the passage alone.",
      },
    };
  }

  // Generic grounded fallback for any other selection.
  const id = slugify(req.selection) || "selection";
  const snippet = req.context.trim().slice(0, 160);
  return {
    explanation:
      `Based only on this passage, "${req.selection}" appears in the context of: "${snippet}…". ` +
      "I can't say more than the passage supports — if you want, select a bit more surrounding text and I'll ground a fuller explanation in it.",
    grounded: true,
    built_on: [],
    resume_note: null,
    new_concept: {
      concept: id,
      understanding: `mentioned in ${req.paper_id}; not yet worked through`,
      status: "pending",
    },
    graph_ops: [
      {
        op: "add_node",
        id,
        state: "open",
        label: req.selection.slice(0, 24),
        paper: req.paper_id,
      },
    ],
    memory_excerpt: {
      retrieved_for: req.selection,
      style: learner.style,
      note: "No matching prior concepts retrieved.",
    },
  };
}

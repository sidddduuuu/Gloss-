# Running the Gloss demo

## Setup

```bash
npm install
npm run seed     # compiles Sam's history → data/seed/sam/baseline.json
npm run dev      # http://localhost:3000
```

Runs fully on the deterministic mock — **no credentials needed**. To route explanations
through the real Butterbase AI gateway, copy `.env.example` to `.env` and fill in the
three `BUTTERBASE_*` vars (leave `MOCK_EXPLAIN=1` to force the mock).

## The 2-minute script (README §8)

1. **Baseline** — Paper 1 ("RL in the Brain"). Select **"reward signal"** (page 1) →
   Explain chip → short, analogy-first explanation → **Got it**. A green node blooms in
   the graph and the confirmation writes to memory.
2. **Cross-session payoff** — switch to Paper 2 ("Temporal Differences"). Select
   **"temporal-difference"** (pages 1–3). The panel resumes ("last session you were…"),
   explains TD error *through* reward signal, shows **"Building on what you learned in
   RL in the Brain"**, and the **cross-paper edge draws itself** across the graph.
3. **Curveball** — click **Curveball** (downgrades reward signal to shaky) → re-explain
   TD error → simpler, standalone explanation; the reward-signal node turns orange.
4. **Memory Reveal** — click **Memory Reveal** → the raw recalled record beside the full
   learner memory, with the mastered/connections metric.

## Reset between rehearsals

```bash
curl -X DELETE http://localhost:3000/api/memory   # restore seeded baseline
```

The knowledge graph is client-side and resets on page reload.

## What's mocked vs real

| Piece | Status |
|---|---|
| Reader, selection, panels, graph, Memory Reveal | Real |
| `/explain` contract + graph_ops | Real, deterministic |
| Learner memory (retrieve / confirm / downgrade, persisted) | Real, file-backed EverOS stand-in |
| Model prose | Mock by default; gateway adapter ready (`src/server/gateway.ts`) |
| EverOS API / Raven install / Butterbase MCP submission | Adapter seams; wire at workshop (README §12) |

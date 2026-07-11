# Gloss — Final Hackathon Spec
### AI for Education Hackathon @ Stanford · EverMind Challenge · 2 builders · ~5 hrs build

**One-liner:** Gloss turns any paper into a reading tutor that explains what you select by building on what you already know — and gets more valuable every session.

**Challenge answer (the exact test judges apply):**
*What can it do in session 5 that it couldn't in session 1?*
→ **Session 1:** explains a term cold.
→ **Session 5:** explains new terms *through* concepts you already mastered, in your style, and resumes where you left off. The knowledge graph now spans every paper. The longer it's used, the less it re-explains and the more it connects.

> This supersedes earlier specs for build day. Full product vision lives in `gloss-spec.md`; this is what we build in 5 hours.

---

## 1. Locked decisions
- **Track:** Card 5 — bring your own learner (**new researchers**).
- **Learner:** one person — **Sam** (§4). Open the demo by naming him.
- **Spine:** built as a **Raven** agent on **EverOS** memory. (Raven-built teams are in contention to be featured on Raven/EverOS GitHub — we lead with it.)
- **Backend + submission:** **Butterbase** (MCP submission is mandatory for judging).
- **Hosting:** **Nebius** (frontend/backend/model endpoint via builder credits).
- **Model:** Claude API for grounded explanations + figure reading.
- **Reader:** already built — do not rebuild it.
- **Deck:** required — submit to the Beta deck link before showcase.

---

## 2. What's already built (our head start)
- Next.js/React + PDF.js reader, full-width
- Floating, draggable, resizable explanation window
- Select-to-explain (mouseup + chip), region-select for figures/equations
- Fixed-meaning highlight colors (Remember / Explained / Revisit / Question)
- Grounded trust prompt (hedges, no invented facts), per-highlight follow-up threads
- Notes panel, delete, local persistence

**→ The entire day goes to memory + graph + demo, not the reader.**

---

## 3. Team & ownership (2 builders)

**Builder A — Frontend / Graph (the visible half)**
- Wire the explanation window to the Raven `/explain` response
- Build the **knowledge graph** (nodes/edges, cross-paper edge animation)
- "Building on what you learned in [paper]" label + **Memory Reveal** panel
- Demo polish, two-paper setup, curveball UI

**Builder B — Raven / Memory / Backend (the substance half)**
- Install Raven, wire EverOS, **load Sam's seed history**
- Implement `/explain` **as a Raven agent**: retrieve → ground → personalize → write
- Butterbase run-state + MCP submission
- Curveball logic (downgrade a concept live)

**Together, first 15 min:** install Raven, confirm whether it's a harness we build *inside* (it should be), and lock the `/explain` contract (§5). Then work in parallel against it.

---

## 4. Learner — Sam (Card 5) + seed history

**Sam, 24 — first-year neuroscience PhD.** Strong biology, weak ML/RL math, freezes on equations. Reads a paper a week outside his comfort zone; re-Googles the same ML terms every time. Prefers short, analogy-first explanations. Goal: read RL-heavy computational-neuro papers without drowning.

**Card 5 rule → we seed ~4 weeks of history into EverOS.** This is the highest-leverage artifact of the day (authored data, not code). Make it specific and dated so it reads lived-in.

Critical constraint the seed must encode:
- `reward_signal` = **confirmed** (so paper 2 can build on it)
- `td_learning` = **shaky / attempted** (so paper 2 is a real breakthrough, not a repeat)
- style = short + analogy; recurring struggle = equation/figure avoidance

> Reconcile field names with the data-pack README / `note_for_builders` at the EverMind workshop; keep the content.

---

## 5. The integration seam — `/explain` as a Raven agent (lock first)

One call is the whole boundary between the two builders.

**Request (frontend → Raven):**
```json
{ "learner_id": "sam", "paper_id": "rl_paper_2",
  "selection": "temporal-difference error",
  "context": "…surrounding passage text…", "mode": "explain" }
```

**Response (Raven → frontend):**
```json
{
  "explanation": "You already understood the reward signal from the Cortical Labs paper — this is just the gap between the reward the agent expected and what it got.",
  "grounded": true,
  "built_on": [{ "concept": "reward_signal", "from_paper": "Embodied Neurocomputation" }],
  "resume_note": "Last session you were working through RL basics — picking up there.",
  "new_concept": { "concept": "td_error", "understanding": "gap between expected and actual reward", "status": "pending" },
  "graph_ops": [
    { "op": "add_node", "id": "td_error", "state": "open" },
    { "op": "add_edge", "from": "td_error", "to": "reward_signal", "kind": "cross_paper" }
  ]
}
```

- `built_on` → the "Building on what you learned in…" label (Cross-Session bounty)
- `resume_note` → "picks up where the last session ended" (a stated challenge criterion)
- `graph_ops` → frontend just renders; never reasons about memory
- `new_concept.status` → `pending → confirmed` on the **Got it** tap

**Why:** A builds the full UI + graph against a mocked response immediately; B builds the real Raven path behind the same shape. Integrate once, at the end.

---

## 6. Raven's job (the memory loop)
On each `/explain`, the Raven agent:
1. Retrieves Sam's relevant **confirmed** concepts + style from EverOS
2. Separates *current passage* from *retrieved knowledge*
3. Produces an explanation **grounded in the passage**, **built on** prior concepts, **in Sam's style**
4. Adds a resume note from last session
5. Returns `built_on` + `graph_ops` + a `new_concept`
6. On **Got it**, writes the confirmed concept back to EverOS

Guardrail (trust — a stated win condition): *memory shapes **how** it explains (level/style/what to build on); the passage supplies **what**. Never invent facts or citations.*

---

## 7. Build timeline (~5 hrs; hard stop at 5:00 showcase)

Real build window: ~1:00–5:00 + scraps before lunch.

**11:20–11:30 (before lunch, together):** install Raven, lock `/explain` contract.
**Lunch (11:30–1:00):** B writes Sam's seed history on paper + loads it; A sketches graph + reveal panel.

**1:00–2:00 (Hour 1)**
- A: graph renders from mocked `graph_ops`; "Building on…" label wired to mock
- B: EverOS seed loaded + readable; Raven returns a valid hardcoded response

**2:00–3:00 (Hour 2)**
- A: cross-paper edge animation; Memory Reveal panel from mock
- B: real retrieve → ground → personalize; `/explain` returns real `built_on` + `graph_ops`

**3:00–4:00 (Hour 3) — INTEGRATE**
- Swap mock → real Raven. Full loop live on the two papers
- B: Got it → EverOS write persists

**4:00–4:40 (Hour 4)**
- Curveball path end-to-end
- **Butterbase MCP submission + Nebius deploy done now** (not at 4:55)

**4:40–5:00 — freeze & rehearse**
- No new features. Run the 2-min demo twice. Record a backup.

**Hard rule:** not working by 4:00 → it's cut. The demo must run.

---

## 8. The 2-minute showcase

**Open (10s):** "We built for **Sam**, a first-year neuro PhD — strong in biology, freezes on ML math. We loaded four weeks of his reading history into EverOS, and everything runs on a **Raven** agent."

**Session-1 baseline (20s):** Paper 1 (Cortical Labs). Sam highlights "reward signal" → short + analogy explanation → **Got it** → show it write to EverOS. First graph cluster blooms.

**The payoff — Cross-Session (35s):** Paper 2 (RL paper). Sam highlights "temporal-difference error." Gloss resumes ("last session you were on RL basics") and explains it *through reward signal*, labeled **"Building on what you learned in Embodied Neurocomputation."** New node wires across to Paper 1 — **the cross-paper edge draws itself.** Say it: *"Because it remembered reward signals, it taught TD error through them — not from scratch."*

**Curveball — Self-Evolving (25s):** "Say Sam's having an off day." Trigger struggle on a confirmed concept → Raven downgrades it → re-explains simpler. *"It adapted to how he's doing right now."*

**Memory Reveal (20s):** Open the panel — the raw EverOS record it recalled, beside the graph now spanning two papers. Metric: "concepts mastered · connections drawn."

**Close (10s):** "Session 1 explains a term. Session 5 explains through everything he's learned. Built on Raven and EverOS. That's learning that compounds."

---

## 9. Bounty targeting

| Bounty | How we hit it | Owner |
|---|---|---|
| **Best Cross-Session Moment** | Paper 1 → Paper 2 "because it remembered reward signal…" + cross-paper edge | A + B |
| **Best Self-Evolving Memory** | Live curveball → Raven downgrades concept → simpler re-explain | B / A |
| **Best Memory Reveal** | Reveal panel: raw EverOS record + growing graph | A / B |
| **Featured use case** | Built visibly *on Raven*; credit it in open + close | both |
| **Best Use of Butterbase** | MCP submission + run-state stored in Butterbase | B |

---

## 10. Cut list (protect the demo)
**Must work:** seed loaded · Raven `/explain` with `built_on` + `graph_ops` · one cross-paper edge · Got it → EverOS write · Memory Reveal · Butterbase submission · Nebius deploy.

**Cut first if behind, in order:**
1. Curveball (Self-Evolving) — keep Cross-Session + Reveal
2. Region/figure explanation in the demo (still present, just don't feature)
3. Graph physics polish — static positions are fine
4. Extra concepts — one clean cross-paper edge beats five messy ones

**Never cut:** the two-session cross-paper moment. That's the whole thesis.

---

## 11. Submission checklist
- [ ] EverOS account created; Sam's seed history loaded + readable
- [ ] Built as a **Raven** agent (install confirmed, retrieval working)
- [ ] `/explain` full loop live on both papers
- [ ] Cross-paper edge animates; "Built on…" + resume note show
- [ ] Got it writes to EverOS and persists
- [ ] Memory Reveal shows a real recalled record
- [ ] Curveball works (or cut cleanly)
- [ ] **Butterbase MCP submission complete**
- [ ] Deployed on **Nebius**; only claim services actually used
- [ ] **Deck submitted** to the Beta deck link
- [ ] 2-min demo rehearsed twice + backup recording
- [ ] Credits grabbed: Butterbase (`BUTTER0711`), Nebius, EverOS

---

## 12. Reconcile at the EverMind workshop
- Exact EverOS memory schema (profile + session record fields) → fix §4/§5
- How Raven install + retrieval API is actually called → fix §5/§6
- Butterbase MCP submission steps
- Whether Raven's "self-improving" memory does the curveball downgrade natively (could save an hour and strengthen the story)

**Next:** at the workshop, grab the data-pack history format + Raven's retrieval call, paste them to me, and I'll rewrite §4–§6 to the real APIs so Sam's seed loads and Raven answers first try.

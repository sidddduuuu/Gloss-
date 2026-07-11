# Gloss

**One-line pitch:** Gloss turns any paper into a reading tutor that explains what you select by building on what you already know, and grows a visible map of your understanding that compounds across every paper you read.

## Product definition
Gloss is a distraction-free reading environment where learners highlight confusing text and receive:
1. **Grounded explanations** based only on the current document context.
2. **Personalized explanations** built on confirmed prior knowledge from persistent memory.
3. **Visible compounding learning** through a growing cross-paper knowledge graph.

Gloss is **not** a generic chat-with-PDF tool. The learner reads in-document; the tutor explains through learner history; the graph proves transfer across papers.

## Core problem
Existing reading tools are generic and amnesiac: they explain passages in isolation and forget the learner tomorrow. Gloss solves this by carrying confirmed understanding forward so paper 6 is easier than paper 1.

## Learning loop
**Select → Explain → Connect → Understand → Remember → Transfer**

## Hackathon scope (fixed)
Build a demo around:
- One learner: **Sam** (strong biology, weak ML/RL math; prefers short, analogy-first explanations)
- Two related papers
- One concept confirmed in paper 1: **reward signal**
- One harder concept in paper 2 explained through it: **temporal-difference error**
- One EverOS memory write + read
- One visible cross-paper edge in the knowledge graph

## Demo behavior requirements
1. Open PDF in full-width reader with floating explanation panel.
2. On selection, capture passage + surrounding context.
3. Retrieve relevant confirmed concepts and style from EverOS via Raven.
4. Return explanation that is:
   - grounded in passage/context only,
   - personalized to learner style,
   - explicitly connected to prior confirmed concepts when available.
5. Label reuse in UI: **“Building on what you learned in [paper]”**.
6. Add concept node + edges to graph; show cross-paper edge when transfer occurs.
7. Promote concept to confirmed when learner marks understood (or no further follow-up).
8. Persist confirmed concept memory back to EverOS.

## Feature set
- In-context select-to-explain
- Trust layer (no fabrication; hedges uncertainty)
- Memory-grounded personalization (Raven + EverOS)
- Fixed-meaning highlight intents (Remember / Explained / Revisit / Question)
- Region-select for figures/equations
- Live knowledge graph (mastered vs open-question states)
- Persistent learner profile
- Cross-paper transfer

## Deliberately out of scope
- General-purpose chatbot
- Auto-fetching cited references (V2)
- Teacher dashboard/LMS/leaderboards
- OCR for scanned PDFs
- Heavy cross-reload highlight re-anchoring
- Memory settings UI

## Technical stack
- **Reader:** Next.js/React + PDF.js
- **Orchestration:** Raven (memory-first retrieval + grounding)
- **Memory:** EverOS (persistent learner concepts/profile)
- **Run state/submission:** Butterbase
- **Knowledge graph:** React + SVG/D3 force layout
- **Model:** Claude API for grounded text + figure explanations

## Data flow
Document → selection → context capture → Raven retrieves EverOS memory → grounded + personalized explanation → graph update → understanding confirmation → EverOS write → next paper transfer → cross-paper edge.

## Success signal
A learner highlights a hard concept in paper 2 and receives an explanation explicitly built on a concept mastered in paper 1, while the graph visibly draws the cross-paper connection.

## EverMind challenge fit-check
Gloss is positioned for the EverMind challenge by proving that learning compounds across sessions.

1. Pick one learner card (or Card 5 with seeded history).
2. Show that prior sessions improve later explanations and support.
3. Demo session 1 vs session 5 with a clear "remembered X → did Y" improvement.
4. Introduce a live curveball and show adaptation from remembered learner state.
5. Open memory during demo to reveal what was stored and recalled.

## Raven + EverOS memory role
- Raven is the memory orchestration layer used in every explanation flow.
- EverOS stores persistent learner history, diagnoses, preferences, and confirmed concepts.
- Raven retrieves relevant memory before each response and personalizes explanations with it.
- After each interaction, Raven writes updated understanding signals back to EverOS so the next session improves.

## Pitch line for showcase
Our product uses EverOS + Raven to deliver cross-session personalized learning that gets better over time.

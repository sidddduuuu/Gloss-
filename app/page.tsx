"use client";

import "./app.css";
import { useCallback, useRef, useState } from "react";
import { PAPERS } from "@/lib/papers";
import type { ExplainResponse } from "@/lib/contract";
import { useGraph } from "@/hooks/useGraph";
import PdfReader, { type Selection } from "@/components/reader/PdfReader";
import ExplanationPanel from "@/components/panels/ExplanationPanel";
import KnowledgeGraph from "@/components/panels/KnowledgeGraph";
import MemoryReveal from "@/components/panels/MemoryReveal";

const LEARNER_ID = "sam";

export default function Home() {
  const [paperIdx, setPaperIdx] = useState(0);
  const [chip, setChip] = useState<Selection | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [memoryKey, setMemoryKey] = useState(0);
  const lastExcerpt = useRef<Record<string, unknown> | null>(null);

  const { graph, apply, setNodeState } = useGraph();
  const paper = PAPERS[paperIdx];

  const runExplain = useCallback(
    async (sel: Selection) => {
      setPanelOpen(true);
      setLoading(true);
      setConfirmed(false);
      setData(null);
      setChip(null);
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            learner_id: LEARNER_ID,
            paper_id: paper.id,
            selection: sel.text,
            context: sel.context,
            mode: "explain",
          }),
        });
        const json: ExplainResponse = await res.json();
        setData(json);
        lastExcerpt.current = json.memory_excerpt ?? null;
        apply(json.graph_ops);
      } catch {
        setData({
          explanation: "Something went wrong reaching the tutor. Try again.",
          grounded: false,
          built_on: [],
          resume_note: null,
          new_concept: null,
          graph_ops: [],
        });
      } finally {
        setLoading(false);
      }
    },
    [paper.id, apply]
  );

  async function handleGotIt() {
    if (!data?.new_concept) return;
    setConfirmed(true);
    setNodeState(data.new_concept.concept, "confirmed");
    try {
      await fetch("/api/gotit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: data.new_concept.concept,
          understanding: data.new_concept.understanding,
          from_paper: paper.shortTitle,
        }),
      });
      setMemoryKey((k) => k + 1);
    } catch {
      /* optimistic update already applied */
    }
  }

  async function handleCurveball() {
    await fetch("/api/curveball", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept: "reward_signal" }),
    });
    setNodeState("reward_signal", "shaky");
    setMemoryKey((k) => k + 1);
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          Gloss <span className="brand-sub">reads with your memory</span>
        </div>
        <div className="paper-switch" role="tablist" aria-label="Papers">
          {PAPERS.map((p, i) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={i === paperIdx}
              className={i === paperIdx ? "active" : ""}
              onClick={() => setPaperIdx(i)}
            >
              {p.shortTitle}
            </button>
          ))}
        </div>
        <div className="topbar-actions">
          <button className="ghost" onClick={handleCurveball} title="Downgrade a confirmed concept">
            Curveball
          </button>
          <button className="ghost" onClick={() => setRevealOpen(true)}>
            Memory Reveal
          </button>
        </div>
      </header>

      <div className="workspace">
        <section className="reader-col">
          <PdfReader paper={paper} onSelect={setChip} />
          {chip && (
            <button
              className="explain-chip"
              style={{ left: chip.x, top: chip.y - 46 }}
              onClick={() => runExplain(chip)}
            >
              Explain “{chip.text.slice(0, 28)}{chip.text.length > 28 ? "…" : ""}”
            </button>
          )}
        </section>

        <section className="side-col">
          {panelOpen && (
            <ExplanationPanel
              loading={loading}
              data={data}
              confirmed={confirmed}
              onGotIt={handleGotIt}
              onClose={() => setPanelOpen(false)}
            />
          )}
          <KnowledgeGraph graph={graph} />
        </section>
      </div>

      <MemoryReveal
        open={revealOpen}
        refreshKey={memoryKey}
        lastExcerpt={lastExcerpt.current}
        onClose={() => setRevealOpen(false)}
      />
    </main>
  );
}

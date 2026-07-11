"use client";

import "./app.css";
import { useCallback, useMemo, useRef, useState } from "react";
import { PAPERS } from "@/lib/papers";
import type { ExplainResponse } from "@/lib/contract";
import { useGraph } from "@/hooks/useGraph";
import PdfReader, { type Selection } from "@/components/reader/PdfReader";
import ExplanationPanel from "@/components/panels/ExplanationPanel";
import KnowledgeGraph from "@/components/panels/KnowledgeGraph";
import MemoryReveal from "@/components/panels/MemoryReveal";
import Sidebar from "@/components/layout/Sidebar";
import BottomDashboard from "@/components/layout/BottomDashboard";

const LEARNER_ID = "sam";

export default function Home() {
  const [paperIdx, setPaperIdx] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(new Set([PAPERS[0].id]));
  const [chip, setChip] = useState<Selection | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [memoryKey, setMemoryKey] = useState(0);
  const lastExcerpt = useRef<Record<string, unknown> | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const { graph, apply, setNodeState } = useGraph();
  const paper = PAPERS[paperIdx];

  const metrics = useMemo(() => {
    const conceptsLearned = graph.nodes.filter((n) => n.state === "confirmed").length;
    const connectionsMade = graph.edges.length;
    const progress =
      graph.nodes.length === 0 ? 0 : conceptsLearned / graph.nodes.length;
    return { conceptsLearned, connectionsMade, papersRead: visited.size, progress };
  }, [graph, visited]);

  function switchPaper(idx: number) {
    setPaperIdx(idx);
    setVisited((v) => new Set(v).add(PAPERS[idx].id));
  }

  const runExplain = useCallback(
    async (sel: Selection) => {
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

  function viewInGraph() {
    graphRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    graphRef.current?.classList.add("flash");
    window.setTimeout(() => graphRef.current?.classList.remove("flash"), 900);
  }

  return (
    <div className="shell">
      <div className="shell-main">
        <Sidebar current={paper} onSelectPaper={switchPaper} everosOnline />

        <main className="reader-col">
          <div className="reader-toolbar">
            <span className="tool-paper">{paper.title}</span>
            <div className="tool-actions">
              <button className="tool-btn" onClick={handleCurveball} title="Simulate an off day">
                Curveball
              </button>
              <button className="tool-btn" onClick={() => setRevealOpen(true)}>
                Memory Reveal
              </button>
            </div>
          </div>

          <div className="reader-surface">
            <PdfReader paper={paper} onSelect={setChip} />
            {chip && (
              <div className="explain-pill" style={{ left: chip.x, top: chip.y - 52 }}>
                <button className="pill-primary" onClick={() => runExplain(chip)}>
                  Explain
                </button>
                <button className="pill-ghost" onClick={() => runExplain(chip)}>
                  Ask
                </button>
                <button className="pill-ghost" onClick={() => runExplain(chip)}>
                  Remember
                </button>
              </div>
            )}
          </div>
        </main>

        <div className="right-col">
          <ExplanationPanel
            loading={loading}
            data={data}
            confirmed={confirmed}
            onGotIt={handleGotIt}
            onViewInGraph={viewInGraph}
          />
          <div ref={graphRef} className="graph-wrap">
            <KnowledgeGraph graph={graph} />
          </div>
        </div>
      </div>

      <BottomDashboard {...metrics} />

      <MemoryReveal
        open={revealOpen}
        refreshKey={memoryKey}
        lastExcerpt={lastExcerpt.current}
        onClose={() => setRevealOpen(false)}
      />
    </div>
  );
}

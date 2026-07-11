"use client";

import "./app.css";
import { useCallback, useMemo, useRef, useState } from "react";
import { DEFAULT_PAPERS, type Paper } from "@/lib/papers";
import type { ExplainResponse } from "@/lib/contract";
import { useGraph } from "@/hooks/useGraph";
import PdfReader, { type Selection } from "@/components/reader/PdfReader";
import ExplanationPanel from "@/components/panels/ExplanationPanel";
import KnowledgeGraph from "@/components/panels/KnowledgeGraph";
import MemoryReveal from "@/components/panels/MemoryReveal";
import Sidebar from "@/components/layout/Sidebar";
import BottomDashboard, { type Highlight } from "@/components/layout/BottomDashboard";

const LEARNER_ID = "sam";

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>(DEFAULT_PAPERS);
  const [currentId, setCurrentId] = useState(DEFAULT_PAPERS[0].id);
  const [visited, setVisited] = useState<Set<string>>(new Set([DEFAULT_PAPERS[0].id]));
  const [pageInfo, setPageInfo] = useState<{ numPages: number; rendered: number } | null>(null);
  const [chip, setChip] = useState<Selection | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [memoryKey, setMemoryKey] = useState(0);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const lastExcerpt = useRef<Record<string, unknown> | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const { graph, apply, setNodeState } = useGraph();
  const paper = papers.find((p) => p.id === currentId) ?? papers[0];

  const metrics = useMemo(() => {
    const conceptsLearned = graph.nodes.filter((n) => n.state === "confirmed").length;
    const connectionsMade = graph.edges.length;
    const progress = graph.nodes.length === 0 ? 0 : conceptsLearned / graph.nodes.length;
    return { conceptsLearned, connectionsMade, papersRead: visited.size, progress };
  }, [graph, visited]);

  const progressByPaper = useMemo(() => {
    const acc: Record<string, { total: number; done: number }> = {};
    for (const n of graph.nodes) {
      const a = (acc[n.paper] ??= { total: 0, done: 0 });
      a.total += 1;
      if (n.state === "confirmed") a.done += 1;
    }
    const out: Record<string, number> = {};
    for (const [id, { total, done }] of Object.entries(acc)) out[id] = total ? done / total : 0;
    return out;
  }, [graph]);

  const handleMeta = useCallback((info: { numPages: number; rendered: number }) => {
    setPageInfo(info);
  }, []);

  function switchPaper(idx: number) {
    setCurrentId(papers[idx].id);
    setVisited((v) => new Set(v).add(papers[idx].id));
    setData(null);
    setChip(null);
  }

  function handleUpload(file: File) {
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.pdf$/i, "");
    const id = `upload_${Date.now()}`;
    const uploaded: Paper = {
      id,
      title: name,
      shortTitle: name.length > 28 ? name.slice(0, 28) + "…" : name,
      authors: "Uploaded",
      file: url,
      uploaded: true,
    };
    setPapers((prev) => [...prev, uploaded]);
    setCurrentId(id);
    setVisited((v) => new Set(v).add(id));
    setData(null);
    setChip(null);
  }

  const runExplain = useCallback(
    async (sel: Selection) => {
      setLoading(true);
      setConfirmed(false);
      setData(null);
      setChip(null);
      setHighlights((h) => [{ text: sel.text, paper: paper.shortTitle }, ...h].slice(0, 8));
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
    [paper.id, paper.shortTitle, apply]
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
        <Sidebar
          papers={papers}
          currentId={currentId}
          onSelectPaper={switchPaper}
          onUpload={handleUpload}
          everosOnline
          progressByPaper={progressByPaper}
        />

        <main className="reader-col">
          <div className="reader-toolbar">
            <span className="tool-paper">
              {paper.title}
              {paper.authors ? ` · ${paper.authors}` : ""}
            </span>
            <div className="tool-actions">
              {pageInfo && (
                <span className="tool-pages">
                  {pageInfo.rendered < pageInfo.numPages
                    ? `1–${pageInfo.rendered} of ${pageInfo.numPages}`
                    : `${pageInfo.numPages} pages`}
                </span>
              )}
              <button className="tool-btn" onClick={handleCurveball} title="Simulate an off day">
                Curveball
              </button>
              <button className="tool-btn" onClick={() => setRevealOpen(true)}>
                Memory Reveal
              </button>
            </div>
          </div>

          <div className="reader-surface">
            <PdfReader paper={paper} onSelect={setChip} onMeta={handleMeta} />
            {chip && (
              <div
                className="explain-pill"
                style={{ left: chip.x, top: chip.y < 110 ? chip.y + 28 : chip.y - 52 }}
              >
                <button className="pill-primary" onClick={() => runExplain(chip)}>
                  Explain
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

      <BottomDashboard {...metrics} highlights={highlights} />

      <MemoryReveal
        open={revealOpen}
        refreshKey={memoryKey}
        lastExcerpt={lastExcerpt.current}
        onClose={() => setRevealOpen(false)}
      />
    </div>
  );
}

"use client";

import type { GraphState } from "@/hooks/useGraph";

interface Props {
  graph: GraphState;
}

// Node rendering per design: solid = mastered, outlined = learning, glowing = question.
function nodeVisual(state: string) {
  if (state === "confirmed") return { fill: "var(--node-mastered)", stroke: "none", cls: "solid" };
  if (state === "shaky") return { fill: "var(--surface)", stroke: "var(--node-question)", cls: "glow" };
  return { fill: "var(--surface)", stroke: "var(--node-learning)", cls: "outline" };
}

export default function KnowledgeGraph({ graph }: Props) {
  const { nodes, edges } = graph;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const crossEdge = edges.find((e) => e.kind === "cross_paper");
  const crossFrom = crossEdge ? byId.get(crossEdge.from) : null;
  const crossTo = crossEdge ? byId.get(crossEdge.to) : null;

  return (
    <section className="graph-panel">
      <div className="graph-header">Knowledge graph</div>

      <svg viewBox="0 0 460 360" className="graph-svg" role="img" aria-label="Concept graph">
        {edges.map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={`edge ${e.kind === "cross_paper" ? "cross" : "within"} ${
                e.isNew ? "draw" : ""
              }`}
            />
          );
        })}

        {nodes.map((n) => {
          const v = nodeVisual(n.state);
          return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`} className={`node ${v.cls}`}>
              <circle r={22} fill={v.fill} stroke={v.stroke} strokeWidth={3} />
              <text className="node-label" y={40} textAnchor="middle">
                {n.label}
              </text>
            </g>
          );
        })}

        {nodes.length === 0 && (
          <text x={230} y={180} textAnchor="middle" className="graph-empty">
            Highlight a concept to begin
          </text>
        )}
      </svg>

      {crossEdge && crossFrom && crossTo && (
        <article className="cross-hero">
          <div className="cross-hero-kicker">✦ Cross-paper connection</div>
          <p>
            You connected <strong>{crossTo.label}</strong> to <strong>{crossFrom.label}</strong>.
          </p>
        </article>
      )}

      <div className="legend">
        <span><i className="dot solid" /> mastered</span>
        <span><i className="dot outline" /> learning</span>
        <span><i className="dot glow" /> question</span>
        <span><i className="edge-key within" /> within</span>
        <span><i className="edge-key cross" /> cross-paper</span>
      </div>
    </section>
  );
}

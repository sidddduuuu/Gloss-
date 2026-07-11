"use client";

import type { GraphState } from "@/hooks/useGraph";

const STATE_COLOR: Record<string, string> = {
  open: "var(--ink-soft)",
  pending: "var(--pending)",
  confirmed: "var(--confirmed)",
  shaky: "var(--shaky)",
};

interface Props {
  graph: GraphState;
}

export default function KnowledgeGraph({ graph }: Props) {
  const { nodes, edges } = graph;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const mastered = nodes.filter((n) => n.state === "confirmed").length;
  const connections = edges.length;

  return (
    <div className="panel graph">
      <div className="panel-head">
        <span className="panel-kicker">Knowledge graph</span>
        <span className="graph-metric">
          {mastered} mastered · {connections} connection{connections === 1 ? "" : "s"}
        </span>
      </div>

      <svg viewBox="0 0 460 440" className="graph-svg" role="img" aria-label="Concept graph">
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
              className={`edge ${e.kind === "cross_paper" ? "cross" : ""} ${
                e.isNew ? "draw" : ""
              }`}
            />
          );
        })}

        {nodes.map((n) => (
          <g key={n.id} transform={`translate(${n.x},${n.y})`} className="node">
            <circle r={22} fill={STATE_COLOR[n.state] ?? "var(--ink-soft)"} />
            <text className="node-label" y={38} textAnchor="middle">
              {n.label}
            </text>
          </g>
        ))}

        {nodes.length === 0 && (
          <text x={230} y={220} textAnchor="middle" className="graph-empty">
            Highlight a concept to begin
          </text>
        )}
      </svg>

      <div className="legend">
        <span><i style={{ background: "var(--confirmed)" }} /> confirmed</span>
        <span><i style={{ background: "var(--pending)" }} /> pending</span>
        <span><i style={{ background: "var(--shaky)" }} /> shaky</span>
        <span><i className="cross-key" /> cross-paper</span>
      </div>
    </div>
  );
}

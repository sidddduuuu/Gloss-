"use client";

import { useCallback, useState } from "react";
import type { GraphNodeState, GraphOp } from "@/lib/contract";

export interface GraphNode {
  id: string;
  label: string;
  state: GraphNodeState;
  paper: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: "within_paper" | "cross_paper";
  isNew: boolean;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Deterministic layout: nodes cluster by paper into left/right columns so the
// cross-paper edge visibly spans the gap. No physics — static positions per the cut list.
const COLUMN_X: Record<string, number> = {};
function columnX(paper: string): number {
  if (!(paper in COLUMN_X)) {
    COLUMN_X[paper] = Object.keys(COLUMN_X).length === 0 ? 130 : 330;
  }
  return COLUMN_X[paper];
}

export function useGraph() {
  const [state, setState] = useState<GraphState>({ nodes: [], edges: [] });

  const apply = useCallback((ops: GraphOp[]) => {
    setState((prev) => {
      let nodes = [...prev.nodes];
      let edges = prev.edges.map((e) => ({ ...e, isNew: false }));

      for (const op of ops) {
        if (op.op === "add_node") {
          if (nodes.some((n) => n.id === op.id)) {
            nodes = nodes.map((n) =>
              n.id === op.id ? { ...n, state: op.state } : n
            );
            continue;
          }
          const paper = op.paper ?? "unknown";
          const inColumn = nodes.filter((n) => n.paper === paper).length;
          nodes.push({
            id: op.id,
            label: op.label ?? op.id,
            state: op.state,
            paper,
            x: columnX(paper),
            y: 90 + inColumn * 96,
          });
        } else if (op.op === "update_node") {
          nodes = nodes.map((n) =>
            n.id === op.id ? { ...n, state: op.state } : n
          );
        } else if (op.op === "add_edge") {
          if (edges.some((e) => e.from === op.from && e.to === op.to)) continue;
          edges.push({ from: op.from, to: op.to, kind: op.kind, isNew: true });
        }
      }
      return { nodes, edges };
    });
  }, []);

  const setNodeState = useCallback((id: string, s: GraphNodeState) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, state: s } : n)),
    }));
  }, []);

  return { graph: state, apply, setNodeState };
}

// The locked /explain contract (ARCHITECTURE.md). Frontend renders this verbatim;
// it never reasons about memory. Backend never reasons about rendering.

export type GraphNodeState = "open" | "pending" | "confirmed" | "shaky";

export type GraphOp =
  | { op: "add_node"; id: string; state: GraphNodeState; label?: string; paper?: string }
  | { op: "update_node"; id: string; state: GraphNodeState }
  | { op: "add_edge"; from: string; to: string; kind: "within_paper" | "cross_paper" };

export interface ExplainRequest {
  learner_id: string;
  paper_id: string;
  selection: string;
  context: string;
  mode: "explain";
}

export interface BuiltOn {
  concept: string;
  from_paper: string;
}

export interface NewConcept {
  concept: string;
  understanding: string;
  status: "pending" | "confirmed";
}

export interface ExplainResponse {
  explanation: string;
  grounded: boolean;
  built_on: BuiltOn[];
  resume_note: string | null;
  new_concept: NewConcept | null;
  graph_ops: GraphOp[];
  // Optional extension: the raw memory records the agent recalled, for the Memory Reveal panel.
  memory_excerpt?: Record<string, unknown> | null;
}

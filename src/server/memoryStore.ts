// File-backed learner memory. Acts as the local stand-in for EverOS: same shape,
// same operations (retrieve / confirm / downgrade), persisted across restarts.
// Swapping in the real EverOS API touches only this module (see everosAdapter notes).

import fs from "node:fs";
import path from "node:path";

export type ConceptStatus = "confirmed" | "shaky" | "attempted" | "pending";

export interface ConceptRecord {
  status: ConceptStatus;
  understanding: string;
  from_paper: string;
  last_seen: string;
}

export interface SessionRecord {
  date: string;
  summary: string;
}

export interface LearnerRecord {
  learner_id: string;
  style: {
    length: string;
    approach: string;
    struggles: string[];
  };
  concepts: Record<string, ConceptRecord>;
  sessions: SessionRecord[];
}

const LIVE_PATH = path.join(process.cwd(), "data", "memory", "sam.json");
const BASELINE_PATH = path.join(process.cwd(), "data", "seed", "sam", "baseline.json");

function ensureLive(): void {
  if (fs.existsSync(LIVE_PATH)) return;
  fs.mkdirSync(path.dirname(LIVE_PATH), { recursive: true });
  fs.copyFileSync(BASELINE_PATH, LIVE_PATH);
}

export function readLearner(): LearnerRecord {
  ensureLive();
  return JSON.parse(fs.readFileSync(LIVE_PATH, "utf8")) as LearnerRecord;
}

function writeLearner(record: LearnerRecord): void {
  fs.mkdirSync(path.dirname(LIVE_PATH), { recursive: true });
  fs.writeFileSync(LIVE_PATH, JSON.stringify(record, null, 2));
}

export function confirmConcept(
  id: string,
  understanding: string,
  fromPaper: string
): LearnerRecord {
  const learner = readLearner();
  const updated: LearnerRecord = {
    ...learner,
    concepts: {
      ...learner.concepts,
      [id]: {
        status: "confirmed",
        understanding,
        from_paper: fromPaper,
        last_seen: new Date().toISOString().slice(0, 10),
      },
    },
  };
  writeLearner(updated);
  return updated;
}

export function downgradeConcept(id: string): LearnerRecord {
  const learner = readLearner();
  const existing = learner.concepts[id];
  if (!existing) return learner;
  const updated: LearnerRecord = {
    ...learner,
    concepts: {
      ...learner.concepts,
      [id]: { ...existing, status: "shaky" },
    },
  };
  writeLearner(updated);
  return updated;
}

export function resetLearner(): LearnerRecord {
  if (fs.existsSync(LIVE_PATH)) fs.rmSync(LIVE_PATH);
  return readLearner();
}

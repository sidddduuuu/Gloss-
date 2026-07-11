// Learner memory — local stand-in for EverOS (retrieve / confirm / downgrade).
// Deploy-safe: the seed baseline is imported (bundled, always readable), live state
// lives in an in-memory cache, and disk persistence is best-effort so it works both
// locally (persists across restarts) and on read-only serverless/edge filesystems.
// Swapping in the real EverOS API touches only this module.

import fs from "node:fs";
import path from "node:path";
import baselineSeed from "../../data/seed/sam/baseline.json";

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

const BASELINE = baselineSeed as LearnerRecord;
const LIVE_PATH = path.join(process.cwd(), "data", "memory", "sam.json");

// Live state for the current process. Seeded from disk (if a prior local run wrote
// it) or from the bundled baseline. On serverless this persists for the life of a
// warm instance; a cold start re-seeds from the baseline.
let cache: LearnerRecord | null = null;

function clone(r: LearnerRecord): LearnerRecord {
  return JSON.parse(JSON.stringify(r)) as LearnerRecord;
}

export function readLearner(): LearnerRecord {
  if (cache) return cache;
  try {
    if (fs.existsSync(LIVE_PATH)) {
      cache = JSON.parse(fs.readFileSync(LIVE_PATH, "utf8")) as LearnerRecord;
      return cache;
    }
  } catch {
    // ignore unreadable live file — fall through to baseline
  }
  cache = clone(BASELINE);
  return cache;
}

function writeLearner(record: LearnerRecord): void {
  cache = record;
  // Best-effort disk persistence. No-op on read-only filesystems (serverless/edge).
  try {
    fs.mkdirSync(path.dirname(LIVE_PATH), { recursive: true });
    fs.writeFileSync(LIVE_PATH, JSON.stringify(record, null, 2));
  } catch {
    // in-memory cache is the source of truth when disk isn't writable
  }
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
  cache = null;
  try {
    if (fs.existsSync(LIVE_PATH)) fs.rmSync(LIVE_PATH);
  } catch {
    // ignore
  }
  return readLearner();
}

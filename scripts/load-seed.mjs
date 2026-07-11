// Compiles Sam's authored Markdown history (data/seed/sam/) into the baseline record
// the memory store reads. In production this is where the real EverOS ingest call goes
// (one call ingests these docs); here it writes data/seed/sam/baseline.json.

import fs from "node:fs";
import path from "node:path";

const SEED_DIR = path.join(process.cwd(), "data", "seed", "sam");
const OUT = path.join(SEED_DIR, "baseline.json");

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  let currentKey = null;
  for (const line of m[1].split("\n")) {
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentKey) {
      (fm[currentKey] ??= []).push(listItem[1].trim());
      continue;
    }
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kv) {
      currentKey = kv[1];
      fm[currentKey] = kv[2] === "" ? [] : kv[2].trim();
    }
  }
  return fm;
}

const profile = parseFrontmatter(fs.readFileSync(path.join(SEED_DIR, "profile.md"), "utf8"));

const sessionFiles = fs
  .readdirSync(path.join(SEED_DIR, "sessions"))
  .filter((f) => f.endsWith(".md"))
  .sort();

const concepts = {};
const sessions = [];

// Later sessions override earlier status for the same concept (confirmed > shaky > attempted).
for (const file of sessionFiles) {
  const raw = fs.readFileSync(path.join(SEED_DIR, "sessions", file), "utf8");
  const fm = parseFrontmatter(raw);
  const body = raw.replace(/^---\n[\s\S]*?\n---/, "");
  const bodyLine = body
    .split("\n")
    .find((l) => l.trim() && !l.startsWith("#") && !l.startsWith("-"));
  sessions.push({
    date: fm.date,
    summary: `working through ${fm.paper} (${fm.concept.replace(/_/g, " ")})`,
  });
  if (fm.concept) {
    concepts[fm.concept] = {
      status: fm.status,
      understanding: (bodyLine ?? "").trim().slice(0, 140),
      from_paper: fm.paper,
      last_seen: fm.date,
    };
  }
}

const record = {
  learner_id: profile.learner_id ?? "sam",
  style: {
    length: profile.style_length ?? "short",
    approach: profile.style_approach ?? "analogy-first",
    struggles: Array.isArray(profile.struggles) ? profile.struggles : [],
  },
  concepts,
  sessions,
};

fs.writeFileSync(OUT, JSON.stringify(record, null, 2));
console.log(`Seeded ${Object.keys(concepts).length} concepts, ${sessions.length} sessions → ${path.relative(process.cwd(), OUT)}`);
for (const [id, c] of Object.entries(concepts)) console.log(`  ${id}: ${c.status}`);

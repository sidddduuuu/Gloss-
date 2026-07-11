// Loads Sam's authored reading history into EverOS Cloud as real memory.
// Reads data/seed/sam/*.md, posts each session as a message, then flushes so
// EverOS extracts episodic memories + a profile. Run once:  npm run seed:everos
//   EVEROS_API_KEY=... node scripts/load-everos-seed.mjs

import fs from "node:fs";
import path from "node:path";

const BASE = "https://api.evermind.ai";
const USER = "gloss_sam";
const KEY = process.env.EVEROS_API_KEY;

if (!KEY) {
  console.error("EVEROS_API_KEY is not set. export EVEROS_API_KEY=... then re-run.");
  process.exit(1);
}

async function post(pathname, body) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${pathname} → ${res.status} ${JSON.stringify(json)}`);
  return json;
}

function stripFrontmatter(raw) {
  return raw.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

const SEED_DIR = path.join(process.cwd(), "data", "seed", "sam");

// Profile first, then dated sessions in order.
const profile = stripFrontmatter(fs.readFileSync(path.join(SEED_DIR, "profile.md"), "utf8"));
const sessionFiles = fs
  .readdirSync(path.join(SEED_DIR, "sessions"))
  .filter((f) => f.endsWith(".md"))
  .sort();

const messages = [
  { session: "profile", text: `Learner profile — ${profile}` },
  ...sessionFiles.map((f) => {
    const raw = fs.readFileSync(path.join(SEED_DIR, "sessions", f), "utf8");
    const dateMatch = raw.match(/date:\s*([\d-]+)/);
    const date = dateMatch ? dateMatch[1] : "";
    return { session: date || f.replace(/\.md$/, ""), text: stripFrontmatter(raw) };
  }),
];

console.log(`Loading ${messages.length} memories into EverOS for user "${USER}"…`);
for (const m of messages) {
  await post("/api/v1/memories", {
    user_id: USER,
    session_id: "seed",
    async_mode: false,
    messages: [{ role: "user", timestamp: Date.now(), content: m.text }],
  });
  console.log(`  + ${m.session}`);
}

console.log("Flushing to extract memories…");
const flushed = await post("/api/v1/memories/flush", { user_id: USER, session_id: "seed" });
console.log("Flush:", flushed.data?.status);
console.log("Done. Sam's history is now in EverOS.");

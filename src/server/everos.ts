// EverOS Cloud client (https://docs.evermind.ai). Real memory layer for Gloss:
// Sam's history is stored here, explanations retrieve from here, "Got it" writes
// here. Extraction-based — you POST conversation messages and EverOS extracts
// episodic memories + a profile asynchronously (flush forces it).
//
// All calls fail soft (return null/empty) so a missing key or network hiccup never
// breaks the app — the local structured store keeps the deterministic demo working.

const BASE = "https://api.evermind.ai";

export const EVEROS_USER = "gloss_sam";

function apiKey(): string | undefined {
  return process.env.EVEROS_API_KEY;
}

export function everosEnabled(): boolean {
  return Boolean(apiKey());
}

async function call<T>(path: string, body: unknown): Promise<T | null> {
  if (!everosEnabled()) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error(`[everos] ${path} → ${res.status} ${await res.text()}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[everos] ${path} failed`, err);
    return null;
  }
}

export interface Episode {
  id: string;
  summary?: string;
  episode?: string;
  timestamp?: number;
  session_id?: string;
}

export interface Profile {
  id: string;
  profile_data?: { explicit_info?: unknown; implicit_traits?: unknown };
}

/** Store a message in EverOS memory for a user. */
export async function addMemory(
  content: string,
  opts: { sessionId?: string; role?: "user" | "assistant"; timestamp?: number } = {}
): Promise<boolean> {
  const res = await call<{ data?: { status?: string } }>("/api/v1/memories", {
    user_id: EVEROS_USER,
    session_id: opts.sessionId ?? "gloss",
    async_mode: true,
    messages: [
      {
        role: opts.role ?? "user",
        timestamp: opts.timestamp ?? Date.now(),
        content,
      },
    ],
  });
  return res !== null;
}

/** Force extraction of accumulated messages. */
export async function flush(sessionId?: string): Promise<boolean> {
  const res = await call<{ data?: { status?: string } }>("/api/v1/memories/flush", {
    user_id: EVEROS_USER,
    ...(sessionId ? { session_id: sessionId } : {}),
  });
  return res !== null;
}

/** Semantic search over the learner's EverOS memory. */
export async function searchMemory(
  query: string,
  topK = 5
): Promise<{ episodes: Episode[]; profiles: Profile[] }> {
  const res = await call<{ data?: { episodes?: Episode[]; profiles?: Profile[] } }>(
    "/api/v1/memories/search",
    {
      query,
      filters: { user_id: EVEROS_USER },
      method: "hybrid",
      top_k: topK,
    }
  );
  return { episodes: res?.data?.episodes ?? [], profiles: res?.data?.profiles ?? [] };
}

/** Fetch stored memories of a given type (for the Memory Reveal panel). */
export async function getMemories(
  memoryType: "episodic_memory" | "profile" = "episodic_memory",
  pageSize = 20
): Promise<Episode[] | Profile[]> {
  const res = await call<{ data?: { episodes?: Episode[]; profiles?: Profile[] } }>(
    "/api/v1/memories/get",
    { memory_type: memoryType, filters: { user_id: EVEROS_USER }, page: 1, page_size: pageSize }
  );
  return memoryType === "profile" ? res?.data?.profiles ?? [] : res?.data?.episodes ?? [];
}

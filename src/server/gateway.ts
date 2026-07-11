// OpenAI-compatible chat gateway. Works with the Butterbase AI gateway or any
// OpenAI-compatible provider — configured via env, swappable in one place.
// Returns null when unconfigured or on any failure so the caller falls back to
// the deterministic mock and the demo never breaks.

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

// Accepts both LLM_* (generic) and BUTTERBASE_* (stack-specific) names.
function baseUrl(): string | undefined {
  return process.env.LLM_BASE_URL ?? process.env.BUTTERBASE_GATEWAY_URL;
}
function apiKey(): string | undefined {
  return process.env.LLM_API_KEY ?? process.env.BUTTERBASE_API_KEY;
}
function model(): string {
  return process.env.LLM_MODEL ?? process.env.BUTTERBASE_MODEL ?? "gpt-4o-mini";
}

export function gatewayConfigured(): boolean {
  return process.env.MOCK_EXPLAIN !== "1" && Boolean(baseUrl()) && Boolean(apiKey());
}

export async function callGateway(messages: ChatMessage[]): Promise<string | null> {
  if (!gatewayConfigured()) return null;
  try {
    const res = await fetch(`${baseUrl()!.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({
        model: model(),
        messages,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error(`[gateway] ${res.status} ${await res.text()}`);
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[gateway] request failed", err);
    return null;
  }
}

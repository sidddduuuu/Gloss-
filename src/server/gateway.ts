// Butterbase AI gateway adapter (OpenAI-compatible chat shape). Provider swaps in
// one line via env vars. Returns null when unconfigured or on any failure — the
// caller falls back to the deterministic mock so the demo never breaks.

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export function gatewayConfigured(): boolean {
  return (
    process.env.MOCK_EXPLAIN !== "1" &&
    Boolean(process.env.BUTTERBASE_GATEWAY_URL) &&
    Boolean(process.env.BUTTERBASE_API_KEY)
  );
}

export async function callGateway(messages: ChatMessage[]): Promise<string | null> {
  if (!gatewayConfigured()) return null;
  try {
    const res = await fetch(
      `${process.env.BUTTERBASE_GATEWAY_URL!.replace(/\/$/, "")}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BUTTERBASE_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.BUTTERBASE_MODEL ?? "default",
          messages,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );
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

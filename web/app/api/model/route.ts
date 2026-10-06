const API_URL = process.env.TOXIC_API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/v1/model`, { signal: AbortSignal.timeout(5_000) });
    return new Response(res.body, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return Response.json({ error: "model API unreachable" }, { status: 502 });
  }
}

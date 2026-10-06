/**
 * Backend-for-frontend proxy to the FastAPI service. Keeps TOXIC_API_KEY server-side and lets
 * the site and the API live on different hosts without CORS configuration.
 */
const API_URL = process.env.TOXIC_API_URL ?? "http://127.0.0.1:8000";
const MAX_TEXTS = 64;
const MAX_CHARS = 5000;

export async function POST(request: Request) {
  let body: { texts?: unknown; profile?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const texts = Array.isArray(body.texts) ? body.texts.filter((t): t is string => typeof t === "string") : [];
  if (texts.length === 0 || texts.length > MAX_TEXTS) {
    return Response.json({ error: `send 1-${MAX_TEXTS} texts` }, { status: 400 });
  }
  const profile = body.profile === "strict" ? "strict" : "balanced";

  try {
    const res = await fetch(`${API_URL}/v1/classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.TOXIC_API_KEY ? { "X-API-Key": process.env.TOXIC_API_KEY } : {}),
        "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
      },
      body: JSON.stringify({ texts: texts.map((t) => t.slice(0, MAX_CHARS)), profile }),
      signal: AbortSignal.timeout(15_000),
    });
    return new Response(res.body, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return Response.json({ error: "The model API is unreachable. Is it running?" }, { status: 502 });
  }
}

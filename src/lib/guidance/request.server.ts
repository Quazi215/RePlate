import { getGuidance, type GuidanceProvider } from "./guidance.server";

const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
function error(status: number, code: string, message: string): Response {
  return Response.json({ status: "error", code, message }, { status, headers });
}

export async function handleGuidanceRequest(request: Request, provider?: GuidanceProvider): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...headers, Allow: "POST" } });
  const incomingUrl = new URL(request.url);
  // Next can construct an internal localhost URL; Host identifies the browser's origin.
  incomingUrl.host = request.headers.get("host") ?? incomingUrl.host;
  if (request.headers.get("origin") !== incomingUrl.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return error(400, "INVALID_REQUEST", "Submit a question from the Hiraku page.");
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return error(415, "UNSUPPORTED_CONTENT_TYPE", "Send a JSON question.");
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20000)]);
  const reader = request.body?.getReader();
  if (!reader) return error(400, "INVALID_REQUEST", "Send one question.");
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    signal.throwIfAborted();
    while (true) {
      const { value, done } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        void reader.cancel().catch(() => {});
        return error(413, "PAYLOAD_TOO_LARGE", "Type a shorter question.");
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const body: unknown = JSON.parse(text);
    // A single string-valued member also rejects duplicate (including escaped) keys.
    const jsonString = '"(?:[^"\\\\\u0000-\u001f]|\\\\(?:["\\\\/bfnrt]|u[0-9a-fA-F]{4}))*"';
    if (!new RegExp(`^\\s*\\{\\s*${jsonString}\\s*:\\s*${jsonString}\\s*\\}\\s*$`).test(text) ||
      !body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).join() !== "question") {
      return error(400, "INVALID_REQUEST", "Send only one question field.");
    }
    const question = (body as { question: string }).question.trim();
    if (!question || question.length > 2000) return error(400, "INVALID_QUESTION", "Ask a question between 1 and 2,000 characters.");
    const result = await getGuidance(question, signal, provider);
    if (result.status === "error") {
      const { httpStatus, ...payload } = result;
      return Response.json(payload, { status: httpStatus, headers });
    }
    return Response.json(result, { headers });
  } catch {
    if (signal.aborted && !request.signal.aborted) return error(504, "PROCESSING_TIMEOUT", "The request took too long. Try again when ready.");
    return error(400, "INVALID_REQUEST", "Send a valid JSON question, or ask again after cancellation.");
  } finally {
    signal.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}

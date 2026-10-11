import type { ConversationMessage } from "../guidance/guidance";
import { getGuidance, type GuidanceProvider } from "../guidance/guidance.server";
import { speakAnswer, type SpeechProvider } from "./speech.server";
import { isLocale, realtimeCodes } from "../i18n/locale";

const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
function error(status: number, message: string, code = "INVALID_REQUEST"): Response {
  return Response.json({ status: "error", code, message }, { status, headers });
}

async function readRequest(request: Request, signal: AbortSignal): Promise<unknown> {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...headers, Allow: "POST" } });
  const url = new URL(request.url);
  url.host = request.headers.get("host") ?? url.host;
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return error(403, "Live conversation is available only in the local demo.");
  if (request.headers.get("origin") !== url.origin || request.headers.get("sec-fetch-site") === "cross-site") return error(400, "Start a conversation from the Hiraku page.");
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return error(415, "Send a JSON request.");
  const reader = request.body?.getReader();
  if (!reader) return error(400, "Send a conversation request.");
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    signal.throwIfAborted();
    while (true) {
      const { value, done } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > 131072) { abort(); return error(413, "This conversation is too long. Start again."); }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    if (!body || typeof body !== "object" || Array.isArray(body)) return error(400, "Send a valid conversation request.");
    return body;
  } finally {
    signal.removeEventListener("abort", abort); reader.releaseLock();
  }
}

export async function handleLiveGuidanceRequest(request: Request, provider?: GuidanceProvider, speech?: SpeechProvider): Promise<Response> {
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45000)]);
  try {
    const body = await readRequest(request, signal);
    if (body instanceof Response) return body;
    const data = body as Record<string, unknown>;
    if (Object.keys(data).some(key => !["history", "question", "locale"].includes(key)) || !('history' in data) || !('question' in data) ||
      ("locale" in data && !isLocale(data.locale)) || typeof data.question !== "string" ||
      !data.question.trim() || data.question.trim().length > 2000 || !Array.isArray(data.history) || data.history.length > 60) {
      return error(400, "Ask a shorter question, or start a fresh conversation.");
    }
    let historyLength = 0;
    for (const message of data.history) {
      if (!message || typeof message !== "object" || Array.isArray(message) ||
        Object.keys(message).sort().join(",") !== "role,text" || !["user", "assistant"].includes(message.role) ||
        typeof message.text !== "string" || !message.text.trim() || message.text.length > (message.role === "user" ? 2000 : 1500)) {
        return error(400, "Start a fresh conversation.");
      }
      historyLength += message.text.length;
    }
    if (historyLength > 60000) return error(400, "This conversation is too long. Start again.");
    const locale = isLocale(data.locale) ? data.locale : "en";
    if (!realtimeCodes[locale]) return error(400, "Live voice is unavailable in the selected language.", "LIVE_VOICE_UNAVAILABLE");
    const result = await getGuidance(data.question.trim(), signal, provider, data.history as ConversationMessage[], locale);
    if (result.status === "error") {
      const { httpStatus, ...payload } = result;
      return Response.json(payload, { status: httpStatus, headers });
    }
    signal.throwIfAborted();
    const audio = await speakAnswer(result.answer, signal, speech, locale);
    signal.throwIfAborted();
    return Response.json({ ...result, ...audio }, { headers });
  } catch {
    return error(signal.aborted && !request.signal.aborted ? 504 : 400, "The conversation could not continue. Start again when ready.");
  }
}

type TokenProvider = (signal: AbortSignal) => Promise<Response>;
async function createToken(signal: AbortSignal): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key || key.startsWith("<")) throw new Error("Live voice not configured");
  return fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
    method: "POST", headers: { "xi-api-key": key }, signal, cache: "no-store", redirect: "error",
  });
}

export async function handleLiveTokenRequest(request: Request, provider: TokenProvider = createToken): Promise<Response> {
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(10000)]);
  try {
    const body = await readRequest(request, signal);
    if (body instanceof Response) return body;
    if (Object.keys(body as object).length) return error(400, "Start a conversation without extra data.");
    const response = await provider(signal);
    if (!response.ok) { void response.body?.cancel().catch(() => {}); throw new Error("Token unavailable"); }
    const data: unknown = await response.json();
    signal.throwIfAborted();
    if (!data || typeof data !== "object" || !("token" in data) || typeof data.token !== "string" || !data.token || data.token.length > 8192) throw new Error("Invalid token");
    return Response.json({ token: data.token }, { headers });
  } catch {
    return error(503, "Live voice is unavailable. You can still type or record a question.", "LIVE_VOICE_UNAVAILABLE");
  }
}

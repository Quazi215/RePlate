import { getTranscript, type VoiceDependencies } from "./voice.server";

const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
function error(httpStatus: number, code: string, message: string): Response {
  return Response.json({ status: "error", code, message }, { status: httpStatus, headers });
}

export async function handleVoiceRequest(request: Request, dependencies?: VoiceDependencies): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...headers, Allow: "POST" } });
  const url = new URL(request.url);
  url.host = request.headers.get("host") ?? url.host;
  if (request.headers.get("origin") !== url.origin || request.headers.get("sec-fetch-site") === "cross-site") return error(400, "INVALID_REQUEST", "Submit a recording from the Hiraku page.");
  if (!/^multipart\/form-data(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return error(415, "UNSUPPORTED_CONTENT_TYPE", "Send a recorded question, or type it.");
  const deadline = AbortSignal.timeout(45000);
  const signal = AbortSignal.any([request.signal, deadline]);
  const reader = request.body?.getReader();
  if (!reader) return error(400, "INVALID_REQUEST", "Send one audio recording.");
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
      if (size > 1048576) { void reader.cancel().catch(() => {}); return error(413, "PAYLOAD_TOO_LARGE", "Record a shorter question, or type it."); }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
    signal.throwIfAborted();
    const fields = [...form.entries()];
    if (fields.length !== 1 || fields[0][0] !== "audio" || !(fields[0][1] instanceof File)) return error(400, "INVALID_REQUEST", "Send only one audio File field.");
    const audio = fields[0][1];
    if (audio.type !== "audio/wav") return error(415, "UNSUPPORTED_AUDIO", "Use the supported WAV recording format, or type your question.");
    const result = await getTranscript(new Uint8Array(await audio.arrayBuffer()), signal, dependencies);
    if (deadline.aborted) return error(504, "PROCESSING_TIMEOUT", "Transcription took too long. Try again when ready.");
    if (result.status === "error") {
      const { httpStatus, ...payload } = result;
      return Response.json(payload, { status: httpStatus, headers });
    }
    return Response.json(result, { headers });
  } catch {
    if (deadline.aborted && !request.signal.aborted) return error(504, "PROCESSING_TIMEOUT", "Transcription took too long. Try again when ready.");
    return error(400, "INVALID_REQUEST", "Send a valid recording, or ask again after cancellation.");
  } finally {
    signal.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}

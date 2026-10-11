import type { GuidanceSuccess } from "../guidance/guidance";

export type SpeechProvider = (answer: string, signal: AbortSignal) => Promise<Response>;

async function convertSpeech(answer: string, signal: AbortSignal): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  const voice = process.env.ELEVENLABS_VOICE_ID?.trim();
  if (!key || !voice || key.startsWith("<") || voice.startsWith("<")) throw new Error("Speech not configured");
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
    method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: answer, model_id: "eleven_flash_v2_5" }), signal, cache: "no-store", redirect: "error",
  });
}

export async function speakAnswer(answer: string, signal: AbortSignal, provider: SpeechProvider = convertSpeech): Promise<Pick<GuidanceSuccess, "audio" | "warning">> {
  const operation = AbortSignal.any([signal, AbortSignal.timeout(10000)]);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let rejectAbort: (() => void) | undefined;
  try {
    operation.throwIfAborted();
    const cancelled = new Promise<never>((_, reject) => {
      rejectAbort = () => { void reader?.cancel().catch(() => {}); reject(operation.reason); };
      operation.addEventListener("abort", rejectAbort, { once: true });
    });
    const pending = provider(answer, operation).then(response => {
      if (operation.aborted) void response.body?.cancel().catch(() => {});
      return response;
    });
    const response = await Promise.race([pending, cancelled]);
    operation.throwIfAborted();
    if (!response.ok || !/^audio\/mpeg(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")) {
      void response.body?.cancel().catch(() => {}); throw new Error("Invalid speech response");
    }
    reader = response.body?.getReader();
    if (!reader) throw new Error("Empty speech");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await Promise.race([reader.read(), cancelled]);
      operation.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > 2 * 1024 * 1024) { void reader.cancel().catch(() => {}); throw new Error("Speech too large"); }
      chunks.push(value);
    }
    if (!size) throw new Error("Empty speech");
    return { audio: { mimeType: "audio/mpeg", base64: Buffer.concat(chunks).toString("base64") }, warning: null };
  } catch {
    return { audio: null, warning: { code: "SPEECH_UNAVAILABLE", message: "Speech is unavailable. You can still read the answer and official sources." } };
  } finally {
    if (rejectAbort) operation.removeEventListener("abort", rejectAbort);
    reader?.releaseLock();
  }
}

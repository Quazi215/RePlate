import assert from "node:assert/strict";
import { test } from "node:test";
import { handleVoiceRequest } from "../src/lib/voice/request.server";
import { GET, POST } from "../src/app/api/voice/route";

function wav(samples = 16000): Uint8Array {
  const bytes = Buffer.alloc(44 + samples * 2);
  bytes.write("RIFF", 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(16000, 24); bytes.writeUInt32LE(32000, 28);
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write("data", 36);
  bytes.writeUInt32LE(samples * 2, 40);
  return bytes;
}

function request(bytes = wav(), signal?: AbortSignal, mime = "audio/wav"): Request {
  const form = new FormData();
  form.append("audio", new Blob([Uint8Array.from(bytes)], { type: mime }), "question.wav");
  return new Request("http://localhost/api/voice", { method: "POST", headers: { Origin: "http://localhost" }, body: form, signal });
}

test("recorded question returns only an editable transcript without generating guidance", async () => {
  let calls = 0;
  const response = await handleVoiceRequest(request(wav(480000)), {
    transcribe: async (audio) => { assert.equal(audio.length, 960044); calls++; return JSON.stringify("What is SNAP?"); },
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result, { status: "ready", transcript: "What is SNAP?" });
  assert.equal(calls, 1);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("invalid WAV, MIME, multipart fields and actual streamed limits avoid paid calls", async () => {
  let calls = 0;
  const dependencies = { transcribe: async () => { calls++; return '"What is SNAP?"'; } };
  const stereo = Buffer.from(wav()); stereo.writeUInt16LE(2, 22);
  const wrongSize = Buffer.from(wav()); wrongSize.writeUInt32LE(10, 40);
  for (const [bytes, status, code] of [
    [wav(480001), 400, "AUDIO_TOO_LONG"], [wav(0), 400, "EMPTY_AUDIO"],
    [new Uint8Array(10), 415, "UNSUPPORTED_AUDIO"], [stereo, 415, "UNSUPPORTED_AUDIO"],
    [wrongSize, 415, "UNSUPPORTED_AUDIO"], [wav().slice(0, -1), 415, "UNSUPPORTED_AUDIO"],
  ] as const) {
    const response = await handleVoiceRequest(request(bytes), dependencies);
    assert.equal(response.status, status); assert.equal((await response.json()).code, code);
  }
  assert.equal((await handleVoiceRequest(request(wav(), undefined, "audio/webm"), dependencies)).status, 415);
  for (const field of ["audio", "question"]) {
    const form = new FormData(); form.append("audio", new Blob([Uint8Array.from(wav())], { type: "audio/wav" }), "a.wav");
    form.append(field, "extra");
    const input = new Request("http://localhost/api/voice", { method: "POST", headers: { Origin: "http://localhost" }, body: form });
    assert.equal((await handleVoiceRequest(input, dependencies)).status, 400);
  }
  for (const length of [undefined, "1"]) {
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(600000)); controller.enqueue(new Uint8Array(600000)); controller.close(); } });
    const input = new Request("http://localhost/api/voice", { method: "POST",
      headers: { Origin: "http://localhost", "Content-Type": "multipart/form-data; boundary=x", ...(length ? { "Content-Length": length } : {}) },
      body: stream, duplex: "half",
    } as RequestInit);
    assert.equal((await handleVoiceRequest(input, dependencies)).status, 413);
  }
  const foreign = request(); foreign.headers.set("origin", "https://elsewhere.example");
  assert.equal((await handleVoiceRequest(foreign, dependencies)).status, 400);
  assert.equal(calls, 0);
});

test("silence and invalid transcripts return recoverable errors without a usable question", async () => {
  for (const [text, status, code] of [
    [JSON.stringify(" "), 422, "NO_SPEECH"], [JSON.stringify("x".repeat(2001)), 422, "TRANSCRIPT_TOO_LONG"],
    [undefined, 502, "INVALID_PROVIDER_RESPONSE"], ["not JSON", 502, "INVALID_PROVIDER_RESPONSE"],
    [JSON.stringify({ transcript: "Question?" }), 502, "INVALID_PROVIDER_RESPONSE"],
    [JSON.stringify("<script>secret</script>"), 502, "INVALID_PROVIDER_RESPONSE"],
  ] as const) {
    const response = await handleVoiceRequest(request(), { transcribe: async () => text });
    assert.equal(response.status, status); assert.equal((await response.json()).code, code);
  }
});

test("provider quota, failure, missing configuration and methods have safe responses", async () => {
  for (const [failure, status, code] of [
    [{ status: 429, message: "secret" }, 429, "SERVICE_BUSY"], [new Error("secret"), 502, "TRANSCRIPTION_FAILED"],
    [new DOMException("secret", "TimeoutError"), 504, "PROCESSING_TIMEOUT"],
  ] as const) {
    const response = await handleVoiceRequest(request(), { transcribe: async () => { throw failure; } });
    assert.equal(response.status, status);
    const result = await response.json(); assert.equal(result.code, code);
    assert.doesNotMatch(JSON.stringify(result), /secret/); assert.equal(result.transcript, undefined);
  }
  const previous = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    assert.equal((await POST(request())).status, 503);
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous;
  }
  const response = await GET(new Request("http://localhost/api/voice"));
  assert.equal(response.status, 405); assert.equal(response.headers.get("allow"), "POST");
});

test("cancellation discards the transcript and releases a pending upload read", async () => {
  const controller = new AbortController(); let calls = 0;
  const response = await handleVoiceRequest(request(wav(), controller.signal), {
    transcribe: async (_, signal) => { controller.abort(); assert.equal(signal.aborted, true); return new Promise(() => {}); },
  });
  assert.equal(response.status, 400); assert.equal(calls, 0);
  const bodyController = new AbortController(); let cancelled = false;
  const stream = new ReadableStream({ cancel() { cancelled = true; } });
  const pending = handleVoiceRequest(new Request("http://localhost/api/voice", {
    method: "POST", headers: { Origin: "http://localhost", "Content-Type": "multipart/form-data; boundary=x" },
    body: stream, signal: bodyController.signal, duplex: "half",
  } as RequestInit), { transcribe: async () => { calls++; return '"Question?"'; } });
  bodyController.abort();
  assert.equal((await pending).status, 400); assert.equal(cancelled, true); assert.equal(calls, 0);
});

test("transcription has a 15-second deadline even when a provider ignores cancellation", async () => {
  const keepAlive = setInterval(() => {}, 1000); let providerSignal: AbortSignal | undefined;
  try {
    const response = await handleVoiceRequest(request(), {
      transcribe: async (_, signal) => { providerSignal = signal; return new Promise(() => {}); },
    });
    assert.equal(response.status, 504); assert.equal((await response.json()).code, "PROCESSING_TIMEOUT");
    assert.equal(providerSignal?.aborted, true);
  } finally { clearInterval(keepAlive); }
});

test("total server deadline bounds a stalled upload before transcription", async () => {
  const keepAlive = setInterval(() => {}, 1000);
  let calls = 0, cancelled = false;
  try {
    const stream = new ReadableStream({ cancel() { cancelled = true; } });
    const response = await handleVoiceRequest(new Request("http://localhost/api/voice", {
      method: "POST", headers: { Origin: "http://localhost", "Content-Type": "multipart/form-data; boundary=x" }, body: stream, duplex: "half",
    } as RequestInit), { transcribe: async () => { calls++; return '"What is SNAP?"'; } });
    assert.equal(response.status, 504);
    const result = await response.json();
    assert.equal(result.code, "PROCESSING_TIMEOUT");
    assert.equal(result.transcript, undefined); assert.equal(calls, 0); assert.equal(cancelled, true);
  } finally { clearInterval(keepAlive); }
});

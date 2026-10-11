import assert from "node:assert/strict";
import { test } from "node:test";
import { handleGuidanceRequest } from "../src/lib/guidance/request.server";
import { getGuidance } from "../src/lib/guidance/guidance.server";
import { GET, POST } from "../src/app/api/guidance/route";

test("typed guidance returns plain text with server-resolved official citations", async () => {
  const response = await handleGuidanceRequest(new Request("http://localhost/api/guidance", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost" },
    body: JSON.stringify({ question: "  What is SNAP?  " }),
  }), async (question) => {
    assert.equal(question, "What is SNAP?");
    return JSON.stringify({ answer: "SNAP helps people buy groceries using an EBT card. HRA makes official eligibility decisions.", sourceIds: ["nyc-snap"] });
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ready", answer: "SNAP helps people buy groceries using an EBT card. HRA makes official eligibility decisions.",
    sources: [{ id: "nyc-snap", title: "NYC SNAP benefits and application steps", url: "https://www.nyc.gov/main/services/snap-benefits", reviewedAt: "2026-10-10" }],
  });
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

function request(body: string, headers: Record<string, string> = {}, signal?: AbortSignal): Request {
  return new Request("http://localhost/api/guidance", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost", ...headers }, body, signal,
  });
}

test("invalid shapes, duplicate fields, and actual byte limits reject before a paid call", async () => {
  let calls = 0;
  const provider = async () => { calls++; return ""; };
  const cases = [
    ["not json", 400], ["null", 400], ["[]", 400], ['{"question":42}', 400],
    ['{"question":""}', 400], ['{"question":"   "}', 400],
    [JSON.stringify({ question: "x".repeat(2001) }), 400],
    ['{"question":"SNAP?","extra":"no"}', 400],
    ['{"question":"SNAP?","question":"apply?"}', 400],
    ['{"question":"SNAP?","\\u0071uestion":"apply?"}', 400],
    [JSON.stringify({ question: "食".repeat(6000) }), 413],
  ] as const;
  for (const [body, status] of cases) assert.equal((await handleGuidanceRequest(request(body), provider)).status, status);
  assert.equal((await handleGuidanceRequest(request('{"question":"SNAP?"}', { Origin: "https://elsewhere.example" }), provider)).status, 400);
  assert.equal((await handleGuidanceRequest(request('{"question":"SNAP?"}', { "Content-Type": "text/plain" }), provider)).status, 415);
  for (const length of [undefined, "1"]) {
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(9000)); controller.enqueue(new Uint8Array(9000)); controller.close(); } });
    const streamed = new Request("http://localhost/api/guidance", {
      method: "POST", headers: { Origin: "http://localhost", "Content-Type": "application/json", ...(length ? { "Content-Length": length } : {}) },
      body: stream, duplex: "half",
    } as RequestInit);
    assert.equal((await handleGuidanceRequest(streamed, provider)).status, 413);
  }
  assert.equal(calls, 0);
});

test("answers and citation IDs are validated, never accepting model URLs or extra fields", async () => {
  const cases: unknown[] = [null, { answer: "", sourceIds: ["nyc-snap"] },
    { answer: "x".repeat(1501), sourceIds: ["nyc-snap"] },
    { answer: "<a>apply</a>", sourceIds: ["nyc-snap"] },
    { answer: "Go to https://evil.example", sourceIds: ["nyc-snap"] },
    { answer: "Apply with HRA.", sourceIds: [] },
    { answer: "Apply with HRA.", sourceIds: ["invented"] },
    { answer: "Apply with HRA.", sourceIds: ["nyc-snap", "nyc-snap"] },
    { answer: "Apply with HRA.", sourceIds: ["nyc-snap"], url: "https://evil.example" }];
  for (const value of cases) {
    const response = await handleGuidanceRequest(request('{"question":"How do I apply?"}'), async () => JSON.stringify(value));
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, "INVALID_PROVIDER_RESPONSE");
  }
});

test("configuration, provider failures, timeout and cancellation have safe recoverable errors", async () => {
  for (const [providerError, status, code] of [
    [{ status: 429, message: "secret provider details" }, 429, "SERVICE_BUSY"],
    [new DOMException("secret", "TimeoutError"), 504, "PROCESSING_TIMEOUT"],
    [new Error("private request and secret"), 502, "GUIDANCE_FAILED"],
  ] as const) {
    const response = await handleGuidanceRequest(request('{"question":"What is SNAP?"}'), async () => { throw providerError; });
    assert.equal(response.status, status);
    const body = await response.json();
    assert.equal(body.code, code);
    assert.doesNotMatch(JSON.stringify(body), /secret|private request/);
  }
  const controller = new AbortController();
  const result = getGuidance("What is SNAP?", controller.signal, async (_, signal) => {
    controller.abort();
    assert.equal(signal.aborted, true);
    return new Promise(() => {});
  });
  assert.equal((await result).status, "error");
  let calls = 0;
  await getGuidance("What is SNAP?", controller.signal, async () => { calls++; return ""; });
  assert.equal(calls, 0);
  const previous = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    const response = await POST(request('{"question":"What is SNAP?"}'));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "GUIDANCE_UNAVAILABLE");
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
  const method = await GET(new Request("http://localhost/api/guidance"));
  assert.equal(method.status, 405);
  assert.equal(method.headers.get("allow"), "POST");
});

test("a provider that never completes is bounded by the guidance deadline", async () => {
  const keepAlive = setInterval(() => {}, 1000);
  let providerSignal: AbortSignal | undefined;
  try {
    const response = await handleGuidanceRequest(request('{"question":"What is SNAP?"}'), async (_, signal) => {
      providerSignal = signal;
      return new Promise(() => {});
    });
    assert.equal(response.status, 504);
    assert.equal((await response.json()).code, "PROCESSING_TIMEOUT");
    assert.equal(providerSignal?.aborted, true);
  } finally { clearInterval(keepAlive); }
});

test("same-origin checks use the incoming host when Next constructs an internal URL", async () => {
  const response = await handleGuidanceRequest(new Request("http://localhost:3019/api/guidance", {
    method: "POST", headers: { "Content-Type": "application/json", Host: "127.0.0.1:3019", Origin: "http://127.0.0.1:3019" },
    body: '{"question":"What is SNAP?"}',
  }), async () => JSON.stringify({ answer: "SNAP helps people buy groceries.", sourceIds: ["nyc-snap"] }));
  assert.equal(response.status, 200);
});

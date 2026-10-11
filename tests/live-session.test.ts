import assert from "node:assert/strict";
import { test } from "node:test";
import type { GuidanceSuccess } from "../src/lib/guidance/guidance";
import { LiveSession, requestScreeningGreeting, type LiveAnswerProvider } from "../src/lib/voice/live-session";

const answer: GuidanceSuccess = { status: "ready", answer: "HRA decides eligibility.", sources: [] };

test("live requests carry language and screening together for questions and greetings", async context => {
  const payloads: unknown[] = [];
  context.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    payloads.push(JSON.parse(init.body as string));
    return Response.json(answer);
  });
  const screening = { allAssistance: "yes" } as const;
  const session = new LiveSession(() => {}, undefined, { screening, spoken: false, locale: "es" });
  await session.ask("Why this result?");
  await requestScreeningGreeting(screening, new AbortController().signal, "es");
  assert.deepEqual(payloads, [
    { question: "Why this result?", history: [], screening, spoken: false, locale: "es" },
    { history: [], screening, greeting: true, locale: "es" },
  ]);
  session.close();
});

test("a newer turn cancels and discards a late answer, while keeping session context", async () => {
  let finish!: (answer: GuidanceSuccess) => void;
  let firstSignal!: AbortSignal;
  let calls = 0;
  const session = new LiveSession(() => {}, async (_, history, signal) => {
    calls++;
    if (calls === 1) { firstSignal = signal; return new Promise(resolve => { finish = resolve; }); }
    assert.deepEqual(history, [{ role: "user", text: "First question" }]);
    return answer;
  });
  const first = session.ask("First question");
  assert.equal(await session.ask("Follow-up"), answer);
  assert.equal(firstSignal.aborted, true);
  finish(answer); assert.equal(await first, null);
});

test("checked answers survive interruption in the transcript and inform follow-ups", async () => {
  let interrupted = false;
  let calls = 0;
  const session = new LiveSession(turns => { interrupted = !!turns[0].interrupted; }, async (_, history) => {
    if (++calls === 2) assert.deepEqual(history, [
      { role: "user", text: "SNAP?" }, { role: "assistant", text: answer.answer },
    ]);
    return answer;
  });
  await session.ask("SNAP?"); session.interrupt(true);
  assert.equal(interrupted, true); await session.ask("What does that mean?");
});

test("ending aborts pending work, discards late output, and prevents any new call", async () => {
  let finish!: (answer: GuidanceSuccess) => void;
  let signal!: AbortSignal;
  let changes = 0;
  const session = new LiveSession(() => { changes++; }, async (_, __, operation) => {
    signal = operation; return new Promise(resolve => { finish = resolve; });
  });
  const pending = session.ask("SNAP?"); session.close();
  assert.equal(signal.aborted, true); finish(answer);
  assert.equal(await pending, null); assert.equal(await session.ask("Again?"), null); assert.equal(changes, 1);
});

test("empty transcripts make no request and oversized speech is rejected", async () => {
  let calls = 0;
  const session = new LiveSession(() => {}, async () => { calls++; return answer; });
  assert.equal(await session.ask("  "), null);
  await assert.rejects(session.ask("x".repeat(2001)), /too long/); assert.equal(calls, 0);
});

test("each follow-up carries its screening snapshot and text mode, while a new session has no old history", async () => {
  const screening = { allAssistance: "yes" } as const;
  const options = { screening, spoken: false, locale: "es" } as const;
  let calls = 0;
  const provider: LiveAnswerProvider = async (_, history, __, received) => {
    assert.deepEqual(received, options);
    if (++calls === 1 || calls === 3) assert.deepEqual(history, []);
    else assert.equal(history.length, 2);
    return answer;
  };
  const session = new LiveSession(() => {}, provider, options);
  await session.ask("Why this result?"); await session.ask("What next?"); session.close();
  await new LiveSession(() => {}, provider, options).ask("Explain again");
});

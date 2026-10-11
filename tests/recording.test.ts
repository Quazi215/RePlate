import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { recordQuestion } from "../src/lib/voice/recording";

function microphone(t: TestContext) {
  let stopped = false;
  let disconnected = false;
  let closed = false;
  let connected: unknown;
  const analyser = { fftSize: 0, disconnect() {} };
  const stream = { getTracks: () => [{ stop() { stopped = true; } }] };
  class Context {
    state = "running";
    async resume() {}
    createAnalyser() { return analyser; }
    createMediaStreamSource() {
      return { connect(node: unknown) { connected = node; }, disconnect() { disconnected = true; } };
    }
    async decodeAudioData() { return { length: 1600, duration: .1 }; }
    async close() { this.state = "closed"; closed = true; }
  }
  class Recorder {
    static isTypeSupported() { return true; }
    state = "inactive";
    mimeType = "audio/webm";
    ondataavailable?: (event: { data: Blob }) => void;
    onstop?: () => void;
    start() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["recording"]) });
      this.onstop?.();
    }
  }
  class OfflineContext {
    destination = {};
    createBufferSource() { return { buffer: null, connect() {}, start() {} }; }
    async startRendering() { return { getChannelData: () => new Float32Array(1600) }; }
  }
  const mediaDevices = { getUserMedia: async () => stream };
  const replacements = {
    isSecureContext: true, navigator: { mediaDevices },
    window: { MediaRecorder: Recorder, AudioContext: Context, OfflineAudioContext: OfflineContext },
    MediaRecorder: Recorder, AudioContext: Context, OfflineAudioContext: OfflineContext,
  };
  for (const [name, value] of Object.entries(replacements)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  return { analyser, mediaDevices, stream, cleaned: () => stopped && disconnected && closed, connected: () => connected, stopped: () => stopped };
}

test("recording exposes its microphone analyser and stop still produces canonical WAV", async t => {
  const mic = microphone(t);
  const controller = new AbortController();
  t.after(() => controller.abort());
  const recording = recordQuestion(controller.signal, analyser => {
    assert.equal(analyser, mic.analyser);
    assert.equal(analyser.fftSize, 256);
    assert.equal(mic.connected(), analyser);
  }, () => {}, () => {});
  await new Promise(resolve => setImmediate(resolve));
  recording.stop();
  const audio = await recording.audio;
  assert.equal(audio.type, "audio/wav");
  const bytes = new DataView(await audio.arrayBuffer());
  assert.equal(bytes.getUint32(24, true), 16000);
  assert.equal(bytes.getUint16(22, true), 1);
  assert.equal(mic.cleaned(), true);
});

test("cancelling recording releases the microphone and analyser without preparing audio", async t => {
  const mic = microphone(t);
  const controller = new AbortController();
  const recording = recordQuestion(controller.signal, () => {}, () => {}, () => assert.fail("cancel must not prepare"));
  const rejected = assert.rejects(recording.audio, { name: "AbortError" });
  await new Promise(resolve => setImmediate(resolve));
  controller.abort();
  await rejected;
  assert.equal(mic.cleaned(), true);
});

test("cancelling while permission is pending stops a late microphone stream", async t => {
  const mic = microphone(t);
  let grant!: (stream: typeof mic.stream) => void;
  mic.mediaDevices.getUserMedia = () => new Promise(resolve => { grant = resolve; });
  const controller = new AbortController();
  const recording = recordQuestion(controller.signal, () => assert.fail("cancelled recording must not start"), () => {}, () => {});
  const rejected = assert.rejects(recording.audio, { name: "AbortError" });
  controller.abort(); grant(mic.stream);
  await rejected;
  assert.equal(mic.stopped(), true);
});

test("denied microphone access leaves a useful error and never starts analysis", async t => {
  const mic = microphone(t);
  mic.mediaDevices.getUserMedia = async () => { throw new DOMException("denied", "NotAllowedError"); };
  const recording = recordQuestion(new AbortController().signal, () => assert.fail("denied recording must not start"), () => {}, () => {});
  await assert.rejects(recording.audio, /Microphone permission denied/);
  assert.equal(mic.connected(), undefined);
});

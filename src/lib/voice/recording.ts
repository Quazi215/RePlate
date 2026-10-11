function encodeWav(samples: Float32Array): Blob {
  if (!samples.length || samples.length > 480000) throw new Error("Record a question no longer than 30 seconds, or type it.");
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  text(0, "RIFF"); view.setUint32(4, bytes.byteLength - 8, true); text(8, "WAVEfmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => {
    const clipped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + index * 2, Math.round(clipped * (clipped < 0 ? 32768 : 32767)), true);
  });
  return new Blob([bytes], { type: "audio/wav" });
}

export function recordQuestion(signal: AbortSignal, onRecording: (analyser: AnalyserNode) => void, onSeconds: (seconds: number) => void, onPreparing: (automatic: boolean) => void): { stop: () => void; audio: Promise<Blob> } {
  if (!isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder || !window.AudioContext || !window.OfflineAudioContext) {
    throw new Error("This browser cannot record here. Use desktop Chrome on localhost or HTTPS, or type your question.");
  }
  let stream: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  let context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let analyser: AnalyserNode | undefined;
  let clock: ReturnType<typeof setInterval> | undefined;
  let limit: ReturnType<typeof setTimeout> | undefined;
  let chunks: Blob[] = [];
  let size = 0;
  let settled = false;
  let automatic = false;
  let resolveAudio: (audio: Blob) => void;
  let rejectAudio: (error: unknown) => void;
  const audio = new Promise<Blob>((resolve, reject) => { resolveAudio = resolve; rejectAudio = reject; });

  function cleanup() {
    clearInterval(clock); clearTimeout(limit);
    source?.disconnect(); analyser?.disconnect();
    stream?.getTracks().forEach(track => track.stop());
    if (recorder?.state === "recording") recorder.stop();
    if (context && context.state !== "closed") void context.close().catch(() => { console.error("Microphone audio context cleanup failed."); });
    chunks = [];
  }

  function finish(error?: unknown, blob?: Blob) {
    if (settled) return;
    settled = true;
    signal.removeEventListener("abort", abort);
    cleanup();
    if (error !== undefined) rejectAudio(error); else resolveAudio(blob!);
  }

  function abort() { finish(signal.reason); }
  function stop() {
    if (settled || recorder?.state !== "recording") return;
    clearInterval(clock); clearTimeout(limit);
    onPreparing(automatic);
    recorder.stop(); stream?.getTracks().forEach(track => track.stop());
  }

  async function prepare() {
    if (settled) return;
    try {
      signal.throwIfAborted();
      const blob = new Blob(chunks, { type: recorder!.mimeType }); chunks = [];
      if (!blob.size || blob.size > 2 * 1024 * 1024) throw new Error("Recording is empty or too large. Record a shorter question, or type it.");
      const decoded = await context!.decodeAudioData(await blob.arrayBuffer());
      signal.throwIfAborted();
      if (!decoded.length || decoded.duration > 30) throw new Error("Recording exceeds 30 seconds. Record a shorter question, or type it.");
      const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
      const source = offline.createBufferSource(); source.buffer = decoded; source.connect(offline.destination); source.start();
      const normalized = await offline.startRendering();
      signal.throwIfAborted();
      finish(undefined, encodeWav(normalized.getChannelData(0)));
    } catch (error) {
      finish(signal.aborted ? signal.reason : new Error(error instanceof Error && error.name === "Error" ? error.message : "Recording could not be prepared. Try again or type your question."));
    }
  }

  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  else void (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (settled || signal.aborted) { cleanup(); return; }
      context = new AudioContext(); await context.resume();
      if (settled || signal.aborted) { cleanup(); return; }
      analyser = context.createAnalyser(); analyser.fftSize = 256;
      source = context.createMediaStreamSource(stream); source.connect(analyser);
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(value => MediaRecorder.isTypeSupported(value));
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorder.ondataavailable = event => {
        if (settled) return;
        size += event.data.size;
        if (size > 2 * 1024 * 1024) { finish(new Error("Recording is too large. Record a shorter question, or type it.")); return; }
        chunks.push(event.data);
      };
      recorder.onerror = () => finish(new Error("Microphone recording failed. Try again or type your question."));
      recorder.onstop = () => { void prepare(); };
      recorder.start(250); onRecording(analyser);
      const started = performance.now();
      clock = setInterval(() => onSeconds(Math.min(30, Math.floor((performance.now() - started) / 1000))), 250);
      limit = setTimeout(() => { automatic = true; stop(); }, 30000);
    } catch (error) {
      finish(new Error(error instanceof DOMException && error.name === "NotAllowedError" ? "Microphone permission denied. Allow access to retry, or type your question." : "Microphone unavailable. Try again or type your question."));
    }
  })();
  return { stop, audio };
}

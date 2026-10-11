"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { GuidanceSuccess } from "../../lib/guidance/guidance";
import { recordQuestion } from "../../lib/voice/recording";
import brand from "../site.module.css";
import styles from "./guidance.module.css";

export default function GuidanceJourney() {
  const [consented, setConsented] = useState(false);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<GuidanceSuccess | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [spoken, setSpoken] = useState(false);
  const playback = useRef<HTMLAudioElement>(null);
  const stopRecording = useRef<(() => void) | null>(null);
  const active = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  function clear() {
    playback.current?.pause(); setSpoken(false);
    active.current?.abort();
    active.current = null;
    stopRecording.current = null;
    setQuestion(""); setResult(null); setBusy(false); setMessage(""); setStage(""); setSeconds(0);
  }

  useEffect(() => {
    const leave = () => {
      playback.current?.pause(); setSpoken(false);
      active.current?.abort(); active.current = null;
      stopRecording.current = null;
      setQuestion(""); setResult(null); setBusy(false); setMessage(""); setConsented(false); setStage(""); setSeconds(0);
    };
    const visibility = () => { if (document.visibilityState === "hidden") leave(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", leave);
    return () => {
      active.current?.abort(); active.current = null;
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", leave);
    };
  }, []);

  useEffect(() => {
    const player = playback.current;
    if (!result?.audio || !player) return;
    let current = true;
    let url: string | undefined;
    try {
      const bytes = Uint8Array.from(atob(result.audio.base64), char => char.charCodeAt(0));
      url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      player.src = url;
      void player.play().catch(() => { if (current) setMessage("Automatic playback could not start. Choose Play to listen; the written answer is ready."); });
    } catch {
      queueMicrotask(() => { if (current) setMessage("Audio could not load. You can still read the answer and official sources."); });
    }
    return () => {
      current = false; player.pause(); player.removeAttribute("src"); player.load();
      if (url) URL.revokeObjectURL(url);
    };
  }, [result]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consented || active.current) return;
    const trimmed = question.trim();
    if (!trimmed || trimmed.length > 2000) { setMessage("Ask a question between 1 and 2,000 characters."); return; }
    playback.current?.pause();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setResult(null); setMessage(""); setStage("Preparing your answer…");
    try {
      const response = await fetch("/api/guidance", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ question: trimmed, ...(spoken ? { spoken: true } : {}) }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(50000)]),
      });
      if (active.current !== controller) return;
      if (response.status === 413) throw new Error("Type a shorter question and try again.");
      const body = await response.json();
      if (active.current !== controller) return;
      if (!response.ok || body.status !== "ready") {
        throw new Error(body.status === "error" && typeof body.message === "string" ? body.message : "Shosai is unavailable. Use the official links below or try again.");
      }
      if (typeof body.answer !== "string" || !Array.isArray(body.sources)) throw new Error("Shosai could not provide a checked answer. Try again.");
      setResult(body); setQuestion(""); setSpoken(false);
    } catch (error) {
      if (active.current !== controller) return;
      setMessage(error instanceof Error && error.name === "TimeoutError" ? "Preparing your answer took too long. Try again when ready." :
        error instanceof Error && error.name === "Error" ? error.message : "Shosai could not connect. Use the official links below or try again.");
    } finally {
      if (active.current === controller) { active.current = null; setBusy(false); setStage(""); }
    }
  }

  async function startVoice() {
    if (!consented || active.current) return;
    playback.current?.pause(); setSpoken(false);
    const controller = new AbortController(); active.current = controller;
    setBusy(true); setQuestion(""); setResult(null); setMessage(""); setSeconds(0); setStage("Waiting for microphone permission…");
    try {
      const recording = recordQuestion(controller.signal,
        () => { if (active.current === controller) setStage("Recording your question…"); },
        value => { if (active.current === controller) setSeconds(value); },
        automatic => {
          if (active.current !== controller) return;
          stopRecording.current = null;
          setStage(automatic ? "30-second limit reached. Preparing audio…" : "Preparing audio…");
        });
      stopRecording.current = recording.stop;
      const audio = await recording.audio;
      if (active.current !== controller) return;
      stopRecording.current = null; setStage("Transcribing your question…");
      const form = new FormData(); form.append("audio", audio, "question.wav");
      const response = await fetch("/api/voice", { method: "POST", body: form, cache: "no-store",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(50000)]) });
      if (active.current !== controller) return;
      if (response.status === 413) throw new Error("Record a shorter question, or type it.");
      const body = await response.json().catch(() => { throw new Error("Shosai is unavailable. Try again or type your question."); });
      if (active.current !== controller) return;
      if (!response.ok || body.status !== "ready") throw new Error(body.status === "error" && typeof body.message === "string" ? body.message : "Shosai is unavailable. Try again or type your question.");
      if (typeof body.transcript !== "string" || !body.transcript.trim() || body.transcript.length > 2000) throw new Error("Shosai could not provide a checked transcript. Try again or type your question.");
      setQuestion(body.transcript);
      setSpoken(true);
      setStage("Question transcribed. Edit it if needed, then choose Ask Shosai.");
      requestAnimationFrame(() => input.current?.focus());
    } catch (error) {
      if (active.current !== controller) return;
      setMessage(error instanceof Error && error.name === "TimeoutError" ? "Transcription took too long. Record again or type your question." :
        error instanceof Error && error.name === "Error" ? error.message : "Shosai could not connect. Try again or type your question.");
      setStage("");
    } finally {
      if (active.current === controller) { active.current = null; stopRecording.current = null; setBusy(false); }
    }
  }

  return <section id="shosai" className={styles.panel} aria-labelledby="shosai-title">
    <p className={styles.eyebrow}>General NYC SNAP guidance · English</p>
    <h2 id="shosai-title">Talk to Shosai</h2>
    <p>Record or type a general question about SNAP, applying in NYC, household or income terms, or using our screening tool. Recorded questions also receive a spoken answer when speech is available.</p>
    {!consented ? <div className={styles.disclosure}>
      <h3>Before you ask</h3>
      <p>Your recorded audio is sent to Google Gemini for transcription. Review or edit the text, then choose Ask Shosai to send your question for an AI answer. For recorded questions, that written answer is sent to ElevenLabs to create speech. Typed questions stay text-only. Hiraku keeps recordings, questions, answers, and speech only in page memory and clears them when you leave or background this page. Google and ElevenLabs may retain submissions under their own policies. Cancelling cannot retract content already sent or undo provider billing. Microphone access is requested only when you choose Start recording.</p>
      <p>Do not share names, addresses, Social Security numbers, case numbers, documents, or private case details. We cannot guarantee automatic redaction. Use fictional, general questions for this local demo.</p>
      <p>Shosai gives general information and may make mistakes. HRA decides eligibility. Your screening answers are never sent to Shosai. <a href="https://ai.google.dev/gemini-api/terms" referrerPolicy="no-referrer">Read Google’s processing terms ↗</a>. <a href="https://elevenlabs.io/privacy-policy" referrerPolicy="no-referrer">Read ElevenLabs’ privacy policy ↗</a>.</p>
      <button type="button" className={brand.primary} onClick={() => {
        setConsented(true);
        requestAnimationFrame(() => input.current?.focus());
      }}>I agree — ask Shosai</button>
    </div> : <><div className={styles.form}>
      <p>Record up to 30 seconds in English. Stop transcribes into the question box; review or edit it before choosing Ask Shosai. Cancel discards the recording. Longer questions are excluded to bound cost and waiting time. Voice capture was checked in desktop Chrome; Android and iPhone support are unverified. You can always type instead.</p>
      <div className={styles.actions}>
        <button type="button" className={brand.primary} disabled={busy} onClick={() => { void startVoice(); }}>Start recording</button>
        {stage === "Recording your question…" && <button type="button" className={brand.primary} onClick={() => stopRecording.current?.()}>Stop recording</button>}
      </div>
      {stage === "Recording your question…" && <p aria-live="off">Recording: {seconds} / 30 seconds</p>}
    </div><form onSubmit={submit} className={styles.form}>
      <label htmlFor="shosai-question">Your general SNAP question</label>
      <textarea id="shosai-question" ref={input} value={question} onChange={event => setQuestion(event.target.value)}
        maxLength={2000} required rows={3} disabled={busy} aria-describedby="shosai-question-help" autoComplete="off" />
      <p id="shosai-question-help">Up to 2,000 characters. Leave out identifiers and private case details. Each question starts fresh.</p>
      <div className={styles.actions}>
        <button className={brand.primary} disabled={busy} type="submit">Ask Shosai</button>
        <button className={brand.secondary} type="button" onClick={() => { clear(); if (busy) setMessage("Question cancelled. Ask again when ready."); input.current?.focus(); }}>{busy ? "Cancel question" : "Clear question and answer"}</button>
      </div>
    </form></>}
    <p role="status" aria-live="polite">{result ? "Your answer is ready." : stage}</p>
    {message && <p role="alert">{message}</p>}
    {result && <div className={styles.answer}>
      <h3>Shosai’s answer</h3><p>{result.answer}</p>
      {result.warning && <p role="status">{result.warning.message}</p>}
      {result.audio && <>
        <audio ref={playback} controls preload="auto" aria-label="Shosai’s spoken answer" onError={() => setMessage("Audio playback failed. Try Play again, or read the answer and official sources.")} />
        <button type="button" className={brand.secondary} onClick={() => {
          const player = playback.current;
          if (!player) return;
          player.currentTime = 0;
          void player.play().catch(() => { if (playback.current === player) setMessage("Audio playback could not start. Use the audio controls or read the answer."); });
        }}>Replay answer</button>
      </>}
      <h3>Official sources</h3>
      <ul>{result.sources.map(source => <li key={source.id}><a href={source.url} referrerPolicy="no-referrer">{source.title} ↗</a> <span>Reviewed <time dateTime={source.reviewedAt}>{source.reviewedAt}</time></span></li>)}</ul>
      <p>General guidance, not an eligibility decision. Check official sources before acting.</p>
    </div>}
  </section>;
}

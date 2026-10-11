"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import type { GuidanceSuccess } from "../../lib/guidance/guidance";
import { useLocale } from "../../lib/i18n/client";
import { nativeNames, speechCodes } from "../../lib/i18n/locale";
import { recordQuestion } from "../../lib/voice/recording";
import brand from "../site.module.css";
import styles from "./guidance.module.css";
import VoiceInput from "./components/voice-input";
const LiveConversation = dynamic(() => import("./live-conversation"), {
  ssr: false, loading: () => <p role="status">Opening conversation…</p>,
});

export default function GuidanceJourney() {
  const { locale } = useLocale();
  const [consented, setConsented] = useState(false);
  return <GuidanceSession key={locale} consented={consented} setConsented={setConsented} />;
}

function GuidanceSession({ consented, setConsented }: { consented: boolean; setConsented: (consented: boolean) => void }) {
  const { locale, t, dynamic } = useLocale();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<GuidanceSuccess | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [spoken, setSpoken] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const liveButton = useRef<HTMLButtonElement>(null);
  const playback = useRef<HTMLAudioElement>(null);
  const stopRecording = useRef<(() => void) | null>(null);
  const active = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  function clear() {
    playback.current?.pause(); setSpoken(false);
    active.current?.abort();
    active.current = null;
    stopRecording.current = null;
    setAnalyser(null);
    setQuestion(""); setResult(null); setBusy(false); setMessage(""); setStage(""); setSeconds(0);
  }

  useEffect(() => {
    const leave = () => {
      playback.current?.pause(); setSpoken(false);
      active.current?.abort(); active.current = null;
      stopRecording.current = null;
      setAnalyser(null);
      setQuestion(""); setResult(null); setBusy(false); setMessage(""); setConsented(false); setStage(""); setSeconds(0);
      setLiveOpen(false); setLiveActive(false);
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
  }, [setConsented]);

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
    if (!consented || active.current || liveActive) return;
    const trimmed = question.trim();
    if (!trimmed || trimmed.length > 2000) { setMessage("Ask a question between 1 and 2,000 characters."); return; }
    playback.current?.pause();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setResult(null); setMessage(""); setStage("Preparing your answer…");
    try {
      const response = await fetch("/api/guidance", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ question: trimmed, locale, ...(spoken ? { spoken: true } : {}) }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(50000)]),
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
    if (!consented || active.current || liveActive || !speechCodes[locale]) return;
    playback.current?.pause(); setSpoken(false);
    const controller = new AbortController(); active.current = controller;
    setBusy(true); setQuestion(""); setResult(null); setMessage(""); setSeconds(0); setStage("Waiting for microphone permission…");
    try {
      const recording = recordQuestion(controller.signal,
        node => { if (active.current === controller) { setAnalyser(node); setStage("Recording your question…"); } },
        value => { if (active.current === controller) setSeconds(value); },
        automatic => {
          if (active.current !== controller) return;
          stopRecording.current = null;
          setAnalyser(null);
          setStage(automatic ? "30-second limit reached. Preparing audio…" : "Preparing audio…");
        });
      stopRecording.current = recording.stop;
      const audio = await recording.audio;
      if (active.current !== controller) return;
      stopRecording.current = null; setStage("Transcribing your question…");
      const form = new FormData(); form.append("audio", audio, "question.wav"); form.append("locale", locale);
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
      if (active.current === controller) { active.current = null; stopRecording.current = null; setAnalyser(null); setBusy(false); }
    }
  }

  return <section id="shosai" className={styles.panel} aria-labelledby="shosai-title">
    <p className={styles.eyebrow}><span lang={locale}>{nativeNames[locale]}</span> · NYC SNAP</p>
    <h2 id="shosai-title">{t("Talk to Shosai")}</h2>
    <p>{t("Record or type a general question about SNAP, applying in NYC, household or income terms, or using our screening tool. Recorded questions also receive a spoken answer when speech is available. Choose Talk to Shosai for a live conversation.")}</p>
    {!consented ? <div className={styles.disclosure}>
      <h3>Before you ask</h3>
      <p>With the voice icon, your audio is sent to Google Gemini for transcription. Review or edit the text, then choose Ask Shosai to send your question for an AI answer. For recorded questions, that written answer is sent to ElevenLabs to create speech. Typed questions stay text-only. Hiraku keeps recordings, questions, answers, and speech only in page memory and clears them when you leave or background this page. Google and ElevenLabs may retain submissions under their own policies. Cancelling cannot retract content already sent or undo provider billing. Microphone access is requested only when you choose the voice icon or Start conversation.</p>
      <p>Do not share names, addresses, Social Security numbers, case numbers, documents, or private case details. We cannot guarantee automatic redaction. Use fictional, general questions for this local demo.</p>
      <p>Shosai gives general information and may make mistakes. HRA decides eligibility. This general guidance panel does not receive screening answers. You can choose to share them by opening Talk to Shosai from your screening result. <a href="https://ai.google.dev/gemini-api/terms" referrerPolicy="no-referrer">Read Google’s processing terms ↗</a>. <a href="https://elevenlabs.io/privacy-policy" referrerPolicy="no-referrer">Read ElevenLabs’ privacy policy ↗</a>.</p>
      <button type="button" className={brand.primary} onClick={() => {
        setConsented(true);
        requestAnimationFrame(() => input.current?.focus());
      }}>{t("I agree — ask Shosai")}</button>
    </div> : <><div className={styles.form}>
      {speechCodes[locale] ? <p>{t("Use the voice icon in the question box to record up to 30 seconds in your selected language. The stop icon transcribes into the box; review or edit it before choosing Ask Shosai. Cancel discards the recording. You can always type instead.")}</p> : <p role="status">{t("Voice is unavailable in the selected language. You can still read the answer and official sources.")}</p>}
      <div className={styles.actions}>
        <button ref={liveButton} type="button" className={brand.secondary} disabled={busy || liveOpen} aria-expanded={liveOpen} aria-controls="live-shosai-panel"
          onClick={() => { clear(); setLiveOpen(true); }}>{t("Talk to Shosai")}</button>
      </div>
      {stage === "Recording your question…" && <p aria-live="off">{t("Recording: ")}{seconds}{t("/ 30 seconds")}</p>}
    </div>{liveOpen && <LiveConversation key={locale} disabled={busy} onSessionChange={setLiveActive} onClose={() => {
      setLiveOpen(false); setLiveActive(false); requestAnimationFrame(() => liveButton.current?.focus());
    }} />}<form onSubmit={submit} className={styles.form}>
      <label htmlFor="shosai-question">{t("Your general SNAP question")}</label>
      <div className={styles.questionInput}>
      <textarea id="shosai-question" ref={input} value={question} onChange={event => setQuestion(event.target.value)}
        maxLength={2000} required rows={3} disabled={busy || liveActive} aria-describedby="shosai-question-help" autoComplete="off" />
      {speechCodes[locale] && <VoiceInput analyser={analyser} requesting={stage === "Waiting for microphone permission…"} disabled={busy || liveActive}
        seconds={seconds} onStart={() => { void startVoice(); }} onStop={() => stopRecording.current?.()} />}
      </div>
      <p id="shosai-question-help">{t("Up to 2,000 characters. Leave out identifiers and private case details. Each question starts fresh.")}</p>
      <div className={styles.actions}>
        <button className={brand.primary} disabled={busy || liveActive} type="submit">{t("Ask Shosai")}</button>
        <button className={brand.secondary} type="button" onClick={() => { clear(); if (busy) setMessage("Question cancelled. Ask again when ready."); input.current?.focus(); }}>{busy ? t("Cancel question") : t("Clear question and answer")}</button>
      </div>
    </form></>}
    <p role="status" aria-live="polite">{result ? t("Your answer is ready.") : dynamic(stage)}</p>
    {message && <p role="alert">{locale !== "en" && dynamic(message) === message ? t("Shosai is unavailable. Use the official links below or try again.") : dynamic(message)}</p>}
    {result && <div className={styles.answer}>
      <h3>{t("Shosai’s answer")}</h3><p>{result.answer}</p>
      {result.warning && <p role="status">{t("Voice is unavailable in the selected language. You can still read the answer and official sources.")}</p>}
      {result.audio && <>
        <audio ref={playback} controls preload="auto" aria-label={t("Shosai’s spoken answer")} onError={() => setMessage("Audio playback failed. Try Play again, or read the answer and official sources.")} />
        <button type="button" className={brand.secondary} onClick={() => {
          const player = playback.current;
          if (!player) return;
          player.currentTime = 0;
          void player.play().catch(() => { if (playback.current === player) setMessage("Audio playback could not start. Use the audio controls or read the answer."); });
        }}>{t("Replay answer")}</button>
      </>}
      <h3>{t("Official sources")}</h3>
      <ul>{result.sources.map(source => <li key={source.id}><a href={source.url} referrerPolicy="no-referrer">{source.title} ↗</a> <span>{t("Reviewed ")}<time dateTime={source.reviewedAt}>{source.reviewedAt}</time></span></li>)}</ul>
      <p>{t("General guidance, not an eligibility decision. Check official sources before acting.")}</p>
    </div>}
  </section>;
}

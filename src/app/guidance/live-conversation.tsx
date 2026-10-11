"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CommitStrategy, useScribe } from "@elevenlabs/react";
<<<<<<< HEAD
import { LiveSession, type LiveTurn } from "../../lib/voice/live-session";
import { useLocale } from "../../lib/i18n/client";
import { nativeNames, realtimeCodes } from "../../lib/i18n/locale";
=======
import { LiveSession, requestScreeningGreeting, type LiveTurn } from "../../lib/voice/live-session";
import type { ScreeningAnswers } from "../../lib/screening/snap-screening";
import { screeningGreeting } from "../../lib/screening/screening-context";
>>>>>>> origin
import brand from "../site.module.css";
import styles from "./guidance.module.css";

const Orb = dynamic(() => import("./components/orb").then(module => module.Orb), {
  ssr: false, loading: () => <div className={styles.orbFallback} />,
});
const orbColors: [string, string] = ["#234b36", "#d9ef70"];
const ignoreSessionChange = () => {};

class OrbBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className={styles.orbFallback} /> : this.props.children; }
}

function ShosaiOrb({ phase = null }: { phase?: "thinking" | "listening" | "talking" | null }) {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return <div className={styles.orb} aria-hidden="true">
    {reduceMotion ? <div className={styles.orbFallback} /> : <OrbBoundary>
      <Orb className={styles.orbCanvas} colors={orbColors} seed={42} agentState={phase} />
    </OrbBoundary>}
  </div>;
}

export default function LiveConversation({ onClose, onSessionChange = ignoreSessionChange, disabled, screening, onReview, screeningChanged }: {
  onClose: () => void; onSessionChange?: (active: boolean) => void; disabled: boolean;
  screening?: ScreeningAnswers; onReview?: () => void; screeningChanged?: boolean;
}) {
<<<<<<< HEAD
  const { locale, t, dynamic } = useLocale();
  const [started, setStarted] = useState(false);
=======
  const [mode, setMode] = useState<"voice" | "text" | null>(null);
>>>>>>> origin
  const [message, setMessage] = useState("");
  const startButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { startButton.current?.focus(); }, []);
  const finish = useCallback((reason: string) => {
    setMode(null); setMessage(reason); onSessionChange(false);
    requestAnimationFrame(() => startButton.current?.focus());
  }, [onSessionChange]);

  return <section id="live-shosai-panel" className={styles.livePanel} aria-labelledby="live-shosai-title">
    <div className={styles.liveHeader}>
      <p>{t("HIRAKU / SHOSAI")}</p>
      <button className={brand.secondary} type="button" onClick={onClose}>{t("Close conversation panel")}</button>
    </div>
<<<<<<< HEAD
    <h3 id="live-shosai-title">{t("Talk to Shosai")}</h3>
    <p>{t("Ask general questions about SNAP rules, including income. Shosai can explain NYC guidance but cannot assess your eligibility or estimate benefits. If you want to check your own situation, use Hiraku’s screener or apply through NYC HRA.")}</p>
    <p className={styles.liveHelp}>{t("Hiraku clears this conversation when the session ends.")}</p>
    {!realtimeCodes[locale] ? <p role="status">{t("Voice is unavailable in the selected language. You can still read the answer and official sources.")}</p> : started ? <ConversationSession onEnd={finish} /> : <>
=======
    <h3 id="live-shosai-title">Talk to Shosai</h3>
    <p>{screening ? "Ask questions about your screening result or anything that feels unclear. Shosai has your answers and can help explain your result and next steps. This is guidance, not an official eligibility decision." : "Ask general questions about SNAP rules, including income. Shosai can explain NYC guidance but cannot assess your eligibility or estimate benefits. If you want to check your own situation, use Hiraku’s screener or apply through NYC HRA."}</p>
    {screening && !mode && <>
      {screeningChanged && <p role="status">Your screening has changed. Start a new conversation to discuss your updated result.</p>}
      <p className={styles.liveHelp}>Starting shares your screening answers, result, and questions with Google Gemini. Voice also uses ElevenLabs.</p>
      <details className={styles.liveHelp}>
        <summary>How your information is used</summary>
        <p>Google Gemini explains your result. ElevenLabs transcribes live voice and creates spoken replies. Providers may retain submissions under their policies; ending a conversation cannot retract information already sent. Please leave out names, addresses, case numbers, and other identifying details. Use fictional information for this local demo.</p>
        <p><a href="https://ai.google.dev/gemini-api/terms" referrerPolicy="no-referrer">Google’s processing terms</a> · <a href="https://elevenlabs.io/privacy-policy" referrerPolicy="no-referrer">ElevenLabs’ privacy policy</a></p>
      </details>
    </>}
    <p className={styles.liveHelp}>Hiraku clears this conversation when the session ends.</p>
    {mode === "voice" ? <ConversationSession onEnd={finish} screening={screening} /> : mode === "text" ? <TextConversation onEnd={finish} screening={screening} /> : <>
>>>>>>> origin
      <ShosaiOrb />
      {message && <p role="status">{locale !== "en" && dynamic(message) === message ? t("The conversation could not continue. Start again when ready.") : dynamic(message)}</p>}
      <button ref={startButton} type="button" disabled={disabled} className={`${brand.primary} ${styles.startConversation}`} onClick={() => {
<<<<<<< HEAD
        setMessage(""); setStarted(true); onSessionChange(true);
      }}>{message ? t("Start again") : t("Start conversation")}</button>
      <p className={styles.liveHelp}><span lang={locale}>{nativeNames[locale]}</span> · {t("General NYC SNAP guidance · Up to 5 minutes")}</p>
=======
        setMessage(""); setMode("voice"); onSessionChange(true);
      }}>{message ? "Start again" : "Start conversation"}</button>
      <button type="button" disabled={disabled} className={brand.secondary} onClick={() => {
        setMessage(""); setMode("text"); onSessionChange(true);
      }}>Use text instead</button>
      <p className={styles.liveHelp}>English · {screening ? "Your screening result" : "General NYC SNAP guidance"} · Up to 5 minutes</p>
>>>>>>> origin
    </>}
    {onReview && <button type="button" className={brand.secondary} onClick={onReview}>Review my answers</button>}
    {screening && <p className={styles.liveHelp}>Need official help? <a href="tel:+17185571399">Call HRA at 718-557-1399</a> or <a href="https://a069-access.nyc.gov/accesshra/" referrerPolicy="no-referrer">apply on ACCESS HRA</a>. No application has been submitted by Hiraku.</p>}
  </section>;
}

<<<<<<< HEAD
function ConversationSession({ onEnd }: { onEnd: (reason: string) => void }) {
  const { locale, t, dynamic } = useLocale();
=======
function ConversationSession({ onEnd, screening }: { onEnd: (reason: string) => void; screening?: ScreeningAnswers }) {
>>>>>>> origin
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [phase, setPhase] = useState<"connecting" | "listening" | "thinking" | "talking">("connecting");
  const [seconds, setSeconds] = useState(0);
  const session = useRef<LiveSession | null>(null);
  const live = useRef(false);
  const audio = useRef<HTMLAudioElement>(null);
  const audioUrl = useRef<string | null>(null);
  const startupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAudio = useCallback(() => {
    const player = audio.current;
    player?.pause(); player?.removeAttribute("src"); player?.load();
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = null;
  }, []);

  const finish = useCallback((reason: string) => {
    if (!live.current) return;
    live.current = false; session.current?.close(); stopAudio(); onEnd(reason);
  }, [onEnd, stopAudio]);

  const interrupt = useCallback(() => {
    session.current?.interrupt(!!audio.current && !audio.current.paused);
    stopAudio();
  }, [stopAudio]);

  const partial = useCallback(({ text }: { text: string }) => {
    if (!live.current || !text.trim()) return;
    // shortcut: interruption waits for recognized speech; use managed turn-taking if rehearsal shows unacceptable delay.
    interrupt(); setPhase("listening");
  }, [interrupt]);

  const committed = useCallback(async ({ text }: { text: string }) => {
    if (!live.current || !text.trim()) return;
    interrupt(); setPhase("thinking");
    try {
      const result = await session.current?.ask(text);
      if (!live.current || !result) return;
      if (!result.audio) {
        finish(result.warning?.message ?? "Shosai’s voice is unavailable. Please choose Use text instead."); return;
      }
      const bytes = Uint8Array.from(atob(result.audio.base64), char => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      audioUrl.current = url;
      const player = audio.current;
      if (!player) { stopAudio(); return; }
      player.src = url; setPhase("talking");
      try { await player.play(); } catch {
        if (live.current && audioUrl.current === url) finish("Speech playback could not start. Please choose Use text instead.");
      }
    } catch (error) {
      if (live.current) finish(error instanceof Error && error.name === "Error" ? error.message : "The conversation could not continue. Start again when ready.");
    }
  }, [finish, interrupt, stopAudio]);

  const connected = useCallback(() => {
    if (!live.current) return;
    if (startupTimer.current) clearTimeout(startupTimer.current);
    setPhase("listening");
  }, []);
  const failed = useCallback(() => { finish("Live voice could not connect. Please choose Use text instead, or start again."); }, [finish]);
  const disconnected = useCallback(() => { finish("The connection ended. Start again when ready."); }, [finish]);
  const { connect, disconnect, clearTranscripts, partialTranscript } = useScribe({
    modelId: "scribe_v2_realtime", languageCode: realtimeCodes[locale], commitStrategy: CommitStrategy.VAD,
    onSessionStarted: connected, onPartialTranscript: partial, onCommittedTranscript: committed,
    onError: failed, onDisconnect: disconnected,
  });

  useEffect(() => {
    live.current = true;
<<<<<<< HEAD
    session.current = new LiveSession(setTurns, undefined, locale);
=======
    session.current = new LiveSession(setTurns, undefined, screening ? { screening } : undefined);
>>>>>>> origin
    const controller = new AbortController();
    const started = Date.now();
    const timer = setInterval(() => { if (live.current) setSeconds(Math.floor((Date.now() - started) / 1000)); }, 1000);
    const limit = setTimeout(() => finish("The five-minute session ended. Start again for a fresh conversation."), 300000);
    const leave = () => finish("Conversation ended. Hiraku cleared the session.");
    const visibility = () => { if (document.visibilityState === "hidden") leave(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    void (async () => {
      try {
        if (screening) {
          const greeting = await requestScreeningGreeting(screening, controller.signal);
          if (controller.signal.aborted || !live.current) return;
          if (!greeting.audio) { finish(greeting.warning?.message ?? "Speech is unavailable. Please choose Use text instead."); return; }
          const player = audio.current;
          if (!player) return;
          const bytes = Uint8Array.from(atob(greeting.audio.base64), char => char.charCodeAt(0));
          audioUrl.current = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
          player.src = audioUrl.current; setPhase("talking");
          startupTimer.current = setTimeout(failed, 20000);
          await new Promise<void>((resolve, reject) => {
            const cleanup = () => { player.removeEventListener("ended", ended); player.removeEventListener("error", failedPlayback); controller.signal.removeEventListener("abort", aborted); };
            const ended = () => { cleanup(); resolve(); };
            const failedPlayback = () => { cleanup(); reject(new Error("Speech playback failed")); };
            const aborted = () => { cleanup(); reject(controller.signal.reason); };
            player.addEventListener("ended", ended, { once: true }); player.addEventListener("error", failedPlayback, { once: true });
            controller.signal.addEventListener("abort", aborted, { once: true });
            void player.play().catch(failedPlayback);
          });
          if (controller.signal.aborted || !live.current) return;
          if (startupTimer.current) clearTimeout(startupTimer.current);
          stopAudio(); setPhase("connecting");
        }
        startupTimer.current = setTimeout(failed, 20000);
        const response = await fetch("/api/voice/live/token", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
        });
        const body = await response.json();
        if (controller.signal.aborted || !live.current) return;
        if (!response.ok || typeof body.token !== "string") { failed(); return; }
        await connect({ token: body.token, vadSilenceThresholdSecs: 1.2,
          microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch { if (!controller.signal.aborted) failed(); }
    })();
    return () => {
      live.current = false; controller.abort(); session.current?.close(); session.current = null;
      disconnect(); clearTranscripts(); stopAudio();
      clearInterval(timer); clearTimeout(limit);
      if (startupTimer.current) clearTimeout(startupTimer.current);
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", leave);
    };
  }, [connect, disconnect, clearTranscripts, failed, finish, stopAudio, screening]);

  const label = { connecting: "Connecting…", listening: "Listening", thinking: "Thinking…", talking: "Shosai is speaking" }[phase];
  return <>
    <ShosaiOrb phase={phase === "connecting" ? null : phase} />
<<<<<<< HEAD
    <p role="status" aria-live="polite" className={styles.liveStatus}>{dynamic(label)}</p>
    <p className={styles.liveHelp}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}{t("/ 5:00 · Speak naturally. Pause for a reply, or talk to interrupt.")}</p>
    <button type="button" className={`${brand.primary} ${styles.startConversation}`} onClick={() => finish("Conversation ended. Hiraku cleared the session.")}>{t("End conversation")}</button>
    <audio ref={audio} hidden onEnded={() => { if (live.current) { stopAudio(); setPhase("listening"); } }}
      onError={() => { if (live.current && audioUrl.current) finish("Speech playback failed. Start again, or type a question below."); }} />
    <div className={styles.liveTranscript} aria-label={t("Conversation transcript")}>
=======
    {screening && <p>{screeningGreeting}</p>}
    <p role="status" aria-live="polite" className={styles.liveStatus}>{label}</p>
    <p className={styles.liveHelp}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} / 5:00 · Speak naturally. Pause for a reply, or talk to interrupt.</p>
    <button type="button" className={`${brand.primary} ${styles.startConversation}`} onClick={() => finish("Conversation ended. Hiraku cleared the session.")}>End conversation</button>
    <audio ref={audio} hidden onEnded={() => { if (live.current) { stopAudio(); setPhase("listening"); } }}
      onError={() => { if (live.current && audioUrl.current) finish("Speech playback failed. Start again, or choose Use text instead."); }} />
    <ConversationTranscript turns={turns} />
    {partialTranscript && <p className={styles.livePartial}><strong>You · Speaking</strong><br />{partialTranscript}</p>}
  </>;
}

function ConversationTranscript({ turns }: { turns: LiveTurn[] }) {
  return <div className={styles.liveTranscript} aria-label="Conversation transcript">
>>>>>>> origin
      {turns.map((turn, index) => <div key={index} className={styles.liveTurn}>
        <p><strong>{t("You")}</strong></p><p>{turn.question}</p>
        {turn.result && <>
          <p><strong>{t("Shosai")}</strong>{turn.interrupted && <span>{t("· Interrupted")}</span>}</p>
          <p>{turn.result.answer}</p>
          <ul>{turn.result.sources.map(source => <li key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer" referrerPolicy="no-referrer">{source.title} ↗</a>
          </li>)}</ul>
        </>}
        {!turn.result && turn.interrupted && <p>{t("Reply interrupted.")}</p>}
      </div>)}
<<<<<<< HEAD
      {partialTranscript && <p className={styles.livePartial}><strong>{t("You · Speaking")}</strong><br />{partialTranscript}</p>}
    </div>
=======
    </div>;
}

function TextConversation({ onEnd, screening }: { onEnd: (reason: string) => void; screening?: ScreeningAnswers }) {
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const session = useRef<LiveSession | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const current = new LiveSession(setTurns, undefined, { ...(screening ? { screening } : {}), spoken: false });
    session.current = current; input.current?.focus();
    const end = () => onEnd("Conversation ended. Hiraku cleared the session.");
    const visibility = () => { if (document.visibilityState === "hidden") end(); };
    const limit = setTimeout(() => onEnd("The five-minute session ended. Start again for a fresh conversation."), 300000);
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", end);
    return () => {
      current.close(); session.current = null; clearTimeout(limit);
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", end);
    };
  }, [onEnd, screening]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !question.trim()) return;
    const current = session.current;
    if (!current) return;
    setBusy(true); setMessage("");
    try {
      await current.ask(question);
      if (session.current === current) setQuestion("");
    } catch (error) {
      if (session.current === current) setMessage(error instanceof Error ? error.message : "Shosai could not connect. Please try again or return to your result.");
    } finally {
      if (session.current === current) { setBusy(false); requestAnimationFrame(() => input.current?.focus()); }
    }
  }

  return <>
    <ShosaiOrb phase={busy ? "thinking" : null} />
    {screening && <p>{screeningGreeting}</p>}
    <ConversationTranscript turns={turns} />
    <form className={styles.form} onSubmit={submit}>
      <label htmlFor="shosai-follow-up">{screening ? "Your question about your result" : "Your SNAP question"}</label>
      <textarea ref={input} id="shosai-follow-up" value={question} onChange={event => setQuestion(event.target.value)}
        disabled={busy} maxLength={2000} required rows={3} autoComplete="off" />
      <p>Up to 2,000 characters. Please leave out identifying details.</p>
      <button className={brand.primary} type="submit" disabled={busy}>Ask Shosai</button>
    </form>
    <p role="status">{busy ? "Preparing your answer…" : message}</p>
    <button className={brand.secondary} type="button" onClick={() => onEnd("Conversation ended. Hiraku cleared the session.")}>End conversation</button>
    <p className={styles.liveHelp}>English · Up to 5 minutes</p>
>>>>>>> origin
  </>;
}

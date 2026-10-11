"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { LiveSession, type LiveTurn } from "../../lib/voice/live-session";
import brand from "../site.module.css";
import styles from "./guidance.module.css";

const Orb = dynamic(() => import("./components/orb").then(module => module.Orb), {
  ssr: false, loading: () => <div className={styles.orbFallback} />,
});
const orbColors: [string, string] = ["#234b36", "#d9ef70"];

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

export default function LiveConversation({ onClose, onSessionChange, disabled }: {
  onClose: () => void; onSessionChange: (active: boolean) => void; disabled: boolean;
}) {
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState("");
  const startButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { startButton.current?.focus(); }, []);
  const finish = useCallback((reason: string) => {
    setStarted(false); setMessage(reason); onSessionChange(false);
    requestAnimationFrame(() => startButton.current?.focus());
  }, [onSessionChange]);

  return <section id="live-shosai-panel" className={styles.livePanel} aria-labelledby="live-shosai-title">
    <div className={styles.liveHeader}>
      <p>HIRAKU / SHOSAI</p>
      <button className={brand.secondary} type="button" onClick={onClose}>Close conversation panel</button>
    </div>
    <h3 id="live-shosai-title">Talk to Shosai</h3>
    <p>Ask general questions about SNAP rules, including income. Shosai can explain NYC guidance but cannot assess your eligibility or estimate benefits. If you want to check your own situation, use Hiraku’s screener or apply through NYC HRA.</p>
    <p className={styles.liveHelp}>Hiraku clears this conversation when the session ends.</p>
    {started ? <ConversationSession onEnd={finish} /> : <>
      <ShosaiOrb />
      {message && <p role="status">{message}</p>}
      <button ref={startButton} type="button" disabled={disabled} className={`${brand.primary} ${styles.startConversation}`} onClick={() => {
        setMessage(""); setStarted(true); onSessionChange(true);
      }}>{message ? "Start again" : "Start conversation"}</button>
      <p className={styles.liveHelp}>English · General NYC SNAP guidance · Up to 5 minutes</p>
    </>}
  </section>;
}

function ConversationSession({ onEnd }: { onEnd: (reason: string) => void }) {
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
        finish(result.warning?.message ?? "Shosai’s voice is unavailable. You can still type or record a question below."); return;
      }
      const bytes = Uint8Array.from(atob(result.audio.base64), char => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      audioUrl.current = url;
      const player = audio.current;
      if (!player) { stopAudio(); return; }
      player.src = url; setPhase("talking");
      try { await player.play(); } catch {
        if (live.current && audioUrl.current === url) finish("Speech playback could not start. You can still type or record a question below.");
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
  const failed = useCallback(() => { finish("Live voice could not connect. You can still type or record a question below."); }, [finish]);
  const disconnected = useCallback(() => { finish("The connection ended. Start again when ready."); }, [finish]);
  const { connect, disconnect, clearTranscripts, partialTranscript } = useScribe({
    modelId: "scribe_v2_realtime", languageCode: "en", commitStrategy: CommitStrategy.VAD,
    onSessionStarted: connected, onPartialTranscript: partial, onCommittedTranscript: committed,
    onError: failed, onDisconnect: disconnected,
  });

  useEffect(() => {
    live.current = true;
    session.current = new LiveSession(setTurns);
    const controller = new AbortController();
    const started = Date.now();
    const timer = setInterval(() => { if (live.current) setSeconds(Math.floor((Date.now() - started) / 1000)); }, 1000);
    const limit = setTimeout(() => finish("The five-minute session ended. Start again for a fresh conversation."), 300000);
    startupTimer.current = setTimeout(failed, 20000);
    const leave = () => finish("Conversation ended. Hiraku cleared the session.");
    const visibility = () => { if (document.visibilityState === "hidden") leave(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    void (async () => {
      try {
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
  }, [connect, disconnect, clearTranscripts, failed, finish, stopAudio]);

  const label = { connecting: "Connecting…", listening: "Listening", thinking: "Thinking…", talking: "Shosai is speaking" }[phase];
  return <>
    <ShosaiOrb phase={phase === "connecting" ? null : phase} />
    <p role="status" aria-live="polite" className={styles.liveStatus}>{label}</p>
    <p className={styles.liveHelp}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} / 5:00 · Speak naturally. Pause for a reply, or talk to interrupt.</p>
    <button type="button" className={`${brand.primary} ${styles.startConversation}`} onClick={() => finish("Conversation ended. Hiraku cleared the session.")}>End conversation</button>
    <audio ref={audio} hidden onEnded={() => { if (live.current) { stopAudio(); setPhase("listening"); } }}
      onError={() => { if (live.current && audioUrl.current) finish("Speech playback failed. Start again, or type a question below."); }} />
    <div className={styles.liveTranscript} aria-label="Conversation transcript">
      {turns.map((turn, index) => <div key={index} className={styles.liveTurn}>
        <p><strong>You</strong></p><p>{turn.question}</p>
        {turn.result && <>
          <p><strong>Shosai</strong>{turn.interrupted && <span> · Interrupted</span>}</p>
          <p>{turn.result.answer}</p>
          <ul>{turn.result.sources.map(source => <li key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer" referrerPolicy="no-referrer">{source.title} ↗</a>
          </li>)}</ul>
        </>}
        {!turn.result && turn.interrupted && <p>Reply interrupted.</p>}
      </div>)}
      {partialTranscript && <p className={styles.livePartial}><strong>You · Speaking</strong><br />{partialTranscript}</p>}
    </div>
  </>;
}

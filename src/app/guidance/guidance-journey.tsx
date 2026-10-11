"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { GuidanceSuccess } from "../../lib/guidance/guidance";
import brand from "../site.module.css";
import styles from "./guidance.module.css";

export default function GuidanceJourney() {
  const [consented, setConsented] = useState(false);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<GuidanceSuccess | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  function clear() {
    active.current?.abort();
    active.current = null;
    setQuestion(""); setResult(null); setBusy(false); setMessage("");
  }

  useEffect(() => {
    const leave = () => {
      active.current?.abort(); active.current = null;
      setQuestion(""); setResult(null); setBusy(false); setMessage(""); setConsented(false);
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consented || active.current) return;
    const trimmed = question.trim();
    if (!trimmed || trimmed.length > 2000) { setMessage("Ask a question between 1 and 2,000 characters."); return; }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setResult(null); setMessage("");
    try {
      const response = await fetch("/api/guidance", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ question: trimmed }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      });
      if (active.current !== controller) return;
      if (response.status === 413) throw new Error("Type a shorter question and try again.");
      const body = await response.json();
      if (active.current !== controller) return;
      if (!response.ok || body.status !== "ready") {
        throw new Error(body.status === "error" && typeof body.message === "string" ? body.message : "Shosai is unavailable. Use the official links below or try again.");
      }
      if (typeof body.answer !== "string" || !Array.isArray(body.sources)) throw new Error("Shosai could not provide a checked answer. Try again.");
      setResult(body); setQuestion("");
    } catch (error) {
      if (active.current !== controller) return;
      setMessage(error instanceof Error && error.name === "TimeoutError" ? "Preparing your answer took too long. Try again when ready." :
        error instanceof Error && error.name === "Error" ? error.message : "Shosai could not connect. Use the official links below or try again.");
    } finally {
      if (active.current === controller) { active.current = null; setBusy(false); }
    }
  }

  return <section id="shosai" className={styles.panel} aria-labelledby="shosai-title">
    <p className={styles.eyebrow}>General NYC SNAP guidance · English</p>
    <h2 id="shosai-title">Talk to Shosai</h2>
    <p>Type a general question about SNAP, applying in NYC, household or income terms, or using our screening tool.</p>
    {!consented ? <div className={styles.disclosure}>
      <h3>Before you ask</h3>
      <p>Your question is sent to Google Gemini to prepare an AI answer. Hiraku keeps your question and answer only in page memory and clears them when you leave or background this page. Google may retain submissions under its own policies. Cancelling cannot retract content already sent.</p>
      <p>Do not share names, addresses, Social Security numbers, case numbers, documents, or private case details. We cannot guarantee automatic redaction. Use fictional, general questions for this local demo.</p>
      <p>Shosai gives general information and may make mistakes. HRA decides eligibility. Your screening answers are never sent to Shosai. <a href="https://ai.google.dev/gemini-api/terms" referrerPolicy="no-referrer">Read Google’s processing terms ↗</a>.</p>
      <button type="button" className={brand.primary} onClick={() => {
        setConsented(true);
        requestAnimationFrame(() => input.current?.focus());
      }}>I agree — type a question</button>
    </div> : <form onSubmit={submit} className={styles.form}>
      <label htmlFor="shosai-question">Your general SNAP question</label>
      <textarea id="shosai-question" ref={input} value={question} onChange={event => setQuestion(event.target.value)}
        maxLength={2000} required rows={3} disabled={busy} aria-describedby="shosai-question-help" autoComplete="off" />
      <p id="shosai-question-help">Up to 2,000 characters. Leave out identifiers and private case details. Each question starts fresh.</p>
      <div className={styles.actions}>
        <button className={brand.primary} disabled={busy} type="submit">Ask Shosai</button>
        <button className={brand.secondary} type="button" onClick={() => { clear(); if (busy) setMessage("Question cancelled. Ask again when ready."); input.current?.focus(); }}>{busy ? "Cancel question" : "Clear question and answer"}</button>
      </div>
    </form>}
    <p role="status" aria-live="polite">{busy ? "Preparing your answer…" : result ? "Your answer is ready." : ""}</p>
    {message && <p role="alert">{message}</p>}
    {result && <div className={styles.answer}>
      <h3>Shosai’s answer</h3><p>{result.answer}</p>
      <h3>Official sources</h3>
      <ul>{result.sources.map(source => <li key={source.id}><a href={source.url} referrerPolicy="no-referrer">{source.title} ↗</a> <span>Reviewed <time dateTime={source.reviewedAt}>{source.reviewedAt}</time></span></li>)}</ul>
      <p>General guidance, not an eligibility decision. Check official sources before acting.</p>
    </div>}
  </section>;
}

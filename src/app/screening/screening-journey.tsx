"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { activeScreeningQuestions, answerError, screeningOrder, screenSnap, type ScreeningAnswers, type ScreeningQuestion } from "../../lib/screening/snap-screening";
import brand from "../site.module.css";
import styles from "./screening.module.css";

const questions: Record<ScreeningQuestion, { title: string; help: string; kind: "choice" | "size" | "money" }> = {
  nyc: { title: "Do you live in New York City?", help: "NYC means the Bronx, Brooklyn, Manhattan, Queens, or Staten Island. We don’t need your address.", kind: "choice" },
  householdSize: { title: "How many people are in your SNAP household?", help: "Usually, count yourself and people you live with who buy food and prepare meals together. Spouses living together and children under 22 living with a parent generally count together, even if meals are separate. Children under 18 in a household member’s care generally count too. A roommate who buys and prepares food separately usually does not count. If your household is unclear, choose I don’t know.", kind: "size" },
  allAssistance: { title: "Does everyone in your household receive SSI or Cash Assistance?", help: "Count each person who receives either Supplemental Security Income (SSI) or a Cash Assistance grant. SSI is different from Social Security retirement benefits. If only some people receive these benefits, choose No.", kind: "choice" },
  olderOrDisabled: { title: "Is anyone in your household 60 or older, disabled, or blind?", help: "These circumstances can change the income guideline. You don’t need to share an exact age or medical details. If you’re unsure whether a disability counts for SNAP, choose I don’t know.", kind: "choice" },
  dependentCare: { title: "Does your household pay for child care or dependent care?", help: "Count out-of-pocket care costs, such as paying a child-care provider or paying for care for an adult who needs help. This can change which income guideline applies.", kind: "choice" },
  earnedIncome: { title: "Does anyone in your household have income from work?", help: "For example, wages from a job, self-employment income, or income from a boarder. Money such as unemployment or Social Security alone is not income from work.", kind: "choice" },
  childSupportPaid: { title: "Does your household pay child support?", help: "This means money paid to support a child outside your household. It is different from child support you receive. A paid amount can affect the income comparison.", kind: "choice" },
  childSupportAmount: { title: "How much child support does your household pay each month?", help: "Enter the total actually paid for children outside your SNAP household each month, including support withheld from pay. Include those withheld amounts in your gross income too, so we subtract them only once. Don’t enter support you receive or money owed but not paid. If you’re unsure which payments count, choose I don’t know.", kind: "money" },
  monthlyIncome: { title: "What is your household’s monthly gross income?", help: "Add the household’s monthly income from work and other sources, such as unemployment, Social Security, and child support received. Gross means before taxes or paycheck deductions: if a pay stub shows $1,500 before tax and $1,250 take-home, use $1,500. Use a monthly total, not one week’s pay. If you’re unsure which income to count, including self-employment or boarder income, choose I don’t know.", kind: "money" },
};

type View = "entry" | "result" | "review" | ScreeningQuestion;

export default function ScreeningJourney() {
  const [answers, setAnswers] = useState<ScreeningAnswers>({});
  const [view, setView] = useState<View>("entry");
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (view !== "entry") heading.current?.focus();
  }, [view]);

  useEffect(() => {
    // Also clear on browser back/forward-cache restoration after leaving the page.
    function clearSession() { setAnswers({}); setView("entry"); setError(null); }
    function clearOnRestore(event: PageTransitionEvent) { if (event.persisted) clearSession(); }
    window.addEventListener("pagehide", clearSession);
    window.addEventListener("pageshow", clearOnRestore);
    return () => {
      window.removeEventListener("pagehide", clearSession);
      window.removeEventListener("pageshow", clearOnRestore);
    };
  }, []);

  function navigate(next: View) { setError(null); setView(next); }
  function restart() { setAnswers({}); navigate("nyc"); }

  if (view === "entry") return <section className={styles.panel} aria-labelledby="screening-title">
    <p className={styles.eyebrow}>NYC SNAP · A first check</p>
    <h1 id="screening-title">Could SNAP help your household?</h1>
    <p>Answer a few questions to check a limited income guideline and understand what to do next. This is for NYC residents who haven’t applied.</p>
    <p><strong>This is screening, not an application.</strong> Hiraku cannot approve benefits or make an official eligibility decision.</p>
    <aside className={styles.notice}>
      <h2>What we check</h2>
      <p>If everyone receives SSI or Cash Assistance, we check that assistance-based path. Otherwise, we compare income for households of 1–8. The guideline depends on income from work, an older/disabled/blind member, or dependent-care costs. We account for child support paid when it applies.</p>
      <p>This is a limited financial check. If a required answer is unknown or your circumstances are outside the supported checks, you’ll get an explanation and an official next step.</p>
    </aside>
    <p>No account, identifying details, or documents. Answers stay on this page and clear when you refresh, start over, or leave.</p>
    <div className={styles.actions}><button className={brand.primary} type="button" onClick={() => navigate("nyc")}>Start screening</button></div>
  </section>;

  const activeQuestions = activeScreeningQuestions(answers);
  if (view === "result") {
    const result = screenSnap(answers);
    return <section className={styles.panel} aria-labelledby="screening-title">
      <p className={styles.eyebrow}>Your screening result · Not an official decision</p>
      <h1 id="screening-title" ref={heading} tabIndex={-1}>{result.title}</h1>
      <div className={styles.notice}><h2>Why you got this result</h2><ul>{result.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
      <p>{result.limitation}</p>
      <div className={styles.actions}>
        <button className={brand.primary} type="button" onClick={() => navigate("review")}>Review my answers</button>
        <button className={brand.secondary} type="button" onClick={restart}>Start over</button>
      </div>
      <section className={styles.preparation} aria-labelledby="prepare-title">
        <h2 id="prepare-title">Prepare your next step</h2>
        <p>You can review your answers, ask HRA for help, or apply when you’re ready. HRA can tell you which documents are needed.</p>
        <ul><li>Have information about who lives in your household.</li><li>Find recent pay stubs and other income records.</li><li>Have a lease and utility bills available, if they apply.</li><li>Find photo ID or other documents HRA requests. Don’t upload anything here.</li></ul>
        <p>Based on <a href="https://access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/" referrerPolicy="no-referrer">ACCESS NYC’s preparation guidance</a> and <a href="https://www.nyc.gov/site/hra/help/snap-application-frequently-asked-questions.page" referrerPolicy="no-referrer">HRA’s application FAQ</a>.</p>
        <p>Questions? <a href="tel:+17185571399">Call HRA at 718-557-1399</a>.</p>
        <a className={styles.applicationLink} href="https://a069-access.nyc.gov/accesshra/" referrerPolicy="no-referrer">Apply on ACCESS HRA (optional) ↗</a>
        <p>You’ll leave Hiraku and enter your information again on the official service. Your screening answers are not transferred. No application has been submitted by Hiraku.</p>
      </section>
      <p className={styles.source}>Income guideline effective October 1, 2026; reviewed October 10, 2026. <a href="https://www.ny.gov/services/apply-snap" referrerPolicy="no-referrer">Read New York’s income standards</a>.</p>
    </section>;
  }

  if (view === "review") return <section className={styles.panel} aria-labelledby="screening-title">
    <p className={styles.eyebrow}>Your current answers</p>
    <h1 id="screening-title" ref={heading} tabIndex={-1}>Review your answers</h1>
    <p>Change an answer, then continue to update your result. If a changed answer leads to a different path, questions that no longer apply will clear.</p>
    <dl className={styles.review}>
      {activeQuestions.map((question) => <div key={question}>
        <dt>{questions[question].title}</dt>
        <dd>{answers[question] === "unknown" ? "I don’t know" : answers[question] === "yes" ? "Yes" : answers[question] === "no" ? "No" : answers[question] ?? "Not answered"}</dd>
        <dd><button className={brand.secondary} type="button" onClick={() => navigate(question)} aria-label={`Change: ${questions[question].title}`}>Change answer</button></dd>
      </div>)}
    </dl>
    <div className={styles.actions}>
      <button className={brand.primary} type="button" onClick={() => navigate("result")}>Back to result</button>
      <button className={brand.secondary} type="button" onClick={restart}>Start over</button>
    </div>
  </section>;

  const questionId = view;
  const question = questions[questionId];
  const index = activeQuestions.indexOf(questionId);
  const value = answers[questionId];
  const numeric = question.kind !== "choice";
  const describedBy = `question-help${error ? " answer-error" : ""}`;

  function change(value: string) {
    const updated: ScreeningAnswers = { ...answers, [questionId]: value };
    const relevant = activeScreeningQuestions(updated);
    for (const key of screeningOrder) if (!relevant.includes(key)) delete updated[key];
    setAnswers(updated);
    setError(null);
  }

  function next(event: FormEvent) {
    event.preventDefault();
    const message = answerError(questionId, value);
    if (message) {
      setError(message);
      form.current?.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }
    navigate(activeQuestions[index + 1] ?? "result");
  }

  return <section className={styles.panel} aria-labelledby="screening-title">
    <p className={styles.eyebrow}>Question {index + 1} of up to {screeningOrder.length} · Screening, not applying</p>
    <h1 id="screening-title" ref={heading} tabIndex={-1}>{question.title}</h1>
    <p id="question-help">{question.help}</p>
    <form ref={form} onSubmit={next} noValidate autoComplete="off" className={styles.form}>
      {numeric ? <div className={styles.numberField}>
        <label htmlFor="screening-number">{question.kind === "size" ? "Number of people, including you" : questionId === "childSupportAmount" ? "Monthly child support paid in dollars" : "Total monthly income in dollars"}</label>
        <input id="screening-number" type="text" inputMode={question.kind === "size" ? "numeric" : "decimal"} value={value === "unknown" ? "" : value ?? ""} disabled={value === "unknown"} onChange={(event) => change(event.target.value)} aria-describedby={describedBy} aria-invalid={Boolean(error)} autoComplete="off" />
        <label className={styles.choice}><input type="checkbox" checked={value === "unknown"} onChange={(event) => change(event.target.checked ? "unknown" : "")} />I don’t know</label>
      </div> : <fieldset className={styles.choices} aria-labelledby="screening-title" aria-describedby={describedBy}>
        <legend className={styles.legend}>Choose an answer</legend>
        {(["yes", "no", "unknown"] as const).map((choice) => <label className={styles.choice} key={choice}>
          <input type="radio" name={view} value={choice} checked={value === choice} onChange={() => change(choice)} aria-describedby={describedBy} />
          {choice === "unknown" ? "I don’t know" : choice === "yes" ? "Yes" : "No"}
        </label>)}
      </fieldset>}
      {error && <p className={styles.error} id="answer-error" role="alert">{error}</p>}
      <div className={styles.actions}>
        <button className={brand.primary} type="submit">{view === "monthlyIncome" ? "See my result" : "Continue"}</button>
        <button className={brand.secondary} type="button" onClick={() => navigate(activeQuestions[index - 1] ?? "entry")}>Back</button>
      </div>
    </form>
    <p className={styles.source}>Your answers stay on this page. Refreshing or leaving clears them.</p>
  </section>;
}

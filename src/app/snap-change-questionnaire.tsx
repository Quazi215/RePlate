"use client";

import { useState, type ReactNode } from "react";
import styles from "./snap-change.module.css";

const questions = [
  { id: "paperwork", text: "Did you miss a deadline to send information or renew SNAP?", why: "Missing a required deadline may interrupt benefits." },
  { id: "income", text: "Did your household income increase?", why: "Income changes can affect your benefit amount." },
  { id: "workRules", text: "Did your SNAP office say your benefits changed because of work rules?", why: "A work-rule notice points to specific steps you can check." },
] as const;

type QuestionId = typeof questions[number]["id"];
type Answer = "Yes" | "No" | "Not sure" | null;
const emptyAnswers: Record<QuestionId, Answer> = { paperwork: null, income: null, workRules: null };

// Priority is deliberately different from question order. Copy reviewed against HRA guidance, October 10, 2026.
const explanations: { id: QuestionId; title: string; action: string; explanation: string; steps: string[] }[] = [
  {
    id: "paperwork", title: "Paperwork", action: "Contact HRA about the missed deadline.",
    explanation: "A missed deadline to send information or renew SNAP may have interrupted your benefits.",
    steps: ["Find the notice about the deadline.", "Ask HRA what information is missing.", "Ask whether the case can be reopened."],
  },
  {
    id: "workRules", title: "Work rules", action: "Check HRA’s current guidance for restoring benefits.",
    explanation: "A work-rule notice may mean the SNAP work requirements affected your benefits. NYC’s October 1, 2026 reset may give you a path to restore them; HRA must still determine eligibility.",
    steps: [
      "Check whether the whole case closed: reapply if it did.",
      "If the household still receives SNAP and only a member was removed, ask about a case change to add that person back.",
      "Check possible exemptions and approved activities with HRA.",
    ],
  },
  {
    id: "income", title: "Income change", action: "Ask HRA to explain the benefit calculation.",
    explanation: "An increase in household income may have changed the amount of SNAP you receive.",
    steps: ["Check that HRA has the correct household information.", "Ask whether applicable deductions were included."],
  },
];

export default function SnapChangeQuestionnaire({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<"intro" | "results" | number>("intro");
  const [answers, setAnswers] = useState(emptyAnswers);

  if (step === "intro") return <div className={styles.entry}>
    {children}
    <button type="button" className={styles.primary} onClick={() => setStep(0)}>Why did my SNAP change?</button>
  </div>;

  const matches = explanations.filter(explanation => answers[explanation.id] === "Yes");
  if (step === "results") return <section className={styles.panel} aria-label="Why did my SNAP change?">
    <div className={styles.action}><p>Your next step</p><h2>{matches[0]?.action ?? "Ask HRA for the written reason benefits changed."}</h2></div>
    {matches.map(match => <article key={match.id} className={styles.explanation} aria-labelledby={`snap-result-${match.id}`}>
      <h3 id={`snap-result-${match.id}`}>{match.title}</h3>
      <p><strong>This may explain your change</strong></p>
      <p>{match.explanation}</p>
      <ul>{match.steps.map(item => <li key={item}>{item}</li>)}</ul>
    </article>)}
    {matches.length === 0 && <div className={styles.explanation}>
      <p>Your answers don’t point to a clear reason.</p>
      <ul><li>Check notices.</li><li>Check case status.</li><li>Use official hearing guidance if you want to challenge the decision.</li></ul>
    </div>}
    {Object.values(answers).some(answer => answer === null || answer === "Not sure") && <p className={styles.limitation}>We couldn’t check everything.</p>}
    <nav className={styles.help} aria-label="Official SNAP help">
      <a href="https://a069-access.nyc.gov/accesshra/">Check notices and case status in ACCESS HRA ↗</a>
      {answers.workRules === "Yes" && <>
        <a href="https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page">HRA work-rule guidance</a>
        <a href="https://www.nyc.gov/main/services/snap-benefits/abawd">Check exemptions and approved activities ↗</a>
      </>}
      <a href="https://www.nyc.gov/main/services/snap-benefits">Find SNAP support ↗</a>
      <a href="https://portal.311.nyc.gov/article/?kanumber=KA-02943">Official hearing guidance</a>
    </nav>
    <button type="button" className={styles.primary} onClick={() => { setAnswers(emptyAnswers); setStep(0); }}>Start over</button>
  </section>;

  const question = questions[step];
  const nextStep = step === questions.length - 1 ? "results" : step + 1;
  function advance(skip = false) {
    if (skip) setAnswers(previous => ({ ...previous, [question.id]: null }));
    setStep(nextStep);
  }

  return <section className={styles.panel} aria-label="Why did my SNAP change?">
    <p>Question {step + 1} of {questions.length}</p>
    <fieldset key={question.id} className={styles.question} aria-describedby="snap-why">
      <legend>{question.text}</legend>
      <p id="snap-why">Why we ask: {question.why}</p>
      <div className={styles.answers}>
        {(["Yes", "No", "Not sure"] as const).map(answer => <label key={answer}>
          <input type="radio" name={question.id} value={answer} autoComplete="off" checked={answers[question.id] === answer} onChange={() => setAnswers(previous => ({ ...previous, [question.id]: answer }))} />{answer}
        </label>)}
      </div>
    </fieldset>
    <div className={styles.controls}>
      <button type="button" className={styles.secondary} disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
      <button type="button" className={styles.primary} onClick={() => advance()}>Next</button>
      <button type="button" className={styles.secondary} onClick={() => advance(true)}>Skip</button>
    </div>
  </section>;
}

import { activeScreeningQuestions, answerError, screenSnap, screeningOrder, type ScreeningAnswers, type ScreeningResult } from "./snap-screening";

export type ScreeningContext = { answers: ScreeningAnswers; result: ScreeningResult };
export const screeningGreeting = "Hello, I have your screening answers and result here, so there’s no need to go through them again. Is there anything about your result you’d like me to help clarify?";

// Only completed, relevant screening answers can cross the provider boundary.
export function readScreeningContext(value: unknown): ScreeningContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const answers: ScreeningAnswers = {};
  for (const [key, answer] of Object.entries(value)) {
    if (!screeningOrder.includes(key as typeof screeningOrder[number]) || typeof answer !== "string" || answer.length > 32 ||
      answerError(key as typeof screeningOrder[number], answer)) return null;
    Object.assign(answers, { [key]: answer });
  }
  const relevant = activeScreeningQuestions(answers);
  if (relevant.length !== Object.keys(answers).length || relevant.some(key => answers[key] === undefined)) return null;
  return { answers, result: screenSnap(answers) };
}

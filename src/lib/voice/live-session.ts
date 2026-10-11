import type { ConversationMessage, GuidanceSuccess } from "../guidance/guidance";

export type LiveTurn = { question: string; result?: GuidanceSuccess; interrupted?: boolean };
export type LiveAnswerProvider = (question: string, history: ConversationMessage[], signal: AbortSignal) => Promise<GuidanceSuccess>;

async function requestAnswer(question: string, history: ConversationMessage[], signal: AbortSignal): Promise<GuidanceSuccess> {
  const response = await fetch("/api/voice/live", {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ question, history }), signal: AbortSignal.any([signal, AbortSignal.timeout(50000)]),
  });
  const body = await response.json();
  if (!response.ok || body.status !== "ready" || typeof body.answer !== "string" || !Array.isArray(body.sources)) {
    throw new Error(body.status === "error" && typeof body.message === "string" ? body.message : "Shosai could not continue. Start again.");
  }
  return body;
}

// Owns turn cancellation and memory so late responses cannot revive a closed session.
export class LiveSession {
  private turns: LiveTurn[] = [];
  private pending: AbortController | null = null;
  private closed = false;

  constructor(private changed: (turns: LiveTurn[]) => void, private provider: LiveAnswerProvider = requestAnswer) {}

  interrupt(speaking = false): void {
    if (this.closed) return;
    if (this.pending || speaking) {
      this.pending?.abort(); this.pending = null;
      const last = this.turns.at(-1);
      if (last) { last.interrupted = true; this.changed([...this.turns]); }
    }
  }

  async ask(question: string): Promise<GuidanceSuccess | null> {
    if (this.closed || !question.trim()) return null;
    if (question.length > 2000 || this.turns.length >= 30) throw new Error("This conversation is too long. Start again with a shorter question.");
    this.interrupt();
    const history: ConversationMessage[] = this.turns.flatMap(turn => [
      { role: "user" as const, text: turn.question },
      ...(turn.result ? [{ role: "assistant" as const, text: turn.result.answer }] : []),
    ]);
    const turn: LiveTurn = { question: question.trim() };
    this.turns.push(turn); this.changed([...this.turns]);
    const controller = new AbortController(); this.pending = controller;
    try {
      const result = await this.provider(turn.question, history, controller.signal);
      if (this.closed || this.pending !== controller) return null;
      turn.result = result; this.changed([...this.turns]);
      return result;
    } catch (error) {
      if (this.closed || this.pending !== controller) return null;
      throw error;
    } finally {
      if (this.pending === controller) this.pending = null;
    }
  }

  close(): void {
    this.closed = true; this.pending?.abort(); this.pending = null; this.turns = [];
  }
}

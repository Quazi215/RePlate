export type GuidanceSource = { id: string; title: string; url: string; reviewedAt: string };
export type GuidanceSuccess = { status: "ready"; answer: string; sources: GuidanceSource[];
  audio?: { mimeType: "audio/mpeg"; base64: string } | null;
  warning?: { code: "SPEECH_UNAVAILABLE"; message: string } | null };
export type GuidanceError = { status: "error"; code: string; message: string };

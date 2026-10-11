export type GuidanceSource = { id: string; title: string; url: string; reviewedAt: string };
export type GuidanceSuccess = { status: "ready"; answer: string; sources: GuidanceSource[] };
export type GuidanceError = { status: "error"; code: string; message: string };

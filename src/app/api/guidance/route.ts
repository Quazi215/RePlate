import { handleGuidanceRequest } from "../../../lib/guidance/request.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request): Promise<Response> {
  return handleGuidanceRequest(request);
}

export const GET = POST;
export const PUT = POST;
export const PATCH = POST;
export const DELETE = POST;
export const HEAD = POST;
export const OPTIONS = POST;

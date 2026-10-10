import { searchRetailers } from "../../../lib/retailers/search.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const allowedParameters = new Set(["zip", "mode", "maxStraightLineMiles"]);
const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

type RequestError = { status: "error"; code: string; message: string };

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: responseHeaders });
}

function requestError(code: string, message: string): RequestError {
  return { status: "error", code, message };
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.search.length > 512) {
    return json(requestError("QUERY_TOO_LONG", "Keep search parameters within 512 characters."), 400);
  }
  const parameters = url.searchParams;
  for (const name of parameters.keys()) {
    if (!allowedParameters.has(name)) {
      return json(requestError("UNKNOWN_QUERY_PARAMETER", "Use only zip, mode, and maxStraightLineMiles."), 400);
    }
    if (parameters.getAll(name).length !== 1) {
      return json(requestError("DUPLICATE_QUERY_PARAMETER", `Provide ${name} only once.`), 400);
    }
  }

  const zip = parameters.get("zip");
  const mode = parameters.get("mode");
  if (zip === null || mode === null) {
    return json(requestError("MISSING_QUERY_PARAMETER", "Provide a ZIP code and a travel mode."), 400);
  }

  const result = await searchRetailers({
    zip,
    mode,
    maxStraightLineMiles: parameters.get("maxStraightLineMiles") ?? undefined,
  });
  if (result.status === "error") {
    const { httpStatus, ...payload } = result;
    return json(payload, httpStatus);
  }
  return json(result, 200);
}

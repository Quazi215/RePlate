# RePlate

RePlate spreads awareness of NYC SNAP changes and links residents to official next steps. Info is the homepage at `/`; the secondary Explore feature at `/explore` provides a grocery map and ZIP/radius search. Explore calls the retailer search API with a ZIP and optional straight-line radius and displays local supermarket candidates as list cards and map pins. Current SNAP authorization remains unverified. See the [frontend guide](src/app/explore/README.md).

## Local setup

1. Install Node.js 20.9 or newer and npm.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local` only if you add optional Gemini assistance.
4. Run `npm run dev` and open http://localhost:3000.

The backend uses a reviewed local NYC ZIP Code Tabulation Area reference and needs no routing API key or payment card. `GEMINI_API_KEY` is only for optional server-side explanations. Never prefix secret keys with `NEXT_PUBLIC_` or commit `.env.local`. Explore calls the same-origin retailer API and loads an OpenStreetMap basemap. Store coordinates and computed distances come from the validated local dataset. Neither page calls Gemini.

## Project commands

- `npm run dev` starts the local server.
- `npm run build` creates a production build.
- `npm run start` serves that build.
- `npm run lint` checks ESLint rules.
- `npm test` compiles and runs the deterministic Node test suite without adding a test dependency.
- `npm run typecheck` checks TypeScript.

## Vercel deployment setup

This repository is linked to a Vercel project, with the Next.js app at the repository root. Keep the repository root as the project root and use Vercel's detected Next.js framework and build settings. `.vercel/` is ignored so local project settings are not committed. The `/api/retailers` server function explicitly traces the local retailer CSV, ZIP reference, and borough boundary files it reads at runtime.

Create a preview deployment from the Vercel dashboard or with the [Vercel CLI](https://vercel.com/docs/cli), then confirm the build and routes before promoting a production deployment. Check the Vercel dashboard for the current deployment status.

No environment variables are required for the current app. `GEMINI_API_KEY` is optional and should only be configured as a server-side Vercel environment variable if the optional Gemini feature is implemented. The production build command is `npm run build`; use Node.js 20.9 or newer as specified by `package.json`.

To verify a locally configured Gemini key, run `npm run gemini:check`. It loads `.env.local`, sends one short prompt to the stable `gemini-3.5-flash-lite` model, and reports only success or an error category; it never prints the key or generated text. This checks API connectivity and model access, not a user-facing Gemini feature.

The server-side ZIP/ZCTA lookup is implemented in `src/lib/location/nyc-zcta.server.ts`, with 211 reviewed internal points and distinct malformed, unsupported, and reference-data failure results. Its [reference audit and regeneration instructions](data/location/README.md) document provenance, geographic filtering, and five-borough examples. Origins are labeled approximate; they are not home addresses. Explore uses this lookup through the retailer endpoint.

The server-side retailer loader in `src/lib/retailers/retailer-snapshot.server.ts` parses and normalizes the checked-in CSV, excludes unsafe records and deterministic duplicates, and validates coordinates against local official borough polygons. The [snapshot audit](data/retailers/README.md) records 1,247 accepted candidates and three borough inconsistencies. Snapshot source/date and current SNAP authorization remain unverified and are explicit in its output and the retailer endpoint response; the shared authorization audit is still required.

Proximity ordering is implemented in `src/lib/retailers/proximity-ranking.ts`. `rankRetailersByProximity` accepts a server-resolved ZIP/ZCTA point and validated, unique-ID retailer candidates, and returns full-precision Haversine straight-line miles, distance labels, a rationale, and ranking version `straight-line-haversine-v1`. It orders by distance then stable ID in ASCII order without changing the input list. Invalid candidate coordinates are excluded and counted; invalid origin coordinates throw a location-free error. Grocery prices and unsupported travel evidence do not affect ordering. Changes to distance arithmetic or tie ordering require a new ranking version.

`GET /api/retailers?zip=10001&maxStraightLineMiles=5` composes the reviewed location reference, validated retailer snapshot, and proximity ranking. The radius is optional and must be greater than 0 and at most 25 miles. Responses include up to 20 candidates, provenance and authorization omissions, a truncation notice, and clear data limitations. Invalid input, unsupported ZIPs, missing data, and genuine no-results have distinct responses. The endpoint is dynamic and responses are not cached. Explore sends ZIP/radius searches on Find stores. Reset and newer submissions cancel older requests; API/network failures offer retry and the USDA locator. No travel mode is required.

The map uses Leaflet and OpenStreetMap tiles. No map API key is required. Retailer data stays in the repository snapshot; current SNAP authorization, prices, stock, and routes are unverified. Fare calculations and fictional demo stores have been removed from the Explore flow. The Gemini connectivity-check script remains available for optional future assistance.

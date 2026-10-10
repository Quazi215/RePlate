# RePlate

RePlate is a Next.js and TypeScript app for comparing NYC SNAP shopping destinations and estimated travel costs. The application is currently a scaffold; the search and comparison flow described in [the hackathon plan](docs/HACKATHON.md) is still to be implemented.

## Local setup

1. Install Node.js 20.9 or newer and npm.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local` and add the provider keys you will use.
4. Run `npm run dev` and open http://localhost:3000.

`HERE_API_KEY` is for server-side HERE location and route requests. `GEMINI_API_KEY` is for optional server-side Gemini explanations. Never prefix these keys with `NEXT_PUBLIC_` or commit `.env.local`. The placeholder page does not make provider calls, so keys are not required to start it.

## Project commands

- `npm run dev` starts the local server.
- `npm run build` creates a production build.
- `npm run start` serves that build.
- `npm run lint` checks ESLint rules.
- `npm run typecheck` checks TypeScript.

The planned stack uses HERE over server-side HTTP, the Google Gen AI SDK for optional explanations, and Leaflet/React Leaflet for an optional map. Retailer data is kept in the repository snapshot rather than a database. The data and HERE capabilities require review before the app can claim current store authorization, route availability, or complete cost comparisons.

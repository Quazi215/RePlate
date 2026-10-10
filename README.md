# RePlate

RePlate is a Next.js and TypeScript app for comparing NYC shopping destinations by approximate straight-line distance and transparent fare context. The application is currently a scaffold; the search and comparison flow described in [the hackathon plan](docs/HACKATHON.md) is still to be implemented.

## Local setup

1. Install Node.js 20.9 or newer and npm.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local` only if you add optional Gemini assistance.
4. Run `npm run dev` and open http://localhost:3000.

The core flow uses a reviewed local NYC ZIP Code Tabulation Area reference and needs no routing API key or payment card. `GEMINI_API_KEY` is only for optional server-side explanations. Never prefix secret keys with `NEXT_PUBLIC_` or commit `.env.local`. The placeholder page does not make provider calls.

## Project commands

- `npm run dev` starts the local server.
- `npm run build` creates a production build.
- `npm run start` serves that build.
- `npm run lint` checks ESLint rules.
- `npm run typecheck` checks TypeScript.

The planned stack uses the Google Gen AI SDK for optional explanations and Leaflet/React Leaflet for an optional map. Retailer data is kept in the repository snapshot rather than a database. The data requires review before the app can claim current store authorization. The core app will show approximate straight-line proximity and generic fare context; it will not calculate walking or bus routes, travel times, or complete shopping costs. A separate fictional bus-time UI demonstration must be visibly labeled as sample data.

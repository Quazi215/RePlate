# Local-bus fare review

Reviewed **2026-10-09** against [MTA: Subway and bus fares](https://www.mta.info/fares-tolls/subway-bus). The page lists a regular $3 fare for local, limited, rush, and Select Bus Service buses. Express service uses a different fare. Transfers, payment history/fare caps, and reduced-fare eligibility can change the amount actually paid.

`local-bus.json` records only the reviewed regular local-bus amount, in integer USD cents, together with its source, review date, and review status. It is a manually reviewed reference, not generated data. The $6 example is calculated as two separately paid $3 rides. It does not establish a round trip, transfer count, applicable service, or a fare to any retailer.

## Review and failure behavior

Before updating the reference, recheck the official page and record the actual review date. A review date describes when the source was checked; it does not promise that fares will remain current. Recheck before a later release. If the amount cannot currently be verified, set `status` to `unverified`; do not retain an amount as an available example under `reviewed` status.

The loader suppresses bus amounts when the file is missing, unreadable, malformed, unreviewed, or has invalid source/date/service/currency/amount fields. Bus fare then has `kind: unknown` and `amountCents: null`. Walking fare remains zero independently of the bus reference. Runtime loading makes no network requests, and tests use local fixtures.

## Integration with #4 and #8

Import `loadFareContext` from `src/lib/fares/fare-context.server.ts` in server code. Pass the selected `walking` or `bus` mode; other inputs return `INVALID_TRAVEL_MODE`. Its optional reference path is trusted server configuration for tests/tools, never an HTTP input.

Render the resulting context once for the selected mode, including its label, source/review date, and caveats. It is a separate display object with `scope: generic-mode-context`. It accepts no retailers, distances, routes, or grocery basket. Store-specific fare, route availability, bus reachability, route distance/duration, grocery cost, and total shopping cost remain explicitly `null`.

Keep this object out of retailer records, ranking inputs, and shopping-cost calculations. Ticket #8's ranking uses distance and stable ID only; ticket #4 must preserve that separation when composing the response. Walking's zero fare is a mode-wide assumption and does not verify a usable walking route. The current ticket adds no retailer endpoint or shopper UI.

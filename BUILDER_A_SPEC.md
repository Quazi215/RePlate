# RePlate — Builder A specification

**Owner:** Quazi
**Source of truth:** [docs/HACKATHON.md](docs/HACKATHON.md), revised October 9, 2026
**Tracker:** [Quazi workstream #1](https://github.com/Quazi215/RePlate/issues/1)
**UI handoff:** [BUILDER_B_SPEC.md](BUILDER_B_SPEC.md)

## Goal and current boundary

Provide one card-free server endpoint that validates a supported NYC ZIP/ZCTA, loads reviewed retailer data, and returns up to 20 candidates ordered by approximate straight-line distance. Include a general walking or local-bus fare context and explicit missing evidence. The endpoint must not claim a walking/bus route, trip duration, trip-specific fare, current SNAP authorization, or grocery savings without supporting data.

The Next.js/TypeScript scaffold and dependencies are present. No HERE key, payment card, geocoding API, or routing API is required. `README.md` contains local setup. The current `nyc_snap_supermarkets.csv` has identity/location fields but no authorization source/date columns; the shared audit must establish what claims it supports.

## Work items in order

| Ticket | Deliverable | Acceptance |
| --- | --- | --- |
| [#2](https://github.com/Quazi215/RePlate/issues/2) | Reviewed local NYC ZCTA lookup | Bundle ZIP/ZCTA and internal-point coordinates from [NYC Open Data](https://data.cityofnewyork.us/City-Government/ZIP-Code-Tabulation-Areas/35j5-n34v) with source/extract date. Distinguish malformed input, supported code, known outside coverage, and five-digit code absent from the reference. Do not derive origins from store positions. |
| [#3](https://github.com/Quazi215/RePlate/issues/3) | Defensive retailer CSV loader | Normalize stable ID, name, address, type, coordinates and available provenance; exclude unsafe/duplicate/non-NYC records; do not infer current authorization from the filename. |
| [#7](https://github.com/Quazi215/RePlate/issues/7) | General fare context | Walking fare $0; rechecked MTA local-bus amount shown only as a generic example. No per-retailer bus fare or route claim. Unknown grocery/trip costs stay unknown. |
| [#8](https://github.com/Quazi215/RePlate/issues/8) | Deterministic proximity ordering | Same input and ranking version yield distance → stable-ID order. Mode and David's fictional bus times never change the order. Rationale says “approximate proximity.” |
| [#4](https://github.com/Quazi215/RePlate/issues/4) | `GET /api/retailers` | Validate inputs; calculate Haversine miles; apply optional straight-line radius; sort by distance then stable ID; cap at 20; return source, omissions, cap notice, fare context and distinct failure states. |

The former walking-route [#5](https://github.com/Quazi215/RePlate/issues/5), bus-itinerary [#6](https://github.com/Quazi215/RePlate/issues/6), and recommendations-endpoint [#9](https://github.com/Quazi215/RePlate/issues/9) tasks are superseded by the no-routing decision. The core has no second API endpoint. David owns the separate fictional bus-time UI demonstration; Builder A does not supply its sample times through the live API.

## Location and retailer rules

- Accept a five-digit ZIP/ZCTA. Use a reviewed local extract of NYC Open Data ZCTAs, particularly the internal latitude/longitude point. That point is within the source polygon; it is an approximation, not the shopper's address. ZCTAs approximate USPS ZIP areas and do not include every deliverable ZIP. A valid five-digit code missing from the reference is **unsupported**, not automatically outside NYC.
- Show “outside NYC” only when a separate reviewed reference establishes it. A malformed ZIP receives a correction message. Missing/corrupt lookup data is a server data error. Keep these states separate from genuine zero nearby stores.
- Resolve retailer facts on the server from the reviewed snapshot. Exclude invalid/non-finite coordinates, unsafe identity/location records, duplicates, and records outside NYC. Optional metadata omissions may be displayed if the remaining facts are safe. Do not present the snapshot as currently SNAP-authorized until source/date/status have been audited.
- The optional radius is greater than zero and at most 25 miles. It filters Haversine distance from the ZCTA internal point, not any travel route. With no radius, there is no user distance cutoff within NYC. Return at most 20 retailers ordered by distance, then stable retailer ID; disclose the cap and that results are not exhaustive.

## Fare and comparison rules

- Walking mode has $0 fare. Bus mode may display the plan's previously checked $3 per paid local-bus ride / $6 for two separately paid rides only after rechecking the MTA source. Label it “example local-bus fare”; note reductions, transfers, caps and service class. It is not an actual trip estimate or evidence that a store is bus reachable.
- Do not calculate route distance, travel time, transfer count, walking segment distance, verified round trip, grocery basket total, or per-store travel fare. All of these are unavailable in the core response.
- Sort candidates only by approximate distance and stable ID. Do not mix generic fare examples or fictional demo times into ordering. Explain that nearby does not necessarily mean cheaper, faster, or practical for a selected mode.

## API handoff to David

`GET /api/retailers?zip=<five-digits>&mode=walking|bus&maxStraightLineMiles=<optional>` is the single proposed contract. Agree final field names before wiring the UI. A successful response needs:

- origin ZIP/ZCTA, approximate internal-point label, reference source/extract date;
- up to 20 retailers with stable ID, name, address, coordinates, approximate straight-line miles, and only verified authorization evidence if available;
- proximity ranking version and rationale, candidate-cap/truncation notice, omissions, and a generic fare-context object for the selected mode;
- explicit `routeDistance`, `routeDuration`, `busReachability`, and `tripFare` unavailability, or a shared missing-evidence list that makes the same limitation clear.

Use stable machine-readable error codes and plain messages for malformed ZIP, unsupported ZIP/ZCTA, known outside coverage, invalid radius/mode, missing/corrupt location reference, unvalidated retailer data, and genuine no results. Do not echo a household location in logs or error traces. Reject client-supplied retailer coordinates, prices, authorization claims, and arbitrary URLs.

## Verification and evidence gates

- [ ] Reviewed ZCTA extract covers chosen examples in all five boroughs; malformed and unsupported cases are distinct. Outside-NYC classification requires a separate reviewed source.
- [ ] Snapshot source/date/status are audited before current-authorization claims; coordinates, duplicates, and NYC geography are checked.
- [ ] A supplied radius, omitted radius, 25-mile maximum, 20-candidate cap, stable ties, and no-results behavior match the contract.
- [ ] Walking $0 and the generic bus example are labeled; actual routes, times, trip fares, grocery prices, and inventory remain unavailable.
- [ ] David can render every API state without inventing missing evidence; no sample bus times enter the live API.
- [ ] Local lint, typecheck, and build commands still pass after implementation.

Shared user checks and deployment remain in the hackathon plan. Optional Gemini explanations must consume only supported facts and cannot change ordering.

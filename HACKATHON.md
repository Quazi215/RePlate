# RePlate — Hackathon Working Draft

**Status:** Draft for team scrutiny; proposed decisions are not commitments.  
**Updated:** October 9, 2026  
**Team:** David + partner; implementation owners to assign.  
**Event:** Hack Knight Fall 2026, October 9–11.  
**Purpose:** One working document combining product specification, technical specification, and execution plan. Keep setup instructions in `README.md`.

> Working thesis: Help a New Yorker who lost SNAP understand the next action they can take, why it applies to their situation, and where to complete it officially.

## 1. Product specification

### 1.1 Idea and problem

- **Idea:** RePlate — an AI-assisted SNAP recovery and food-access navigator.
- **Problem/domain:** Benefits access, consumer accessibility, and public health.
- **Primary audience:** NYC residents who lost SNAP because of ABAWD work requirements and need help identifying their recovery pathway.
- **Secondary audience:** First-time applicants and households seeking food resources; direct them to existing official tools in this MVP.
- **Problem statement:** Residents facing SNAP loss can struggle to connect their case situation with the correct recovery steps, supporting documents, and official application process.
- **Solution statement:** RePlate turns a short structured assessment into a source-backed action checklist, explains the steps in plain language, and hands users off to official services, with nearby SNAP retailers as a secondary feature.

**Why now:** NYC announced outreach to approximately 26,500 residents who lost SNAP under expanded work requirements [S1]. HRA says the ABAWD compliance calendar restarted October 1, 2026; affected residents can reapply, but approval still depends on SNAP eligibility [S2–S3]. Do not describe the reset as automatic reinstatement or removal of work requirements.

**Problem-validation gap:** The administrative difficulty is plausible; we have not yet demonstrated that our workflow helps users more than the existing NYC guidance. Treat improved comprehension and follow-through as hypotheses.

### 1.2 Intended outcome and boundaries

After the core flow, a user should be able to answer:

1. What action should I take next?
2. Why was this action suggested?
3. What information or documents might I need?
4. Where do I complete the official process or get human help?

RePlate provides navigation, not a final eligibility decision. Never block someone from applying because of our screening result. A retailer accepting SNAP does not provide free groceries to someone whose benefits are inactive; do not present the map as immediate food relief.

### 1.3 Novelty and alternatives

**Honest novelty assessment:** Eligibility checking, application guidance, and retailer mapping already exist. Their combination with a chatbot is a weak originality claim.

| Existing option | What it already offers | RePlate hypothesis to test |
| --- | --- | --- |
| ACCESS NYC | Benefits screening and application information [S4–S5] | A narrower recovery journey may reduce irrelevant questions |
| HRA ABAWD guide | Compliance options, exemption checker, and reporting guidance [S6] | A case-specific checklist may make the next action easier to identify |
| ACCESS HRA | Official application and case-management destination [S2, S5] | Preparation before the official handoff may reduce confusion |
| USDA retailer locator | Nearby authorized retailers and downloadable location data [S7] | Retailers may be useful alongside the recovery plan, but mapping is not novel |
| General-purpose LLM | Flexible explanations; results depend on supplied context | Versioned rules, constrained outputs, and traceable actions may improve reproducibility |

**Proposed differentiator:** An auditable recovery plan that changes when relevant case facts change, with each action tied to a reviewed source and a visible unresolved-question state.

**Demo proof:** Change “the whole case closed” to “the household still receives SNAP.” Show the official handoff and checklist change, along with the reason. Repeating identical inputs must produce the same pathway and actions, even if AI wording varies.

**Scrutiny questions:** Is this materially easier than the official guide? Can a user explain their next step afterward? Does AI improve comprehension enough to justify its latency and variability? Would the product still help if the map disappeared?

### 1.4 MVP priorities

| Priority | Feature | Acceptance condition |
| --- | --- | --- |
| P0 | Structured recovery assessment | Covers the agreed recovery branches; every uncertain question has an “I'm not sure” choice |
| P0 | Personalized action plan | Ordered actions, rationale, relevant preparation items, source links, and official handoff |
| P0 | Sources and uncertainty | Reviewed date/rule version shown; unsupported or ambiguous cases route to official help |
| P0 | Official handoff | Application/case-change/help links work; user can bypass the assessment |
| P1 | Gemini explanation of the plan | Uses only the approved plan and source excerpts; does not change route or invent requirements |
| P1 | SNAP retailer list/map | Real validated data, location search, source date, empty/error states |
| P2 | ElevenLabs read-aloud | Optional playback of the reviewed checklist text; text remains usable without audio |

P0 is the minimum complete product. For a Gemini prize submission, P1 Gemini must also work live. Integrate Gemini early using a fixed approved plan; expand only after the complete journey works. The map is secondary and is cut before recovery navigation.

**Out of scope:** Complete SNAP income/immigration/student eligibility calculations; application submission; account creation; uploaded notices or documents; OCR; open-ended benefits chatbot; benefit-amount prediction; automated appeals; notifications; multilingual generation; live agency integration; guaranteed fresh-produce inventory.

### 1.5 User flow

1. **Start:** “I lost SNAP and need help with next steps.” Show an immediate official application/help link.
2. **Assess:** Ask about NYC location, whether loss was attributed to ABAWD rules, whether the whole case closed, and any supported circumstance that changes the pathway. Ask only questions used by a reviewed rule.
3. **Resolve uncertainty:** If the reason or case status is unknown, explain where to check and offer HRA help. Do not assume ABAWD noncompliance.
4. **Review plan:** Show the suggested route, why, preparation checklist, sources, and unanswered questions.
5. **Explain:** Optional Gemini explanation of a selected action in plain language.
6. **Act:** Open the appropriate official service; completion of our checklist does not mean an application was submitted or approved.
7. **Explore retailers:** Optional separate ZIP/location search, with authorized-retailer list and map if implemented.

Use short screens, familiar language, keyboard-accessible controls, readable mobile layouts, and text labels for all states. Preserve answers when stepping backward; provide a clear reset action.

### 1.6 Recovery branches to review before coding

These are navigation categories, not implemented eligibility rules.

| Case information | Candidate pathway | Review requirement |
| --- | --- | --- |
| Whole case closed after ABAWD-related loss | Reapplication guidance | Verify reset-period guidance and current official application steps [S2–S3] |
| Household still receives benefits; member removed | Case-change guidance | Verify the head-of-household process [S2, S6] |
| Circumstances may support an exemption | HRA exemption-review guidance | Use the official checker/help route; do not infer a diagnosis or promise an exemption [S6] |
| Loss reason or case status unknown | Clarification and human help | No guessed route; show how to check official case information |
| First-time applicant, outside NYC, or unsupported issue | Official resources | Clearly indicate the limit of this recovery prototype |

Unknown answers must remain unknown. Multiple possible actions may coexist; route selection must not erase an unresolved exemption question. Do not encode a universal volunteer-hours rule: recovery and ongoing-compliance guidance require separate review.

### 1.7 Tracks and sponsor strategy

Event prize categories are confirmed on Devpost; the fit assessments below are our judgments [S8].

| Target | Proposed position | Evidence we need in the demo |
| --- | --- | --- |
| Best Health Hack | Primary thematic fit: access to nutrition assistance | Clear human need and a complete recovery journey |
| Best Overall Hack | Broader target | Coherent product, reliable execution, memorable branching example |
| Best Use of Gemini API | Primary sponsor target | Real grounded explanation that makes a specific action easier to understand |
| Best Use of ElevenLabs | Stretch only | Useful read-aloud interaction; integrated playback must work |
| Best Financial Hack | Possible secondary fit | Benefits access has household financial relevance; confirm organizers' expectations |

Do not reshape the MVP to force Solana, Presage, Tiger Data, or Snowflake into it. Review sponsor requirements before selecting submission categories. AI helps explain an approved plan; the rules determine its actions.

## 2. Technical specification

### 2.1 Proposed stack

| Layer | Default | Reason |
| --- | --- | --- |
| App and API | Next.js + TypeScript, Route Handlers | Both teammates already have Next.js experience; one deployable application |
| Hosting | Vercel | Existing familiarity and simple deployment workflow |
| Recovery logic | Versioned JSON/TypeScript rule bundle | Small, inspectable, repeatable navigation logic |
| AI explanation | Gemini API, server-side | Explain selected reviewed actions in plain language |
| Retailer data | Validated static snapshot, server-side | Avoid database provisioning for a read-only hackathon dataset |
| Mapping | Leaflet + OpenStreetMap, if map retained | Straightforward optional location display; keep attribution |
| Database | None initially | No accounts or persisted case records; add Supabase only for a demonstrated need |

This is a proposed implementation choice. FastAPI, a vector database, and a multi-agent system are not required by the scoped MVP.

### 2.2 Architecture and trust boundary

- Browser collects bounded assessment answers and holds checklist state in memory.
- Server validates input and evaluates the reviewed rules using the server's assessment date.
- Rule evaluation produces pathway, ordered action IDs, unresolved items, and source IDs.
- Gemini receives only the selected approved action, minimal relevant context, and curated source excerpts. Its output is explanation text, never new route/actions.
- Server validates response structure and source IDs against the supplied allowlist. Citation validation alone does not establish factual correctness; manually review generated examples and keep the surface narrow.
- If Gemini fails, times out, or returns unsupported content, use the reviewed explanation template.
- Retailer lookup runs independently of assessment and AI. Do not send location to Gemini.

### 2.3 Minimal data model

| Object | Minimal fields | Persistence |
| --- | --- | --- |
| Assessment | `locationScope`, `lossReason`, `caseStatus`, supported tri-state circumstance flags | Request/browser memory only |
| RecoveryPlan | `pathway`, `actionIds`, `unresolvedItems`, `sourceIds`, `ruleVersion`, `assessedAt` | Request/browser memory only |
| Action | `id`, `title`, `rationale`, `preparationItems`, `officialUrl`, `sourceIds` | Reviewed versioned bundle |
| Source | `id`, `title`, `url`, `excerpt`, `reviewedAt`, effective dates where applicable | Reviewed versioned bundle |
| Rule | `id`, conditions, action references, `sourceIds`, `reviewedAt`, effective dates | Reviewed versioned bundle |
| Retailer | `id`, `name`, `address`, `latitude`, `longitude`, `type`, `source`, `dataAsOf` | Optional validated snapshot |

Use `yes | no | unknown` for uncertain facts. No database schema beyond these objects is needed unless persistence becomes part of scope.

### 2.4 API contracts

| Endpoint | Input | Output / failure behavior |
| --- | --- | --- |
| `POST /api/assessment` | Validated bounded assessment fields | Deterministic `RecoveryPlan`; malformed input returns 400; unsupported facts yield a clarification/help plan |
| `POST /api/explain` | Assessment fields and selected `actionId` | Server recomputes approved plan; returns explanation, approved source IDs, and `ai` or `template` origin |
| `GET /api/retailers` | Optional validated coordinates, bounded radius and result limit | Retailer list with data date and approximate distance; empty results are explicit |

Keep API keys server-side. Cap input sizes and explanation output; prevent arbitrary URL fetching. Coordinates must be finite and in valid ranges. Postal-code lookup may use a reviewed NYC ZIP-centroid file; label distances approximate, not walking time. If lookup data is unavailable, use a named-neighborhood demo selection or the official locator.

### 2.5 Evidence and data readiness

- Build a small curated source bundle from [S2–S6], rather than ingesting the entire benefits domain.
- Every rule/action must point to a reviewed source. Confirm any apparent conflict between reset-period and older recovery guidance before publishing that branch.
- Define the prototype's supported date/scope. If a rule is outside its reviewed effective period or cannot be verified, return official guidance rather than evaluating it.
- The previously discussed approximately 8,600 retailer records are a team-reported dataset size. File location, provenance, snapshot date, geography, valid coordinates, duplicates, and current authorization still need inspection.
- USDA distinguishes current locator data from historical authorization data [S7]. Do not accidentally treat every historically authorized store as currently accepting SNAP.
- Do not infer fresh-produce availability, opening hours, or accessibility from authorization or store type. Unsupported labels must be omitted.

### 2.6 Privacy and reliability

Collect only broad facts required for the supported flow. Do not request names, SSNs, case IDs, exact addresses, diagnoses, income documents, or account credentials. Broad circumstance flags can still be sensitive; avoid logging assessment bodies and keep them out of analytics.

Keep checklist progress in memory for the MVP. Use fictional people in demos. No uploaded documents or saved profiles. Model calls should receive the minimum context needed; do not claim the interaction is anonymous merely because no name is requested.

## 3. Execution plan

### 3.1 Ownership and milestones

Assign names before implementation. Integrate early through an agreed API response, then one live end-to-end scenario.

| Workstream | Proposed owner | Deliverable |
| --- | --- | --- |
| Rules, source review, API, Gemini | Builder A — TBD | Reviewed branches, stable contracts, explanation fallback |
| Assessment UI, checklist, optional map | Builder B — TBD | Complete mobile journey and error states |
| Data audit, validation, deployment, pitch | Both | Trustworthy demo and submission |

**Deadline correction:** Devpost currently lists **Sunday, October 11, 2026, 10:00 a.m. EDT** [S8]. Use this earlier deadline rather than the previously discussed noon assumption; reconcile any organizer updates before changing the schedule.

| Milestone | Target, America/New_York | Completion evidence |
| --- | --- | --- |
| Scope and evidence review | First 60 minutes after coding begins | Supported branches, owners, source bundle, and cut policy agreed |
| First deployment and API integration | Friday evening | One assessment reaches a real server-produced plan |
| Core journey complete | Friday 11 p.m. | Assessment → checklist → source → official handoff works |
| Gemini integration and branch verification | Saturday morning | Live approved-action explanation plus template fallback |
| Differentiation / optional retailer view | Saturday afternoon | Changed case fact visibly changes plan; audited data if retained |
| Feature freeze and rehearsal | Saturday 9 p.m. | No new scope; fix blocking defects and rehearse |
| Final verification and code freeze | Sunday 8:30 a.m. | Deployed demo and submitted repository agree |
| Internal submission target | Sunday 9 a.m. | Submission complete, leaving a one-hour buffer |

Plan roughly six hours of sleep each night. If behind, reduce scope at checkpoints instead of extending every workstream.

### 3.2 Cut policy and fallbacks

Cut in this order: ElevenLabs → map rendering → retailer lookup → extra supported branches. Preserve a complete, accurately sourced recovery pathway and an explicit unsupported-case fallback.

| Blocker | Response |
| --- | --- |
| Rule is unclear or contradictory | Remove that automated branch; link official help and record the issue |
| Gemini is unavailable or unreliable | Reviewed template; show fallback origin; do not represent it as a live model call |
| Map tiles or location lookup fail | Plain retailer list or official locator link |
| Retailer dataset cannot be validated | Omit custom retailer feature |
| Database work delays integration | Keep versioned static bundles |
| Deployment fails near cutoff | Fix deployed core first; keep a labeled recording as backup for explanation, not as a substitute for required live judging |

### 3.3 Verification that matters

- [ ] Closed-case and household-member scenarios produce distinct, source-supported actions.
- [ ] Unknown loss reason/status and unsupported cases never produce guessed eligibility decisions.
- [ ] Repeating inputs produces identical route/action/source IDs.
- [ ] Relevant changed facts update the plan without preserving stale checklist items.
- [ ] Rules outside supported dates fall back safely to official guidance.
- [ ] Gemini cannot change pathway or checklist; fabricated sources and outage cases trigger fallback.
- [ ] Official links and source links work; no invented submission/status integration.
- [ ] Mobile/keyboard navigation, back/reset actions, and error states work.
- [ ] If retained, retailer coordinates/geography, provenance, result limits, and no-results behavior are checked.
- [ ] No assessment bodies or secrets appear in logs or client bundles.

Use fictional scenario fixtures for consequential branching and AI failure tests. Do not expand testing into a large framework before the journey works.

### 3.4 Demo and submission

**Proposed 90-second demo:**

1. **0–15s:** Introduce a fictional NYC resident with an ABAWD-related SNAP loss.
2. **15–40s:** Complete the short assessment and show the next-action checklist.
3. **40–60s:** Open a source and use Gemini to explain one approved action.
4. **60–75s:** Change case status; show the plan change and rationale.
5. **75–90s:** Show the official handoff; optionally show retailer access. State the prototype's supported scope.

**Pitch draft:** “RePlate helps New Yorkers who lost SNAP turn confusing recovery guidance into a clear, source-backed next step. A structured assessment builds a reproducible action plan, Gemini explains it, and users complete the official process through HRA.”

Devpost lists Creativity, Completeness, Presentation, Alignment With Track, and Design; it requires a live demo for track awards and a GitHub code link for software [S8]. The page also warns against code pushed before the event starts or after the deadline. Confirm permitted reuse of the existing dataset and disclose pre-existing assets; this planning document is not a claim that the implementation was built during the event.

- [ ] Public/deployed demo URL and repository link recorded.
- [ ] `README.md` includes setup, environment-variable names, implemented features, and limitations.
- [ ] Submission describes actual sponsor integration and pre-existing data/assets.
- [ ] Real AI calls, reviewed templates, mock scenarios, and omitted features are accurately labeled.
- [ ] Both teammates can demonstrate the core journey and answer “why not use the official guide or ChatGPT?”

## 4. Decisions and unresolved questions

### 4.1 Proposed decision log

| Decision | Draft position | Status |
| --- | --- | --- |
| Product center | SNAP recovery navigation | Carried forward from evaluation |
| Eligibility scope | Triage supported recovery pathways; defer full eligibility screening | Proposed clarification |
| Differentiation | Reproducible branching plan with traceable actions | Hypothesis to validate |
| AI responsibility | Explain approved actions; never decide eligibility or route | Carried forward |
| Stack | Next.js / TypeScript / Vercel | Proposed default based on team experience |
| Persistence | No accounts/database initially | Proposed scope cut |
| Retailers | Secondary feature; no fresh-produce claim | Carried forward |
| Sponsor | Gemini first; ElevenLabs stretch | Carried forward |

### 4.2 Questions to resolve together

| Priority | Question | Evidence / decision needed | Owner |
| --- | --- | --- | --- |
| Before coding | Exactly which recovery branches will we support? | Review sources and approve fictional fixtures | Both |
| Before coding | What is simpler here than the official guide? | Walk through both flows and name the saved effort | Both |
| Before coding | Can we substantiate each plan action for the reset period? | Resolve source conflicts; remove unsupported actions | Builder A |
| Before map work | What is in the retailer dataset? | Inspect provenance, dates, geography, coordinates, authorization | TBD |
| Before scope expansion | What if the user needs food today with no active benefits? | Consider a clearly separate official food-help link; defer a new resource directory | Both |
| Before final pitch | Does Gemini improve understanding of an action? | Small usability check; observe next-step comprehension | Both |
| Before submission | Which prize requirements and reuse rules apply? | Read current event/sponsor instructions and organizer updates | Both |

### 4.3 Success criteria and claim discipline

**Hackathon success:** Complete reliable journey, demonstrable branching behavior, working Gemini integration if claimed, and submitted code/demo before cutoff.

**Product-validation target:** In a small informal test, users can identify the recommended next step and its official destination without coaching. Set the sample size and time target before testing; record failures as well as successes.

Do not claim actual benefit restoration, reduced food insecurity, user adoption, first-of-its-kind novelty, dataset exclusivity, or fresh-produce availability without evidence. Do not reuse the earlier 1.8 million SNAP-recipient figure without a current source. Checklist completion and outbound clicks are not confirmed application submission or approval.

## 5. Source register

Public sources checked October 9, 2026. Team choices and proposed implementation details above are not agency instructions. Recheck time-sensitive guidance before the final demo.

| ID | Source | Use |
| --- | --- | --- |
| S1 | [NYC Mayor's Office: SNAP recovery outreach](https://www.nyc.gov/mayors-office/news/2026/10/mayor-mamdani-launches-citywide-push-to-get-snap-benefits-back-t) | Approximately 26,500 affected residents and outreach context |
| S2 | [HRA: ABAWD update](https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page) | October reset and recovery navigation |
| S3 | [HRA: Community updates](https://home4.nyc.gov/site/hra/partners/community-updates.page) | New compliance period; continued eligibility conditions |
| S4 | [ACCESS NYC: Eligibility screener](https://access.nyc.gov/eligibility/) | Existing screening capability and agency decision boundary |
| S5 | [ACCESS NYC: SNAP](https://access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/) | Application overview and preparation information |
| S6 | [NYC: Monthly SNAP work rules](https://www.nyc.gov/main/services/snap-benefits/abawd) | Existing exemption checker and case/compliance guidance |
| S7 | [USDA: SNAP retailer locator](https://www.fna.usda.gov/snap/retailer-locator) | Existing locator; current versus historical datasets |
| S8 | [Hack Knight Fall 2026: Devpost](https://hack-knight-fall-2026.devpost.com/) | Deadline, prizes, judging criteria, submission requirements |

**Next team action:** Spend 30–60 minutes challenging sections 1.3, 1.4, and 4.2. Assign owners and choose supported branches, then implement the smallest complete journey.

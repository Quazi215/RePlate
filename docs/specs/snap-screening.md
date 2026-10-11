# RePlate: NYC SNAP screening journey

Draft synthesized October 10, 2026. Product decisions are confirmed in the conversation; the testing approach below awaits the check required by the to-spec workflow before GitHub publication. This document authorizes no application implementation, commit, push, or deployment.

## Problem Statement

NYC residents who have not applied for SNAP may be unsure whether their household could qualify, what the questions mean, and what to do next. RePlate's existing situation-based guidance does not answer that personal screening question. The team wants a complete screening experience whose usefulness and ease can be demonstrated to users and judges.

Easier use is a hypothesis to validate through observed completion, understanding, and ability to identify a next step. Positive feedback alone does not establish screening accuracy or improved access to benefits.

## Solution

Keep the homepage and use its existing **Find your next step** button to open a separate RePlate route. Users answer plain-language questions, receive a qualified screening result with reasons, and see preparation steps. The official application stays outside the question flow and appears only as an optional secondary link after the result.

The core promise is: understand whether SNAP may be available to your household, why, and what to do next. RePlate does not submit an application or issue an official eligibility decision. The first delivery is an English, phone-and-laptop demo due **October 11, 2026, at 11:30 a.m. America/New_York (EDT)**.

## User Stories

1. As a NYC resident, I want to start through Find your next step on the homepage, so that I can find the screening flow easily.
2. As a resident who has not applied, I want to complete screening within RePlate, so that I can understand my situation before opening the official application.
3. As a user, I want one focused step at a time, so that the form feels manageable.
4. As a user, I want plain-language questions and relevant examples, so that unfamiliar benefit terminology does not prevent me from answering.
5. As a user, I want a clear explanation of household and gross income, so that I supply the intended information.
6. As a user, I want follow-up questions only when relevant, so that I avoid unnecessary work.
7. As a user, I want to indicate that I do not know an answer, so that uncertainty is not converted into an assumed fact.
8. As a user, I want understandable validation messages, so that I can correct invalid information.
9. As a user, I want to review and change answers, so that the result reflects my current information.
10. As a user, I want a clear qualified result, so that I know whether screening suggests SNAP may be available.
11. As a user, I want reasons tied to my answers, so that I understand the result.
12. As a user with incomplete answers or circumstances outside the supported rules, I want an honest uncertainty result, so that RePlate does not invent an answer.
13. As a user whose answers do not establish likely eligibility, I want to know which factors matter, so that I can review my answers and seek further help.
14. As a user, I want to know that no application has been submitted, so that I do not mistake screening for applying.
15. As a user, I want a short preparation checklist, so that I know what information may be useful next.
16. As a user ready to apply, I want an optional official application link after my result, so that I can proceed when ready.
17. As a user, I want to know that I must enter information again on the official service, so that the handoff does not surprise me.
18. As a privacy-conscious user, I want screening without an account, identifiers, or documents, so that I do not disclose unnecessary information.
19. As a privacy-conscious user, I want my answers discarded when the session ends, so that RePlate does not retain a profile.
20. As a keyboard user, I want labeled controls, visible focus, and predictable navigation, so that I can finish without a pointer.
21. As a phone user, I want readable questions and results at narrow widths and enlarged text, so that I can complete the same flow as a laptop user.
22. As a demo participant, I want to complete the flow without coaching and explain my result and next step, so that the team can evaluate usability.
23. As a team member, I want several representative and boundary scenarios compared against official screening references, so that a successful single demo is not treated as proof of accuracy.
24. As a confused user in a later release, I want to type my own question about my result to Gemini, so that I can get help with my particular concern.

## Implementation Decisions

### Confirmed product scope

- Preserve the homepage entry point; change Find your next step from an in-page anchor to navigation to the new screening route. Keep the flow separate from the homepage clock graphic. The route name is an implementation detail; `/screening` is the proposed default.
- Replace the earlier bucket/questionnaire direction with personal screening for NYC residents who have not applied. Keep Explore secondary; new map work is outside this feature.
- Show plain-language questions one focused step at a time, with examples and conditional follow-ups. Include a short screening-versus-application explanation at entry and results.
- Show **You may qualify for SNAP** when the implemented screening rules support it. Show **We couldn't establish likely eligibility from your answers** when the comparison does not support that finding. Show **We need more information** for unknown or unsupported circumstances. All outcomes include reasons and next steps; none means approved, rejected, or officially ineligible.
- Results allow answer review. Changed answers must recompute the outcome and remove explanations or follow-ups that no longer apply. Restart clears answers and results.
- Place an official preparation checklist and optional secondary application link after the result. Do not embed, redirect automatically to, or submit the real application. Clearly explain that official-service information must be entered again.
- Collect only screening-relevant information. No accounts, names, Social Security numbers, exact birth dates, street addresses, or uploads. Keep answers only in page memory; refresh, restart, and ending the session clear them. No answers in URLs, storage, analytics, logs, or external requests in the initial local version.
- Deliver English copy with keyboard access, semantic labels/groups, visible focus, predictable focus after step changes, and layouts that work on phones and laptops.

### Proposed implementation approach and evidence boundary

- Reuse the current application, shared styling, and test tools. Keep screening rules separate from presentation as a small deterministic business-logic module. No new dependency, database, or public API is proposed.
- Do not make delivery depend on new NYC Screening API approval. Official account documentation estimates 1–2 business days. A local implementation of published screening guidance is the proposed fallback, not a claim that API parity has already been established.
- The published NYC guide documents a limited SNAP financial prescreen, not every eligibility rule. Its inputs include NYC residence, SNAP household size, whether all members receive SSI or Cash Assistance, whether a member is 60 or older/disabled/blind, out-of-pocket dependent-care costs, earned-income status, monthly gross household income, and child support paid. Use only inputs required by verified implemented branches.
- The guide describes an assistance-based branch and income comparisons using household-size tables at 200%, 150%, or 130%, depending on household circumstances. Failure to match produces uncertainty, not rejection. Translate its positive result as potential eligibility under the implemented screening checks.
- Before implementing numeric rules, reconcile the guide's September 2026 publication date and the October 2025 date inside its SNAP section against current official standards. New York's public application guidance now identifies standards effective October 1, 2026. Record the source, effective date, exact table values, comparison boundaries, and reviewed exclusions beside the rule data.
- Use only documented, reconciled rules. Do not infer undisclosed net-income budgeting, student exceptions, immigration restrictions, work compliance, household-composition exceptions, or larger-household rules from the published income prescreen. An unresolved input or rule required for a result yields an uncertainty outcome. Positive copy must identify the limited checks performed and remaining official review.
- The exact question inventory, conditional paths, and supported rule coverage must be mapped to current authoritative sources during the first implementation slice. This is an evidence task, not permission to invent product behavior. If the verified coverage cannot deliver a useful screening flow by the deadline, report that limitation and revise scope before implementing a materially different feature.
- Update conflicting delivery documentation and existing browser expectations as part of implementation. In particular, old assumptions about no financial inputs, an anchor-only entry, and a three-question journey inside the clock no longer describe this feature. Preserve unrelated homepage and Explore behavior.

## Testing Decisions

**Proposed seams requiring confirmation before publication:** the complete browser journey is the main acceptance seam. A focused input-to-result seam covers financial rules and boundary cases that would be cumbersome to exhaust through the browser. Use existing tools for both.

- Extend the existing SNAP browser verification for homepage entry, separate-route navigation, questions, relevant follow-ups, validation, result reasons, review/edit, restart, and official handoff. Test visible behavior and user outcomes rather than component state or internal helper structure.
- Use the existing Node test runner and TypeScript test compilation for deterministic screening input-to-result cases. Cover each supported rule branch, exact thresholds, amounts just below/above them, household-size boundaries, invalid numbers, unknown answers, conflicting information, and unsupported cases. No unit test calls a live official service.
- Verify stale branch answers cannot affect a revised result. Unknown information must never default to zero, no, a fabricated household size, or rejection.
- Verify no screening answers appear in URL parameters, browser storage, analytics, logs, or outbound requests. Refresh and restart must clear the flow.
- Exercise keyboard completion, step/result focus, labeled errors, 320px and 390px layouts, laptop layout, enlarged text, and reduced motion. Preserve existing navigation and legacy redirects.
- Update obsolete browser assertions narrowly and preserve checks for unrelated behavior. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and the focused browser verification during implementation. Report actual outcomes and unavailable checks.
- Before demo, compare several scenarios, including ordinary households, branch differences, threshold cases, and incomplete information, against current official references and ACCESS NYC where practical. Record source date, inputs, outputs, and unresolved discrepancies. Matching screening results establishes agreement with a reference, not official eligibility.
- Have the team's friend complete the form without coaching, explain the result, and identify the next step. Observe completion, confusion, and answer mistakes alongside perceived ease. A single participant does not establish general usability or policy accuracy.

## Out of Scope

- Official approval/rejection, application submission, case access, benefit restoration, or benefit-dollar estimates.
- Full eligibility adjudication beyond verified screening rules; negative conclusions inferred from an absent official screening result.
- Accounts, saved profiles, uploads, personal identifiers, database work, or new dependencies.
- Required NYC API integration, additional benefit programs, additional languages, and new Explore/map integration.
- Gemini or any LLM determining or changing eligibility results in the initial feature.
- Implementation, deployment, public promotion, or changes to existing issues as part of this specification-only request.

## Further Notes

### Follow-up after implementation: open-ended Gemini result help

Add Gemini integration after the core screener is implemented and verified. Give users a free-text question field and conversational follow-up so they can ask about their unique confusion. A button that merely generates a generic explanation does not satisfy this request.

Ground replies in the deterministic result, the relevant answers, and reviewed official guidance. Gemini explains the result and questions; it does not calculate, override, or guarantee eligibility. Keep the ordinary result explanation available without Gemini. Plan the necessary privacy disclosure for transmitting questions/context, minimal context, server-only credentials, and loading/error behavior in that follow-up's implementation scope. This note does not authorize transmitting user data in the initial local feature.

### Source and scope notes

- [ACCESS NYC results](https://access.nyc.gov/eligibility/results/) describe recommendations without guaranteed eligibility.
- [Official screening guidelines](https://github.com/CityOfNewYork/screeningapi-docs/blob/content/eligibility-guidelines.md) link Guide and Chart 1.47.0. The guide's SNAP section requires freshness reconciliation; a missing program does not prove ineligibility.
- [Official API account documentation](https://github.com/CityOfNewYork/screeningapi-docs/blob/content/getting-started.md) describes credential approval and distinct environments. API access and live behavior have not been tested.
- [Current New York SNAP application guidance](https://www.ny.gov/services/apply-snap) supplies dated income standards and explains that official eligibility requires applying. No table values are duplicated in this spec; implementation must review them directly.
- The feature replaces the product direction in [issue #11](https://github.com/Quazi215/RePlate/issues/11) and its implementation slices [#12](https://github.com/Quazi215/RePlate/issues/12) and [#13](https://github.com/Quazi215/RePlate/issues/13). Those issues remain unchanged; coordinate replacement before agents implement conflicting work.
- Published rule coverage and automated checks are still implementation work. This spec records intended behavior, not completed verification or demonstrated user impact. The submission target is a judge-ready demo; broader validation precedes public promotion.

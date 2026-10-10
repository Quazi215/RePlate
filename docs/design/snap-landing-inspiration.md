# SNAP awareness landing-page inspiration

Research date: October 10, 2026. Planning only; no application changes.

## Direction and evidence

P0 is a mobile-friendly infographic webpage for NYC SNAP recipients confused about benefit loss, especially work-rule closures. It explains the issue and links to official next steps. The custom form and grocery planner are deferred. This note proposes composition, not approved copy or implementation.

Brand basis: [RePlate design direction](../../REPLATE-DESIGN-DIRECTION.md) and [discovery review](discovery-review.md): cream `#F8F3E8`, forest `#234B36`, lime `#D9EF70`, tomato `#F26A3B`, transit blue `#3768DA`, locally hosted Atkinson. Preserve the compact masthead and readable hierarchy; the new awareness task does not need the discovery page's map-dominant composition. Branded headline treatments remain exploratory.

The three sources below were inspected through live page text/structure. No screenshots were inspected; their actual colors, spatial layout, responsive behavior, and accessibility are unverified. Proposed RePlate visual adaptations are design recommendations, not observations of these sites.

## Three useful references

| First-party reference | Observed content pattern | RePlate adaptation |
| --- | --- | --- |
| [ACCESS NYC SNAP](https://access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/) | A plain-language benefit title; an immediate application action; named sections for how it works, eligibility, documents, applying, and help. Application steps are sequenced; alternatives and assistance are explicit. | Use an everyday-language headline with a clear official handoff. Place a short numbered explanation before detailed resources. Separate understanding the change from submitting an application. |
| [Propel](https://www.propel.app/) | A short benefit-oriented headline, concrete task links, repeated actions across feature sections, and FAQ content. Benefits updates are a distinct user task. | Give each infographic section one clear purpose and action. Repeat the relevant official handoff after its explanation. Avoid copying its app-download funnel, testimonials, or scale claims into a public guidance page. |
| [NYC SNAP service guide](https://www.nyc.gov/main/services/snap-benefits) | Jump links; a work-rule notice; a sequenced application timeline; separate status checking, recertification, and help sections. Individual steps distinguish preferred and alternative channels. Immediate food help appears early. | Use short section links and a visible route for uncertain cases. Keep reapplication, status checking, and recertification distinct. Provide human assistance and immediate food resources without requiring users to finish the page. |

## Proposed mobile-first outline

1. **Compact RePlate masthead.** Brand plus an in-page “Get help” link. No account or custom form entry point in P0.
2. **Issue and next action.** A short headline about SNAP changes and what to do next; explicit NYC scope and dated source. Primary link to current official work-rule guidance; secondary link to check a case in ACCESS HRA. Any impact statistic needs a nearby source and must not suggest it describes the reader's case.
3. **What changed.** A short chronological infographic with text labels. Use cream/forest as the base and lime for the key date or action. Tomato supplies small decorative accents, not small essential text.
4. **Choose the relevant official path.** Three clearly labeled links: work-rule benefit loss; unsure why benefits stopped; recertification notice. These are navigational choices, not a screener or personalized determination.
5. **Know the application steps.** A compact numbered sequence with official instructions, including follow-up actions; make clear that submission alone does not establish approval or restored benefits.
6. **Need someone to help?** Official assistance, language resources, and immediate food support. Avoid hiding the only assistance path in a footer or accordion.
7. **Sources and freshness.** Visible last-reviewed date and source links. RePlate guidance must be distinguishable from HRA's official services.

Use HTML text and simple code-native diagrams/icons so the infographic reflows and remains readable by assistive technology. Suggested desktop composition: explanation beside a compact next-step panel; on phones, explanation followed by the panel. Forest-on-cream and forest-on-lime follow the existing contrast guidance. Avoid decorative full-screen heroes and a long animation-led narrative before the help links.

## Handoffs and unresolved decisions

- Prefer [HRA's current ABAWD page](https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page) for work-rule guidance. The parent research identified an older flyer with conflicting timing; verify the current copy before implementation and do not reproduce stale flyer instructions. This note did not independently resolve policy conflicts.
- [ACCESS HRA](https://a069-access.nyc.gov/accesshra/) is an official application/status destination linked by both city guides. Destination login and task completion were not tested.
- Decide whether the next artifact is a development-only preview or replacement of the public home page. Recommendation: preview first for outside feedback; current discovery release safeguards do not automatically authorize a public launch.
- Decide English prototype versus translated launch scope. Multilingual official links do not translate RePlate's own explanation.
- Confirm the chronological infographic and official-path links before visual implementation. Assign a content owner and a freshness/review process before public release.

No implementation, browser visual QA, user study, or end-to-end official submission test was performed. A simplified explanation can misroute users if it treats every closure as a work-rule closure; keep the uncertain-status path prominent.

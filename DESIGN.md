# RePlate Design System Specification

Status: Design direction confirmed by the project owner. Visual and accessibility validation remain pending.

This specification records the decisions agreed during the design interview. It governs the first-version interface for the existing NYC SNAP retailer search-to-directions journey; it does not change product scope or ranking behavior.

## Problem Statement

SNAP recipients comparing grocery destinations need an interface that is easy to read and operate on a phone. They must be able to compare estimated travel expenses, understand missing information, and get directions without unnecessary effort or judgment about their shopping choices.

RePlate currently has a minimal application scaffold without a reusable visual system. A consistent system is needed so forms, retailer comparisons, actions, and failure states remain calm, accessible, and predictable as the core journey is implemented.

## Solution

Create a calm, approachable, practical, and respectful design system for the core journey: enter a NYC ZIP code and travel preferences, compare SNAP-authorized retailers, and get directions.

Use a light theme, Atkinson Hyperlegible Next typography, blue primary actions, restrained orange branding, generous spacing, and a consistent single-column layout. Keep material limitations visible and put longer supporting explanations in an expandable section. Make loading, missing information, and recoverable errors understandable through text as well as styling.

## User Stories

1. As a SNAP shopper, I want a calm and respectful interface, so that I can compare destinations without feeling judged.
2. As a phone user, I want readable text and spacious controls, so that I can plan a shopping trip comfortably.
3. As a shopper, I want to search with my NYC ZIP code, so that I do not have to provide an exact home address.
4. As a shopper, I want labeled walking and bus choices, so that I can select my intended travel mode confidently.
5. As a shopper, I want an optional maximum-distance field, so that I can express a travel constraint when useful.
6. As a shopper, I want my search inputs together on one short screen, so that I can review them before searching.
7. As a shopper, I want a clear Find stores action, so that I know how to start the comparison.
8. As a shopper, I want useful validation messages, so that I know how to correct an invalid input.
9. As a shopper, I want validation to wait until I leave a field or submit, so that I am not interrupted while entering my ZIP code.
10. As a shopper, I want clear search progress, so that I know the application is working.
11. As a shopper, I want duplicate search submissions prevented while a request is pending, so that I do not accidentally repeat it.
12. As a shopper, I want my inputs retained after a failure, so that I can retry without re-entering them.
13. As a shopper, I want a search summary and Edit search action above results, so that I can understand and change my current choices.
14. As a shopper, I want my previous answers preserved when editing or stepping backward, so that changing a choice takes little effort.
15. As a shopper, I want vertically stacked retailer cards with consistent field order, so that I can scan and compare alternatives.
16. As a shopper, I want each result to prioritize the store name, estimated travel fare, and travel time, so that I can assess practical options quickly.
17. As a shopper, I want route-distance labels to distinguish straight-line proximity from routed distance, so that I understand what the displayed value means.
18. As a shopper, I want fare estimates labeled directly, so that I do not mistake an assumption for my guaranteed charge.
19. As a shopper, I want to see that grocery prices and stock are unknown, so that I do not mistake the comparison for verified total shopping affordability.
20. As a shopper, I want missing values explicitly labeled, so that I do not have to interpret blanks or dashes.
21. As a shopper, I want unverified routes clearly identified, so that I can distinguish them from confirmed route results.
22. As a shopper, I want expandable sources and assumptions, so that I can inspect how estimates and ordering were produced.
23. As a shopper, I want a clear Get directions action for each retailer, so that I can act on my chosen destination.
24. As a shopper, I want the retailer list to remain useful without a map, so that a map failure does not block comparison.
25. As a shopper, I want no-results messages distinguished from service failures, so that I understand whether to change my search or retry.
26. As a keyboard user, I want every control operable with a visible focus indicator, so that I can complete the entire journey.
27. As a screen-reader user, I want labeled controls, associated errors, and announced search status, so that I receive the information needed to complete the journey.
28. As a user with low vision, I want legible typography, sufficient contrast, and layouts that support enlarged text, so that I can read all essential information.
29. As a user who has difficulty with precise tapping, I want generous primary touch targets, so that I can activate controls reliably.
30. As a user who cannot distinguish certain colors, I want states expressed in text, so that color is never my only source of information.
31. As a user who prefers reduced motion, I want that preference respected, so that interaction feedback remains comfortable.
32. As a desktop user, I want the same clear single-column journey, so that the interface remains predictable across devices.
33. As a RePlate contributor, I want reusable visual and interaction rules, so that new core components remain consistent.

## Implementation Decisions

### Scope and reusable components

- Cover foundations, forms, buttons, retailer cards, expandable explanations, and loading, empty, error, warning, and success states for the core journey.
- Keep implementation within the existing application architecture. This specification introduces no database schema changes, API contract changes, or ranking changes.
- Reuse existing conventions and suitable utilities. The component, styling, and animation choices below are confirmed; no new package installation or icon package is selected by this specification.

### Component, styling, and animation choices

- Build the first version with native semantic HTML controls and reusable React components. Use native buttons, labeled inputs, radio controls for travel mode, and disclosure elements where they fit the required behavior.
- Keep the existing CSS setup. Express the shared colors, typography, spacing, and shape rules as CSS custom properties (design tokens), and reuse them across components.
- Use CSS transitions for subtle interaction feedback and respect reduced-motion preferences. No JavaScript animation library is needed for the agreed first-version behavior.
- Reserve Radix Primitives for a demonstrated need for complex controls that native HTML cannot reasonably satisfy. Radix is not required for the initial forms, buttons, retailer cards, or expandable explanations; any package addition remains subject to repository approval requirements.
- Do not introduce shadcn/ui, Tailwind CSS, or a JavaScript animation library for v1. Revisit these choices only if a concrete requirement warrants the additional tooling.
- Native HTML and any future primitives must still be verified against the accessibility acceptance criteria; library selection does not establish conformance.

### Palette and theme

The first version supports a light theme only.

| Role | Value | Use |
| --- | --- | --- |
| Primary blue | `#1D4ED8` | Primary actions and selected states |
| Orange accent | `#F97316` | Restrained branding, warmth, and emphasis |
| Page background | `#FFFDF8` | Warm neutral canvas |
| Content surface | `#FFFFFF` | Cards and other content surfaces |
| Main text | `#172033` | Essential content and headings |
| Supporting text | `#475569` | Supplementary readable content |

- Use white text on primary blue and dark text on orange backgrounds where those pairings apply.
- Calculated contrast for the approved pairs is approximately 6.7:1 for white on blue and 5.8:1 for main text on orange. Orange on white is approximately 2.8:1 and must not be used for normal text.
- Permit additional dark red, dark amber, and dark green only for actual errors, warnings, and confirmed successes, respectively, on pale matching backgrounds. Do not introduce unrelated decorative colors.
- Pair every status treatment with an explicit text label. Branding orange must not also carry warning semantics.
- Exact status, border, and interaction-state shades remain to be selected and contrast-tested within these approved roles; they are not additional brand colors.

### Typography

- Use Atkinson Hyperlegible Next throughout the interface, with a sans-serif fallback when the font is unavailable.
- Use sentence case, familiar words, and a restrained size hierarchy.

| Content | Size | Weight |
| --- | --- | --- |
| Page heading | 32px | Bold |
| Section heading | 24px | Bold |
| Store name | 20px | Semibold |
| Body text and controls | 18px | Regular |
| Supplementary source/date details | 16px | Regular |

- Use approximately 1.5 line spacing for body text.
- Keep fare estimates, important limitations, and errors at body size. Use weight to emphasize key comparison values.
- Use scalable sizing and wrapping so browser text enlargement does not hide content or actions.
- Verify the font in real headings, long store names, addresses, ZIP codes, fares, and buttons before treating visual validation as complete.

### Spacing, shape, and layout

- Use a spacing scale based on 4px increments and generous breathing room rather than maximizing results per screen.
- Start with approximately 8px corners for controls and 12px corners for retailer cards.
- Use clear borders and minimal shadows. Reserve shadows for elements that actually float above content.
- Keep the journey in a centered single column on phones and larger screens.
- Use approximately 16px side padding on phones, 24px on larger screens, and a maximum content width around 768px.
- Stack retailer cards vertically with consistent field order; do not hide alternatives in a horizontal carousel.
- Keep any optional map secondary to the readable retailer list.
- Put the search summary and Edit search action above results, preserving existing answers during editing.

### Forms, actions, and interaction states

- Show the labeled ZIP field, two large labeled walking/bus choices, optional distance field, and one Find stores action together on a short screen.
- Use one visually dominant action per form or retailer card. Find stores and Get directions use solid blue; supporting actions use outlined or text treatments.
- Define default, hover, pressed, keyboard-focus, loading, and disabled states for applicable controls. Selected travel-mode choices need an explicit selected state.
- Make keyboard focus clearly visible with a dark outline separated from the control by a light gap; verify its visibility on all adjacent surfaces.
- Validate after leaving the relevant field or submitting. Do not show errors while the user is still typing a ZIP code.
- Place errors beside their fields, associate them programmatically, and explain how to correct the input.
- During search, retain entered choices, prevent duplicate submissions, show Finding stores…, and announce progress to assistive technology.
- After a recoverable search failure, retain inputs and offer Try again. Distinguish invalid input, outside-NYC coverage, no matches, and service failures according to existing product behavior.
- Preserve answers when stepping backward and keep the existing clear reset requirement.
- Limit motion to subtle feedback, respect reduced-motion preferences, and avoid animation that delays searching or distracts from results.

### Comparison hierarchy and transparency

- Prioritize store name, estimated travel fare, travel time, and Get directions within each result. Keep comparison fields in consistent positions.
- Make distance and route details available below the primary comparison information, with accurate labels for approximation and route evidence.
- Keep Grocery prices and stock unknown visible in the comparison. Do not imply verified cheapest groceries or lowest total shopping expense.
- Label fare estimates directly, including Estimated round-trip fare when applicable. Preserve the product distinction between a round-trip fare assumption and verification of a return route.
- Display missing information where its value would normally appear, using explicit labels such as Travel time unavailable or Route not verified.
- Keep unverified routes distinguishable from verified matches, consistent with the existing product specification.
- Put longer fare assumptions, source dates, ranking explanations, and supporting evidence in an expandable How we estimate this section. Expansion must be keyboard accessible and expose its state to assistive technology.
- Do not hide essential uncertainty, errors, or unavailable values inside that section.

### Voice, icons, and branding

- Use calm, direct, conversational language that tells users what to do next.
- Preferred labels include Enter your NYC ZIP code, Find stores, Get directions, Edit search, and Try again.
- An input-error example is Enter a 5-digit ZIP code.
- Avoid stigmatizing wording or judgment about current shopping choices.
- Use simple walking, bus, location, and directions icons paired with text. Icons must not be the sole labels for essential actions.
- Concentrate branding in the header and avoid decorative imagery in the comparison area. No separate logo design or icon family was agreed.

## Testing Decisions

- Validate observable behavior at the browser-level search-to-directions journey, the highest existing user-facing boundary. Use this boundary for form, result-card, explanation, and recovery behavior; no new internal testing seam is proposed.
- The current scaffold has no checked-in test suite or test script. No new test framework is selected by this specification; obtain approval before adding test dependencies or replacing tooling.
- Use deterministic representative retailer and route data for repeatable checks. Automated UI checks must not rely on live external APIs. Provider integration validation remains a separate product requirement.
- Check all approved text/background pairs and applicable interaction/status states for contrast. The initial palette calculations do not establish application-wide accessibility conformance.
- Use WCAG 2.2 AA as the acceptance target, including keyboard access, meaningful labels, visible and unobscured focus, screen-reader support, reflow, and text resizing. Primary controls should aim for at least 44 × 44 CSS-pixel touch targets as an additional usability choice.
- Exercise valid search, invalid ZIP, outside-NYC input, no matches, provider failure, retry, editing, reset, missing estimates, and unverified routes. Verify that the appropriate message and next action appear and inputs are preserved where required.
- Check that loading prevents duplicate submissions and that status changes and field errors are available to assistive technology.
- Check that How we estimate this opens and closes by keyboard, reports its expanded state, and never contains the only presentation of material limitations.
- Review real-content layouts on narrow phone and desktop viewports, with long names and addresses, enlarged text, and optional maps unavailable. Essential content and actions must remain available without horizontal card navigation.
- Check icon/text combinations, reduced-motion behavior, and font fallback when the chosen font is unavailable.
- Verify native control semantics, selected travel-mode announcements, and keyboard operation of disclosure elements. Check CSS transition behavior with reduced motion enabled and shared tokens across component states.
- Test external behavior rather than internal component structure, CSS class names, or incidental implementation details. Visual review complements behavioral checks; it does not replace accessibility checks.
- When application implementation occurs, run the repository's existing lint, type-check, and build commands in addition to the applicable UI checks. This documentation task does not implement or validate the application.

## Out of Scope

- Dark mode and additional themes.
- Marketing pages, a full brand identity or logo project, decorative comparison imagery, and unrelated color additions.
- Driving, eligibility screening, benefits recovery, accounts, saved profiles, or other changes to the existing MVP scope.
- Verified grocery prices, stock guarantees, cheapest-basket claims, and guarantees of personal fare charges.
- Changing search constraints, fare arithmetic, retailer ordering, routing providers, or backend contracts.
- Making maps or AI assistance required for the core journey.
- Introducing dependencies, replacing tooling, or making architectural changes without separate approval.
- Application implementation, committing, pushing, or deployment as part of producing this specification.

## Further Notes

- The owner confirmed this direction at the conclusion of the design interview. The font choice supersedes the earlier proposal to keep Arial/Helvetica as the primary typeface.
- The existing product specification remains authoritative for retailer data, routing evidence, ranking, fare assumptions, and coverage. This document specifies their presentation.
- Remaining work is visual and accessibility validation: confirm the selected typography against real content, choose supporting status/border/state shades within the approved roles, and verify complete component states and enlarged-text layouts.
- Font selection alone does not establish accessibility, and the specification is not a claim that the current scaffold meets WCAG 2.2 AA.
- References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [Atkinson Hyperlegible Next, Braille Institute](https://www.brailleinstitute.org/freefont/).

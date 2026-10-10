## Agent skills

### Issue tracker

Use GitHub Issues for RePlate work; read `docs/agents/issue-tracker.md`
before creating, reading, or updating tickets.

### Triage labels

Read `docs/agents/triage-labels.md` before applying triage labels.

### Domain docs

This is a single-context repository. Read `docs/agents/domain.md`
before exploring domain terminology or architectural decisions.

## Working conventions

### Before planning or implementing

- Read relevant code, tests, and repository docs; use them to answer
  questions and identify existing patterns and commands before proposing
  new ones.
- Inspect the working tree and preserve unrelated changes. Never revert
  or overwrite work you did not create.
- Match the process to the task: proceed directly for small, clear fixes;
  plan first for ambiguous features or consequential changes.

### Planning

- For ambiguous features, clarify behavior, scope, constraints, and
  acceptance criteria before implementing. Separate confirmed requirements
  from assumptions; do not silently decide product behavior.
- Ask focused questions only about unresolved decisions. Recommend a
  default and explain its tradeoff.
- Propose the simplest approach that fits the existing architecture;
  discuss alternatives only when tradeoffs matter.
- Break substantial work into independently verifiable, end-to-end slices.
  Include affected areas, implementation order, verification, and key risks.
- Obtain approval before adding dependencies, replacing tooling, changing
  public contracts or database schemas, or making architectural changes.
- For planning-only requests, leave application code unchanged.

### Implementation

- Implement the agreed scope using existing conventions. Avoid unrelated
  refactors, cleanup, speculative features, and premature abstractions.
- Complete and verify one slice at a time. If new evidence invalidates the
  plan or materially expands scope, pause, explain, and propose a revision.
- Commit, push, deploy, or perform destructive operations only when
  explicitly requested.

## Repository conventions

### Naming and formatting

- TypeScript: camelCase variables/functions; PascalCase types, classes,
  and React components.
- Match file naming in the affected package and checked-in formatter,
  linter, and import-order rules.

### Structure and architecture

- Put new code beside the code responsible for that behavior; respect
  module boundaries and dependency direction.
- Keep HTTP handling separate from business logic and database access.
- Reuse fitting utilities rather than creating competing implementations.

### Testing, types, and errors

- Use existing test frameworks and test-directory conventions. Add
  regression tests for bug fixes; use red-green-refactor for testable
  behavior changes where practical: observe a focused test fail as
  expected, implement the minimum change, then refactor with tests passing.
- Test observable behavior, meaningful boundaries, and relevant error
  cases rather than incidental implementation details. Keep tests
  deterministic and unit tests free of live external API calls.
- Follow repository type-checking requirements, validate external input
  at system boundaries, and use existing error types and API error formats.
- Never weaken tests, disable checks, suppress type errors, or swallow
  failures to make verification pass.

### Tooling and dependencies

- Use the existing package manager and lockfile.
- Do not manually edit generated files.

### Verification and handoff

- Run relevant tests and repository-prescribed formatting, lint,
  type-check, and build commands for the affected code.
- Review the final diff for correctness, unnecessary or accidental
  changes, and exposed secrets; remove only accidental changes you made.
- Report what changed, the exact checks run and their outcomes, and any
  remaining risks or decisions. Explain checks that could not run and
  anything left unverified; never imply an unrun check passed.

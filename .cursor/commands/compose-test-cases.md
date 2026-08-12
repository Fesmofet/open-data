# Compose Test Cases

Derive a test case catalog from an **approved feature plan** before implementation. Do not write production code or implement tests — only analyze the plan and compose test cases.

## Context

- **Testing rules:** `docs/standards/testing-rules.md` — read fully before composing.
- **Repo testing mechanics:** `AGENTS.md` § Testing (Jest, Nx, E2E layout, local Postgres isolation).
- **Plan files:** `.cursor/plans/` (gitignored) — append the `## Test cases` section to the plan file.

## User Instructions

$ARGUMENTS

**Important:** Respect user instructions over default behaviors below (e.g. "chat only", "skip e2e", specific plan path).

## Prerequisites

- The feature plan is **already approved** by the user.
- This command produces a **test case catalog only** — no production code, no test implementation.
- Read [`docs/standards/testing-rules.md`](docs/standards/testing-rules.md) before composing. Do not duplicate the full rules here — apply them.

## Workflow

### 1. Locate the approved plan

Search in order:

1. Path from `$ARGUMENTS` (if the user provided one).
2. Plan file from the current session (after CreatePlan / plan mode in this conversation).
3. If no plan is found → **stop** and ask for a path or the plan content. Do not invent scope.

### 2. Read rules and related context

1. Read `docs/standards/testing-rules.md`.
2. Read the approved plan end-to-end.
3. If the plan references specs under `docs/`, read those for contracts and invariants — do not read production code to derive expectations.

### 3. Extract business logic elements

From the plan, identify and list explicitly (before test cases):

| Element | What to extract |
|---------|-----------------|
| **Contracts** | Preconditions, postconditions, observable side effects |
| **Invariants** | Conditions that must always remain true |
| **State transitions** | Allowed transitions and forbidden states |
| **Permissions** | Authorization, role gates, rejection cases |
| **Calculations** | Business rules, formulas, aggregations |
| **Integration boundaries** | DB, Redis, HTTP, blockchain, wallet, third-party adapters |
| **Critical user journeys** | Minimal E2E candidates from the plan |

Skip glue code and thin wrappers unless the plan marks them as non-trivial (testing rules §5).

### 4. Compose test cases

For each extracted element, write one or more test cases by priority:

| Priority | Focus |
|----------|-------|
| **P0** | Business rules, invariants, valid/rejected behavior, required and forbidden side effects |
| **P1** | Boundaries, malformed input, partial failures, idempotency, timeouts, unexpected dependency responses |
| **P2** | Glue code — only when explicitly in the plan and failure cost is non-trivial |

Each test case covers **one observable behavior** (testing rules §7):

```
- ID: TC-001
- Priority: P0 | P1 | P2
- Level: unit | integration | e2e
- Behavior: <behavior-oriented name>
- Preconditions: ...
- Input / action: ...
- Expected outcome: ... (explicit values — not "works" or "is defined")
- Side effects: required / forbidden
- Invariants: ...
- Rationale: why this level; what plausible defect would fail this test
```

**Level selection** (testing rules §4):

- **Unit** — default when the contract is clear and isolated.
- **Integration** — when the primary risk is incorrect collaboration between components.
- **E2E** — only for critical user outcomes named in the plan; keep the set small.

**E2E with Postgres (local):** never use the dev database (`.env`, local Docker Compose). Dedicated test instance with database name and password **`test`**. CI may use its own setup. Note this in rationale when an E2E case needs Postgres.

### 5. Reject anti-patterns while composing

Do not include test cases that would violate testing rules §10:

| Anti-pattern | Reject |
|--------------|--------|
| Always-green expectations | `is defined`, `is a string`, `does not throw`, `array is not empty` — unless that property is the actual contract |
| Mock-validation | Configure mock → pass through → assert mock value |
| Duplicated production logic | Expected values computed by reimplementing business rules in the test design |
| Conditional verification | One TC with branching logic that may skip assertions |
| Implementation-coupled | Private methods, internal call order, call counts, module structure |
| Coverage-driven filler | Cases whose only purpose is hitting uncovered lines |

For each composed case, confirm it would fail under a plausible wrong implementation.

### 6. Append to plan file

Add or **replace** (if it already exists) a `## Test cases` section at the end of the plan file.

Use this structure:

```markdown
## Test cases

_Composed by `/compose-test-cases`. Rules: [testing-rules.md](../../docs/standards/testing-rules.md)._

### Identified contracts and invariants

<!-- Bulleted summary extracted from the plan -->

### P0 — Business rules and invariants

| ID | Level | Behavior | Preconditions | Input | Expected | Side effects |
|----|-------|----------|---------------|-------|----------|--------------|
| TC-001 | unit | ... | ... | ... | ... | ... |

### P1 — Boundaries and failures

| ID | Level | Behavior | Preconditions | Input | Expected | Side effects |
|----|-------|----------|---------------|-------|----------|--------------|

### E2E — Critical journeys

| ID | Level | Behavior | Preconditions | Input | Expected | Side effects |
|----|-------|----------|---------------|-------|----------|--------------|

### Intentionally untested

| Behavior | Reason |
|----------|--------|

### Agent notes

- Nx projects to test: ...
- Commands: `pnpm nx test <project>`, `pnpm nx e2e <project>-e2e` (when applicable)
- Suggested modules / spec paths from the plan
```

If plan mode or permissions block file writes → output the full section in chat and ask the user to confirm append in agent mode.

### 7. Quality gate (planning stage)

Before finishing, confirm:

- [ ] Relevant contracts from the plan are covered.
- [ ] Important invariants are declared and have test cases.
- [ ] P0 includes both valid and rejected behavior where applicable.
- [ ] Boundary and failure cases (P1) were considered.
- [ ] E2E cases are limited to critical user outcomes.
- [ ] No case is mock-validation, always-green, or implementation-coupled.
- [ ] Expectations come from the **plan**, not from reading current production code.

## Rules

- Do not implement tests or production code in this command.
- Do not derive expectations from existing implementation — the plan is the source of truth.
- Do not edit the plan body above the `## Test cases` section.
- Prefer the lowest test level that reliably verifies each behavior.
- One observable behavior per test case.
- Use behavior-oriented names, not method or file names.

## Output

Report in chat (adapted from testing rules §12):

- Path to the updated plan file.
- Count of test cases by priority (P0 / P1 / P2) and level (unit / integration / e2e).
- Contracts and invariants covered.
- Boundary and failure cases covered.
- Intentionally untested behavior and why.
- Nx projects and verification commands for the implementation phase.

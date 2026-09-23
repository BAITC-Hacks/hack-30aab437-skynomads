# Agent Instructions

> Devtools system instructions. Skill catalog: `.agents/skills/`.

## Always Read Before Development Work

1. `context/project-overview.md`
2. `build-plan.md`
3. `context/current-feature.md`
4. `context/findings.md`
5. `context/decisions.md`
6. `context/review.md` when independent review is requested or required
7. repository-specific contribution/CI/deployment instructions

## Initialization

If the Devtools project-state layer is missing or incomplete, run the `onboard` skill first. Do not manually invent missing state.

## Engineering Principles

### Think Before Coding

- Do not make silent assumptions.
- Surface ambiguity, uncertainty, and meaningful tradeoffs before implementation.
- Prefer the simpler valid interpretation when requirements allow it.
- Push back when a requested approach introduces unnecessary complexity or risk.
- For materially ambiguous decisions that affect scope or architecture, clarify before committing.

### Simplicity First

- Implement the minimum solution that satisfies the requested behavior and acceptance criteria.
- Do not add speculative features, abstractions, configurability, or extensibility.
- Avoid abstractions that have only one concrete use unless they materially improve clarity.
- Prefer straightforward code over clever or generalized solutions.
- If an implementation becomes substantially more complex than necessary, simplify it.

### Surgical Changes

- Change only what is required for the task.
- Do not refactor, reformat, rename, or clean up unrelated code.
- Follow existing repository conventions unless the task explicitly requires changing them.
- Remove code made obsolete by the current change, but do not clean up pre-existing unrelated dead code.
- Every changed line should have a clear relationship to the requested outcome.

### Goal-Driven Execution

- Translate requests into verifiable outcomes before implementation.
- For non-trivial work, define a short execution plan with a verification method for each step.
- Prefer reproducible verification: tests, type checks, linting, build checks, or observable behavior.
- For bugs, reproduce the failure when practical before fixing it.
- Continue until the defined success criteria are verified or a concrete blocker is identified.

## Automatic Workflow Selection

Treat natural-language user requests as the primary interface.

The user does not need to invoke skills or slash commands explicitly.

For every development request:

1. Classify the request using Workflow Routing below.
2. Select and follow the appropriate workflow skill automatically.
3. Use relevant Expert Skills during investigation, planning,
   implementation, and verification.
4. Persist workflow state in project files as required.
5. Do not bypass the workflow merely because the requested change
   appears small.

Explicit slash commands override automatic routing when the user
requests a specific workflow stage.

## Workflow Routing

- New product / major product definition: `prd-writer` -> `project-context`.
- Existing brownfield codebase: `onboard` -> `adopt` -> `project-context`.
- Planned feature: `feature` -> `implement` -> `check` -> risk-appropriate `audit` -> `complete`.
- Bug with unclear root cause: `debug` -> `fix` -> `implement` -> `check` -> `complete`.
- Clear bounded bug: `fix` -> `implement` -> `check` -> `complete`.
- Rollback: `rollback` -> `implement` -> `check` -> required `audit` -> `complete`; production action goes through `release`.
- Milestone/release: `release prepare` -> `release verify` -> explicit authorization -> `release deploy` -> `release smoke`.

## Global Invariants

- Treat project-specific instructions in this file as persistent repository policy. `onboard`/`refresh` may enrich verified repository knowledge, but must not delete, summarize away, or weaken existing mandatory policy without an explicit user-requested policy change.
- Persist execution state in project files, not chat memory.
- Keep one active work item unless isolation is explicitly supported.
- Do not expand scope or invent product/architecture/security/API/data decisions.
- Failed required checks are `BLOCKED`; unavailable required checks are `NOT VERIFIED` and block sign-off.
- P0/P1 findings that are OPEN or only FIXED block completion until verified/closed or explicitly accepted under policy.
- Never commit, push, merge, delete branches, deploy, mutate production data, or perform destructive operations without the required explicit authorization.
- Preserve unrelated staged/unstaged work.

## Verify

Use the repository-defined Verify command when available. If none exists, `project-context refresh` should document the actual applicable lint/typecheck/test/build commands rather than inventing one.

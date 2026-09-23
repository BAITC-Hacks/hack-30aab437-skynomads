# Current Feature

## Type
FEATURE

## Status
Verify

## Source
User request to convert `docs/PRD.odt` to Markdown and `docs/data-set.odt` to JSON; these ODTs remain the source for this conversion.

## Goals
Make the existing preliminary track and dataset accessible in text-based formats without changing requirements or deleting originals.

## Scope
Add `docs/PRD.md` and `docs/data-set.json` with the complete source content, including quantitative data, score rules, constraints, examples, and evaluation criteria.

## Non-Goals
No application implementation, new PRD scope, spec split, or changes to the source ODT files.

## Acceptance Criteria
- Markdown covers every PRD section and assessment table from the ODT.
- JSON is valid and carries all 10 indicator definitions, five district rows, 14 initiatives, synergies, incompatibilities, score calculation, rules, and worked examples from the ODT.
- Source ODTs remain intact.

## Decisions
Use readable Markdown and structured JSON; keep source naming and numbers, with no inferred implementations.

## Open Questions
None needed for format conversion.

## Implementation Plan
- [x] Transcribe and format `docs/PRD.odt` into `docs/PRD.md`; compare against source text and table.
- [x] Structure `docs/data-set.odt` into `docs/data-set.json`; parse and check counts, numbers, rules and examples against source.
- [x] Verify changed paths and preserve both original ODTs.

## Verification Evidence
- `docs/PRD.md` checked against ODT text: all sections, requirements, checks, and five evaluation rows (25/25/25/15/10) present.
- PowerShell `ConvertFrom-Json` succeeded: 10 indicator definitions, 5 districts, 14 measures, 3 synergies, 3 incompatibilities; population shares and indicator weights sum to 1; district baseline scores recalculate to source values.
- Independent arithmetic check of the source example: cost 95, computed Score 56.5556 vs source approximate 56.5 (no application code has been added).
- `git diff --check` produced no errors; source ODTs were not edited. No repository Verify command exists yet (application not scaffolded), so formal completion remains pending.

## Notes
- Existing unrelated untracked project files were preserved.

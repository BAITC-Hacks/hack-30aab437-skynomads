# Findings

Statuses: OPEN | FIXED | VERIFIED | CLOSED | ACCEPTED

P0/P1 findings with status OPEN or FIXED block completion until independently verified/closed or explicitly accepted under repository policy.

## Submission audit — quality/security, MVP-1 (base e771b180 + current worktree)

### FIND-001 — P2 / quality / CLOSED
- Evidence: root README uses `git clone <URL_репозитория>`, lists resolved facts as unverified; app READMEs describe obsolete commands/architecture. Implementation spec still calls API/model unresolved.
- Impact: judge cannot follow exact setup; documentation contradicts shipped behavior.
- Resolution: exact clone/install/configure/start/verify commands, supported production launch, updated scope/limitations and submission checklist.
- Verification: updated root/app READMEs and coding-spec contracts; clean-directory frozen install → `yarn verify` → `yarn smoke` PASS. Built UI/API browser demo PASS. Human teammate confirmation explicitly pending in `docs/submission.md`.

### FIND-002 — P2 / security / CLOSED
- Evidence: `apps/backend/server.ts` mounts copied `/api/auth`, `/api/blog`, `/media`; blog sendmail is unauthenticated and unrelated to MVP; auth accepts caller-provided role. These features are not used by the simulator.
- Impact: unnecessary writable/external-service endpoints in the submitted app.
- Resolution: unmount sample routes from the submission server; retain their source; verify HTTP 404 and no data changes.
- Verification: executed `http.test.ts` checks POST `/api/auth/register`, `/api/blog/sendmail`, `/media` return safe 404 JSON. Server no longer imports/mounts these routers; source files preserved. No P0/P1 or independent-review claim is made.

### FIND-003 — P2 / quality/security / CLOSED
- Evidence: errorHandler returns `error.message` for malformed JSON/internal errors. OpenAI JSON is type-asserted and `.filter`/`.trim` can throw raw TypeError; router returns its message as analysisError. Rate-limit default response is text while UI expects JSON.
- Impact: unclear technical errors violate R-06; unexpected provider errors may leak details.
- Resolution: safe JSON error responses and runtime checks for upstream response shape; exercise failures in tests/API smoke.
- Verification: executed HTTP tests confirm malformed JSON=400 and oversized body=413 with stable messages; AI tests exercise 401/429/500, invalid JSON, null/wrong-shaped/incomplete payloads and network failure. `yarn smoke` confirms missing-key behavior retains score. Rate-limit middleware now configured with JSON message.

### FIND-004 — P2 / quality / CLOSED
- Evidence: `analysis.ts` payload omits budget/cost/remaining; selected measure output omits price and lag.
- Impact: AI explanation cannot consider costs as requested in PRD.
- Resolution: pass server-derived cost/remaining/measure cost/lag and indicator definitions; preserve deterministic calculation and test outbound payload.
- Verification: outbound payload test checks budget 100/cost 95/remaining 5, first-measure cost 24 and lag 3; `yarn smoke --live` plus clean-build browser run produced real OpenAI analysis and unchanged Score 56.54.

### FIND-005 — P3 / performance / OPEN
- Evidence: Webpack emits a ~950 KiB vendor bundle and copies ~43 MiB source PNGs; runtime thumbnails use small WebP files.
- Impact: larger artifact and initial JS download; not a blocker for documented local hackathon demo.
- Resolution: retain as documented limitation; avoid speculative rendering/dependency rewrite during submission preparation.

Audit disposition: quality/security self-review and executed tests, not an independent review. No open P0/P1 findings. Remaining P3 performance limit is documented and does not block the local hackathon demo; no public deployment readiness is claimed.

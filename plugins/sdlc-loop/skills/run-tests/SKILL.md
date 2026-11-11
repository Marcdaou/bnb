---
name: run-tests
description: Stage 4 (Test) - automatically run build, typecheck, lint and Vitest unit tests for the bnb web app on the feature branch, set them up if missing, map results to spec requirements and write test-report.md. Use after a build/PR, when the user says "run the tests", "verify this", "is it green", or /sdlc-loop:test.
---

# Run the automated checks

Purpose: give the deployer (and the human) a single PASS/FAIL they can trust, and show which spec requirements are actually covered.

## 1. Make sure the tooling exists (install only what's missing)
Check `web/package.json` first and add only the missing pieces, in one commit `chore: add test tooling`:
- Vitest: normally added by the builder; if missing, `npm --prefix web i -D vitest` + `"test": "vitest run"`. Add `jsdom` + Testing Library only if a test renders components.
- Typecheck: `"typecheck": "tsc -b --noEmit"` if not present.
- Lint: check the TypeScript major version first (`npx tsc -v`). typescript-eslint only supports the TS versions it lists; if it doesn't support this one, don't fight peer deps - try `oxlint` (no TS dependency: `npx oxlint web/src`) or mark lint **SKIPPED (toolchain)**.
- Installs can take minutes: run `npm i` with a long timeout or in the background. macOS has no `timeout` command.

## 2. Run all of these, even if an earlier one fails (each result goes in the report)
```
npm --prefix web ci
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
```
Also `deno check` changed files under `supabase/functions/` if deno is installed; otherwise note it as skipped.

## 3. Fix loop
If something fails because of the feature code, fix it on the branch (max 3 attempts per failure), commit `<KEY>: fix tests`, push, and rerun. If it's a pre-existing failure unrelated to the change, don't fix it - record it as pre-existing.

## 4. test-report.md
```markdown
# Test report: <KEY>  -  RESULT: PASS | FAIL
Branch: <branch> @ <short sha>   Date: <ISO>
| Check | Result | Notes |
|---|---|---|
| typecheck | | |
| lint | | |
| unit tests | x passed / y failed | |
| build | | |
| edge functions | | |
## Spec coverage
| Req ID | Covered by | Status (pass / fail / manual - pending preview) |
## Pre-existing issues
```
RESULT is PASS only if every check passes, or its failure is pre-existing, or it is SKIPPED because the existing toolchain can't run it (say why). Update status.json (`stage: "deploy"` on PASS, stays `test` on FAIL). Return the RESULT line first.

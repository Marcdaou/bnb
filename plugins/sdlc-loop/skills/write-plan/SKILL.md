---
name: write-plan
description: Stage 3a (Build) - turn spec.md into plan.md, an ordered, testable implementation plan with files to touch, steps, tests per step and rollback. Use after the spec is written, when the user says "plan the implementation", "break this down", or at the start of /sdlc-loop:build. Never edits source code.
---

# Write plan.md

"Nothing is implemented without an accepted plan." The plan exists so the human can catch a wrong approach in two minutes instead of in a 600-line diff. So make it short, concrete and reviewable.

1. Read spec.md and design.md, then inspect every file you intend to touch (do not plan against files you haven't opened). **Check the spec against the current code**: list requirements that are already met (no change) and bugs the spec didn't mention - this is often where the real work is.
   - If the repo lacks a test runner or linter, still plan the tests; say the builder may add `vitest` as a devDependency (the tester adds lint).
   - New migration: next number after the highest in `supabase/migrations/`.
   - If a migration adds something the frontend calls, plan a **fallback** for when it isn't applied yet (preview and production share the Supabase project and agents never apply migrations), or flag it as a risk the human must decide.
2. Write `plan.md`:
```markdown
# Plan: <KEY>
Branch: <KEY>-<slug>

## Files
| File | Change | Why (spec req ID) |

## Steps
1. <small, verifiable step> - verify: <command or check>
2. ...

## Tests to add
| Test file (or "Manual on preview") | Covers req ID |

## Migrations
<new file supabase/migrations/NNNN_<name>.sql, or "none">

## Rollback
<how to revert: revert PR; down-migration SQL if any>

## Risks / things I'm unsure about
```
3. Keep steps in an order where the app builds after each one.
4. Do not edit anything outside the work folder. Update status.json (`stage: "build"`, `approved.plan: false`) and return ending with `NEEDS_APPROVAL: docs/work/<...>/plan.md`.

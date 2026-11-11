---
name: sdlc-conventions
description: Shared rules for the sdlc-loop plugin - work-folder layout, status.json, file chain (intent -> spec -> plan -> code -> test-report -> deploy-log), human gates and Jira/Vercel/Figma ids for this repo. Load this whenever running any sdlc-loop stage or agent, or when resuming an SDLC work item.
---

# SDLC loop conventions

Every stage reads the previous stage's file and writes its own. That chain is the point: any agent (or human) can pick up a work item cold, and every line of code traces back to a Jira issue. So never skip a file, and never write a later file before the earlier one is approved.

## Work folder
`docs/work/<ISSUE-KEY>-<kebab-slug>/` (e.g. `docs/work/SCRUM-11-stripe-webhook-confirm/`)

| File | Written by | Gate |
|---|---|---|
| `intent.md` | planner | **human approves** |
| `design.md` (Figma links + screenshots list) and `spec.md` | designer | none - flows on |
| `plan.md` | builder | **human approves** |
| code on branch `<ISSUE-KEY>-<slug>` + PR | builder | none |
| `test-report.md` | tester | must be PASS to deploy |
| `deploy-log.md` | deployer | preview only |
| `docs/incidents/<date>-<slug>.md` | maintainer | becomes a new Jira issue / intent |

## status.json
Keep `status.json` in the work folder current - it is how `/sdlc-loop:run` resumes:
```json
{ "issue": "SCRUM-11", "slug": "stripe-webhook-confirm", "stage": "plan",
  "approved": { "intent": false, "plan": false },
  "figma_url": null, "branch": null, "pr_url": null, "preview_url": null, "updated": "<ISO time>" }
```
`stage` is the stage that runs **next**: plan, design, build, test, deploy, maintain, done (build covers both writing plan.md and implementing; `approved.plan` tells which). Create it in the Plan stage exactly like the example (unknown fields `null`, `updated` = current UTC ISO time) and update it as the last step of every stage.

## Who asks the human
Subagents cannot talk to the user. Agents write their file, then return a short summary ending in `NEEDS_APPROVAL: <file>` when a gate applies. The lead (the slash command) shows the file and asks the user. Only the lead flips `approved.*` to true.

## Fixed project facts
- Jira site cloudId `d39ce489-3bdf-4f82-aa1c-c952c965fe07` (marc7182.atlassian.net), project `SCRUM`.
- Figma: create new files in the "Marc Daou" team (check `whoami` for its planKey; don't ask - subagents can't).
- Supabase project `staybnb`, ref `auxkvbijleeakvfjtlxh` (another project, `harborly-q8m3`, exists - never use it).
- Vercel project `staybnb` (`prj_Lgso6VDNN3B1F1pr8TmmRKLxvHPh`, team `team_b9Paw5XmowflpMDnEvNE0J5b`), root dir `web/`.
- App: React 19 + Vite + Tailwind 4 + TypeScript in `web/`; Supabase migrations in `supabase/migrations/`, edge functions in `supabase/functions/`.
- GitHub remote `Marcdaou/bnb`, default branch `main`.

## Production gate
Agents stop at a Vercel **preview**. Never promote to production, push to `main`, or apply migrations to the production Supabase project - a human does that. The plugin hook blocks the obvious ways; do not look for others.

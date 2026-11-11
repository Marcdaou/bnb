---
name: pick-jira-intent
description: Stage 1 (Plan) - pick the highest-priority "To Do" issue in the active Jira sprint of project SCRUM via the Atlassian MCP and draft intent.md from it. Use when starting new SDLC work, when the user says "pick up the next ticket", "what's next in the sprint", "start the loop", or runs /sdlc-loop:plan.
---

# Pick a Jira issue and draft intent.md

Goal: turn one sprint ticket into a short, testable `intent.md` the human can approve in under a minute. The intent is about *why* and *what*, never *how* - solutions belong to the spec, and putting them here anchors the designer too early.

## 1. Find the issue
Use `mcp__atlassian__searchJiraIssuesUsingJql` (cloudId from sdlc-conventions):
```
project = SCRUM AND sprint in openSprints() AND statusCategory = "To Do" AND issuetype not in subTaskIssueTypes() ORDER BY priority DESC, rank ASC
```
- Take the **first** result (highest priority; ties are broken by board rank - say which happened). If the caller passed an issue key, use that instead.
- **If the sprint has no To Do issues, stop.** Return `NOTHING_TO_DO: active sprint has no To Do issues` and list nothing else. Do not fall back to the backlog - the user chose this deliberately so the loop only works on committed sprint scope.
- Skip an issue that already has a `docs/work/<KEY>-*` folder with `stage` past plan; take the next one and say so.

Then load the full issue with `mcp__atlassian__getJiraIssue` (view `evidence`): description, acceptance criteria, linked issues, parent. It only returns a comment *count* - if it is above 0, read them with `listJiraIssueComments`.

## 2. Read just enough code
Grep `web/src` and `supabase/` for the nouns in the ticket so "Who is affected" and "Constraints" are grounded in what exists. Keep this light - a few files.

If the feature already largely exists, say so plainly and frame the intent as **"verify and close gaps"**: keep the success criteria (they become the checklist), list what exists under Constraints, and ask the scope question under Open questions. This saves the designer and builder from rebuilding working code.

## 3. Write intent.md
Create `docs/work/<KEY>-<slug>/intent.md` (create `docs/work/` if missing; slug: the summary's key nouns in kebab case, max ~5 words, dropping filler like "and/by/the"):

```markdown
# Intent: <KEY> - <summary>

## Problem
<2-4 sentences, in user terms>

## Who is affected
<roles: guest, host, admin...; and where in the app>

## Success criteria
- [ ] <observable, testable statement - each one will become a test>
- [ ] ...

## Constraints
<tech/business limits found in the ticket or code: Supabase RLS, Stripe test mode, existing routes...>

## Non-goals
<what this explicitly will not do>

## Open questions
<only if the ticket is genuinely ambiguous; otherwise "None">

## Source
Jira: https://marc7182.atlassian.net/browse/<KEY> (priority <P>, sprint <name>)
```
Good success criteria are checkable by a test or a click ("A guest with a paid booking sees a 'Write review' button on /trips"), not vibes ("reviews work better").

Write `status.json` with `stage: "plan"`, `approved.intent: false`.

Constraints may name existing files, tables and RPCs (that's grounding), but never say how to change them (that's the spec's job).

## 4. Return
Return the path, the **full intent.md text** (the lead shows it to the human for approval), and end with `NEEDS_APPROVAL: docs/work/<...>/intent.md`.
**Do not transition the Jira issue yet** - the lead moves it to In Progress only after the human approves (see the plan command).

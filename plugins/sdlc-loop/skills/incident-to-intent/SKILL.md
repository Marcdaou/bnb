---
name: incident-to-intent
description: Stage 6 (Maintain) - watch the deployed app (Vercel runtime errors/logs, Supabase logs and advisors), write an incident record when something is wrong, and file each follow-up as a new Jira issue so it becomes the next intent.md. Use after a deploy, or when the user asks "anything broken?", "check production/preview health", "triage errors", or /sdlc-loop:maintain.
---

# Observe, record, close the loop

The loop closes here: what you learn in production becomes the next intent.

1. Collect signals for the last 24h (or since the deploy in status.json):
   - Vercel: `get_runtime_errors` (staybnb is a static SPA with no Vercel functions, so most real signal is in Supabase).
   - Supabase (project `staybnb`, ref `auxkvbijleeakvfjtlxh`): `query_logs` takes SQL over sources such as `postgrest_logs`, `edge_logs`, `function_logs`, `postgres_logs` - start with 4xx/5xx counts by path on `edge_logs`; then `get_advisors` (security + performance).
2. Separate signal from noise: group by error message/route, count, first/last seen; ignore one-off bot 404s. Distinguish what you observed from what you suspect.
   Classify each finding: **incident** (new errors or regressions since the deploy), **context** (known pending items like unapplied migrations, intentional design such as a public SECURITY DEFINER RPC), or **hardening** (pre-existing advisor suggestions). Only incidents get an incident file; hardening items get one Jira Task each only if no open issue covers them.
3. If nothing meaningful: append a "Maintain check - Healthy <date>" section (with the context/hardening notes) to deploy-log.md, set status.json `stage: "done"`, and stop.
4. Otherwise write `docs/incidents/<YYYY-MM-DD>-<slug>.md`:
```markdown
# Incident: <title>
Severity: low|medium|high   Detected: <ISO>   Related: <KEY>, deployment <id>
## What happened
## Impact (who, how many, since when)
## Evidence (counts, log excerpts, advisor ids)
## Suspected cause
## Follow-ups
- [ ] <follow-up> -> Jira <NEW-KEY>
```
5. Search SCRUM for an open issue covering the same thing first (JQL on summary/text) and comment there instead of duplicating. Otherwise create a Jira issue in SCRUM (`createJiraIssue`, type Task, priority from severity, description linking the incident file). Leave it in To Do - the human decides whether it enters a sprint, which is what makes the planner pick it up next.
6. Return incident path + new issue keys.

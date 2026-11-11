---
name: deploy-preview
description: Stage 5 (Deploy) - deploy the tested feature branch to a Vercel PREVIEW for the staybnb project using the Vercel MCP, smoke-check it, comment nothing to production, write deploy-log.md and move the Jira issue to In Review. Use after test-report.md shows PASS, when the user says "deploy it", "give me a preview", "ship to Vercel for testing", or /sdlc-loop:deploy.
---

# Deploy a Vercel preview

The user tests on a preview URL; production promotion is a human decision outside this plugin.

1. Require `test-report.md` with `RESULT: PASS`. Otherwise stop: `BLOCKED: tests not passing`.
2. Ensure the branch is pushed. If the project has a Git integration, Vercel builds a preview for each pushed branch - look for it first (staybnb currently does **not**, so expect an empty list and go to step 3):
   `mcp__vercel__list_deployments` (projectId/teamId from sdlc-conventions), match on the branch / commit sha. Wait for state READY by calling `get_deployment` repeatedly (shell `sleep` is blocked here; don't use log-follow, it times out).
3. If none appears (no Git integration), create one with `mcp__vercel__create_deployment` for the branch's commit. **Omit `target`** - omitted means preview; `"preview"` is rejected and `"production"` is forbidden. Pass `projectSettings.rootDirectory: "web"` (the app lives in `web/`; without it the build fails with `vite: command not found`). As a last resort the CLI: `cd web && npx vercel deploy` (no `--prod`).
4. If the build fails, read the build logs (`list_deployment_events`), fix on the branch if it's the feature's fault, push, and retry once.
5. If spec.md lists new Supabase migrations, do **not** apply them to the production database. Note in deploy-log that the preview runs against the existing DB and that the migration needs a human (or a Supabase branch if the user enables branching).
6. Smoke check: `web_fetch_vercel_url` each new route for HTTP 200, and `get_runtime_errors`. This is a client-rendered SPA, so 200 proves little: if Playwright MCP tools are available, open each route, wait for content, and screenshot the key state; otherwise list the routes as **manual checks for the human** in deploy-log.md.
7. Write `deploy-log.md`: preview URL, deployment id, commit, smoke results, migrations pending, "Production: NOT promoted (human gate)".
8. Jira: transition the issue to **In Review** (discover the transition id via `executeRead` getTransitions if needed; if the workflow has no In Review, use Done and say so). Add the preview URL to the PR as a comment (`gh pr comment`), not by editing the body.
9. Update status.json (`stage: "maintain"`, `preview_url`), commit `deploy-log.md` + `status.json` with explicit paths only, push. Return the preview URL first.

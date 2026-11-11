---
description: Stage 5 - deploy the tested branch to a Vercel preview and move the Jira issue to In Review
argument-hint: "[work folder or ISSUE-KEY]"
---
Run the Deploy stage: find the work item ($ARGUMENTS or latest stage "deploy"), require test-report.md RESULT: PASS, spawn `sdlc-loop:deployer` with the work folder. Give the user the preview URL prominently, plus any pending migrations. Remind them production promotion is their call. Next: `/sdlc-loop:maintain` once they've tested.

---
description: Stage 3 - write plan.md (asks you to approve), then implement on a branch and open a PR
argument-hint: "[work folder or ISSUE-KEY]"
---
Run the Build stage.
1. Find the work item ($ARGUMENTS or latest status.json with stage "build").
2. If `approved.plan` is not true: spawn `sdlc-loop:builder` with "mode=plan" and the work folder. Show plan.md and ask (AskUserQuestion): Approve / Request changes. Loop on changes. On approve set `approved.plan: true`.
3. Spawn `sdlc-loop:builder` with "mode=implement" and the work folder.
4. Report the PR URL and files changed. Next: `/sdlc-loop:test`.

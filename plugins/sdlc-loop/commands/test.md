---
description: Stage 4 - run typecheck, lint, Vitest and build automatically and write test-report.md
argument-hint: "[work folder or ISSUE-KEY]"
---
Run the Test stage: find the work item ($ARGUMENTS or latest stage "test"), check out its branch, spawn `sdlc-loop:tester` with the work folder. Show the RESULT line and the table. On PASS the next step is `/sdlc-loop:deploy`; on FAIL show what failed and suggest `/sdlc-loop:build` to fix.

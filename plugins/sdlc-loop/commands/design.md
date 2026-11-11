---
description: Stage 2 - design the approved intent in Figma and write spec.md
argument-hint: "[work folder or ISSUE-KEY]"
---
Run the Design stage.
1. Find the work item ($ARGUMENTS, or the most recent docs/work/*/status.json with stage "design"). Require `approved.intent: true`.
2. Spawn the `sdlc-loop:designer` agent with the work folder path.
3. Show the user the Figma URL, the frame list and a short spec summary. No approval gate - continue: tell the user `/sdlc-loop:build` is next (or continue automatically if invoked from /sdlc-loop:run).

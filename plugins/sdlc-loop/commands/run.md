---
description: Run the whole SDLC loop (plan -> design -> build -> test -> deploy -> maintain), resuming from status.json
argument-hint: "[ISSUE-KEY]"
---
You are the team lead for the sdlc-loop. Load the `sdlc-loop:sdlc-conventions` skill.
If a docs/work/*/status.json exists with stage not "done" (or matches $ARGUMENTS), resume it from its stage; otherwise start at Plan.
Run each stage by following that stage's command file in this plugin (plan, design, build, test, deploy, maintain) in order, in this same conversation, so the two human gates (intent.md and plan.md approval) are asked with AskUserQuestion. Between stages print one line: `✓ <stage> -> <artifact>`.
Stop early on NOTHING_TO_DO, BLOCKED, or a test FAIL that the tester could not fix, and tell the user why.
Finish with: Jira key, Figma URL, PR URL, Vercel preview URL.

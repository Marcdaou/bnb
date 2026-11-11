# sdlc-loop

The AI-native SDLC playbook as a Claude Code plugin. Every stage commits a file the next stage reads:

```
Jira (SCRUM, active sprint) ─► intent.md ─► Figma + spec.md ─► plan.md ─► branch + PR ─► test-report.md ─► Vercel preview ─► incident ─► new intent.md
           planner          [YOU APPROVE]     designer         builder [YOU APPROVE]  builder      tester           deployer        maintainer
```

| Command | Stage | Agent | Skills |
|---|---|---|---|
| `/sdlc-loop:plan` | 1 Plan | `planner` | pick-jira-intent |
| `/sdlc-loop:design` | 2 Design | `designer` | figma-design-spec |
| `/sdlc-loop:build` | 3 Build | `builder` | write-plan, build-feature |
| `/sdlc-loop:test` | 4 Test | `tester` | run-tests |
| `/sdlc-loop:deploy` | 5 Deploy | `deployer` | deploy-preview |
| `/sdlc-loop:maintain` | 6 Maintain | `maintainer` | incident-to-intent |
| `/sdlc-loop:run` | all | (you, as lead) | sdlc-conventions |

Human gates: approve `intent.md`, approve `plan.md`. Production promotion is never done by an agent (hook-enforced); deploys are Vercel **previews** only.

Work lives in `docs/work/<ISSUE-KEY>-<slug>/` with a `status.json` so `/sdlc-loop:run` can resume.

Install (from repo root): `/plugin marketplace add ./` then `/plugin install sdlc-loop@bnb-local`.

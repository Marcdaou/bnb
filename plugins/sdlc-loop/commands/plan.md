---
description: Stage 1 - pick the top To Do sprint issue from Jira and draft intent.md (asks you to approve)
argument-hint: "[ISSUE-KEY]"
---
Run the Plan stage.
1. Spawn the `sdlc-loop:planner` agent. Pass the issue key "$ARGUMENTS" if given.
2. If it returns `NOTHING_TO_DO`, tell the user the active sprint has no To Do issues and stop.
3. Otherwise show the user the full intent.md and ask (AskUserQuestion): Approve / Request changes / Pick a different issue.
   - Request changes: apply the user's edits to intent.md yourself, then ask again.
   - Approve: set `approved.intent: true`, `stage: "design"` in status.json, then transition the Jira issue to **In Progress** with the Atlassian MCP (find the transition id via getTransitionsForJiraIssue / discover). Do not commit on main; the builder commits the work folder on the feature branch.
4. Tell the user the next command: `/sdlc-loop:design`.

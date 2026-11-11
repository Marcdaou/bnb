---
description: Stage 6 - check Vercel and Supabase health, write incident records, file follow-up Jira issues
argument-hint: "[work folder or ISSUE-KEY]"
---
Run the Maintain stage: spawn `sdlc-loop:maintainer` with the work folder ($ARGUMENTS or latest stage "maintain"). Report health or the incident file and new Jira keys. If healthy, set status.json `stage: "done"`.

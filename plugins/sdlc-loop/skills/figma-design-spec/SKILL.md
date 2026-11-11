---
name: figma-design-spec
description: Stage 2 (Design) - from an approved intent.md, create real UI screens in a new Figma file via the Figma MCP, then write spec.md (requirements, design, data/API changes, edge cases, test strategy). Use whenever an intent.md is approved, the user asks to "design this ticket", "mock it up in Figma", "write the spec", or runs /sdlc-loop:design.
---

# Figma design + spec.md

Goal: a design a human can look at, and a spec a builder can implement without guessing. The spec is where judgment goes - every requirement must trace to a success criterion in intent.md.

## 1. Understand the current UI
Read intent.md, then the existing look so the design fits the app instead of inventing a new style:
- `web/src/index.css` / Tailwind theme, shared components in `web/src/components`, the pages the feature touches.
- Note colors, radius, font, spacing, button and card styles.

If the feature has **no UI surface** (pure backend, index, webhook), skip Figma, write `design.md` saying "No UI change - <reason>", and go to step 4.

## 2. Build the screens in Figma
Load the Figma skills before touching the file - they prevent hard-to-debug failures:
1. Invoke the `figma:figma-use` skill (mandatory before `use_figma`) and `figma:figma-generate-design`.
2. `create_new_file` named `<KEY> - <summary>` in the team from sdlc-conventions (Figma team "Marc Daou"); then `create_session` with that fileKey and reuse the sessionId.
   - A new file has no design system, Code Connect or libraries: skip figma-generate-design's discovery steps and build from the tokens you read in step 1 (`web/src/index.css` colors, font, radius). Make the repeated element (e.g. a card) a component first, then instance it.
   - Figma scripting can't load images from URLs: use neutral image placeholders with a label. Don't try to screen-capture the running app.
3. Build one frame per screen/state that is **new or changing** (desktop 1440 wide; add a 390 mobile frame for the main screen). Consider the states people forget - empty, loading, error, success - but for a "verify and close gaps" intent only draw the states that change, and list the unchanged ones in design.md.
4. Reuse the app's real look from step 1. Use realistic copy, not lorem ipsum.
5. `get_screenshot` each frame to check it rendered and fix anything broken (e.g. fixed-height images stretching on mobile). The screenshots are for your check only; don't save image files.

## 3. Record it
`design.md` (Figma links; no image files):
```markdown
# Design: <KEY>
Figma: <file url>
| Screen / state | Node id | Notes |
|---|---|---|
```

## 4. Write spec.md
```markdown
# Spec: <KEY> - <summary>
Intent: ./intent.md   Design: ./design.md

## Gap analysis
<only when the feature partly exists: what already meets each success criterion vs. what changes>
## Requirements
| ID | Requirement | Traces to (intent success criterion) |
## UI
<per screen: route, components new/changed, Figma node id>
## Data model
<tables/columns/indexes/RLS policies; exact SQL sketch for new migrations>
## API / edge functions
<supabase functions, request/response, auth, Stripe events>
## Edge cases
## Risks
## Test strategy
<which requirement is covered by: unit test (Vitest) / build+typecheck / manual check on preview>
## Out of scope
```

Update `status.json`: `stage: "build"`, `figma_url`. Return Figma URL, frame list, and the spec path. No approval gate here - the plan is the next human checkpoint.

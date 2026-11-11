# Design: SCRUM-12
Figma: https://www.figma.com/design/RBxZe4x7JdYN0Llt5RZIbc

| Screen / state | Node id | Notes |
|---|---|---|
| Search – Desktop – Results | 2:25 | 1440 wide, `/search?city=Lisbon&check_in=2027-06-12&check_out=2027-06-16&guests=4&min_price=80&max_price=250`. Same layout as today's Search.tsx: header search bar filled from URL, CategoryBar, "N stays" title + summary, price filter, 4-col ListingGrid. |
| Search – Desktop – Empty | 2:268 | No match. Message names the active criteria; primary "Clear price filter" (only when a price filter is set) + secondary "Explore all stays". |
| Search – Desktop – Pick both dates | 2:340 | Only check_in given. Amber prompt banner above results; Check-out field highlighted in brand color; results ignore dates (summary omits dates). |
| Search – Mobile – Results | 2:498 | 390 wide; header shows only "Where" + search button (matches `sm:` breakpoints), 1-col grid, toolbar stacks. |
| ListingCard (component) | 2:2 | Mirrors ListingCard.tsx: square photo (rounded-xl), heart, dots, city/country + rating, title, beds/guests, price "night". Photos are gray placeholders (no images available in Plugin API). |

Tokens used (from web/src/index.css): brand #FF385C, ink #222222, muted #717171, gray-200/300 borders, Inter, radius 12 (cards) / 8 (inputs, buttons) / full (search pill).
Loading (SkeletonGrid) and error states are unchanged from current code and not redrawn.

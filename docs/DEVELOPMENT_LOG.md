# Development log

## 2026-10-03 — Milestone 1 started

- The participant confirmed in the project chat that development may begin.
- Created the `active-city` React and TypeScript application with Vite 5, selected for compatibility with the available Node 18 runtime.
- Added Leaflet and React Leaflet for interactive geographical discovery.
- Implemented a Krakow pilot map, selectable facility profiles, and a full text-list alternative.
- Added 12 OpenStreetMap-derived discovery records. All are labelled `Imported, not field-verified`; operational facts not verified in the source record are represented as `Unknown`.
- Added two documented outdoor gyms with source-linked equipment inventories: Olszanica and Centrum Sportu Parkowa.
- Expanded the citywide pilot with Park Klinówka Parkour and Park Przylasek Wyciąski. Only sources that itemise equipment are shown as equipment inventories.
- Added temporary coordinate input and straight-line distance sorting. The entered coordinates are held only in React state and are not persisted.
- Added a travel layer: on-demand pedestrian-route geometry for walking and running, general calorie estimates, and an external public-transport journey handoff.
- Added source-backed outdoor basketball, volleyball and football locations: the Olszanica complex, Orlik Victoria, KS Borek, Park Kurdwanów and Park Krowoderski. Operator-controlled venues retain explicit access and booking caveats.
- Replaced vague waterfront activity labels with source-backed activity details for Zalew Bagry and Park Zakrzówek. Swimming is labelled as seasonal and restricted to designated bathing areas.
- Added a privacy-first recommendation prototype. It uses only in-memory age range, self-described movement comfort and a general activity goal to match a user to activities already recorded at locations. It does not request diagnoses, conditions, symptoms or medical history, and labels results as non-medical discovery suggestions.
- Narrowed age choices to smaller life-stage ranges (0–4 through 75+) and added an optional wellbeing focus. Broad focuses prioritise appropriate activity types already present in the map data; a condition, injury or recovery selection deliberately provides no recommendation and directs the person to individual professional advice.
- Expanded activity results with venue-matched, specific exercise ideas: fast walking, run–walk intervals, short sprint efforts, standing press-ups, bodyweight squats, pull-ups, yoga/mobility and balance practice. Each card has an external NHS instructional link and a readiness/safety note; advanced options are limited to the energetic comfort setting.
- Added a privacy-first post-activity wellbeing reflection and optional three-movement-day challenge. Check-ins stay in memory by default; browser-device retention is a user-controlled opt-in. The app prepares an on-screen summary for manual review and sharing only, and never transmits it to a provider.
- Added a high-energy session builder within the activity results. It offers interval, bodyweight-circuit and court/pitch conditioning options, requires the user to select energetic movement comfort, checks the selected location’s documented activity type, and links to NHS technique and warm-up guidance.

### Next priority

Verify each pilot location against a source record with a durable URL, then add selected outdoor gyms and sports facilities before introducing preference filters.

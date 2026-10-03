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
- Added a category-based movement library with additional NHS-linked balance, warm-up and posture resources: heel-to-toe walking, supported one-leg stands, controlled step-ups and simple grapevine steps sit alongside the existing walking, running, strength and mobility ideas.
- Added an adult-only community activity-board prototype: browser-only interest markers, activity-companion requests, team-sport player requests and clearly unverified volunteer-guidance examples. It deliberately does not transmit data, expose live locations, collect contact details or connect users. The interface documents the verification, moderation, safeguarding and reporting requirements needed before a future live version.
- Expanded the strength/bodyweight category with NHS-linked sit-to-stands, calf raises, supported sideways leg lifts and supported rear leg extensions, all paired with clear surface, support and stop-if-unwell boundaries.
- Developed the volunteer/trainer concept into a separate guidance-directory prototype. It distinguishes a volunteer movement guide from a personal trainer, displays role boundaries, activity focus, planned venue and availability, and makes every interest or new-offer action browser-only until a live service can verify and moderate it.
- Added the next safety-layer prototype: a local adult/community-rules setup, demo-only connection requests, visible sample-versus-draft moderation states, local report controls, and a trainer verification journey that lists the checks a real service must complete while deliberately collecting no credentials or documents.
- Added an original AI-generated Kraków riverside hero illustration and refreshed the visual direction around its lake-blue, deep-navy, leaf-green and warm-amber palette. The illustration is documented as generated/referenced visual material in `docs/DATA_SOURCES.md`.
- Turned the visual direction into a city-theme foundation. Kraków is the active pilot theme: its named landmark hero and palette tokens now style the journey panels, controls, activity states and community area. A future city can supply its own hero asset and equivalent theme tokens without rewriting the interface.
- Added a browser-only “Today’s plan” flow that joins the selected facility, one documented activity, a travel choice, route planning and the post-activity reflection into one clear user journey. It does not create bookings, save plans or make individual exercise/safety decisions.
- Verified and upgraded Park Lotników Polskich from an imported discovery point to a municipal-source-backed outdoor sport profile. The profile covers only the documented street-workout area, multi-purpose court, pumptrack, skatepark and running route; it avoids inventing individual device, court-availability or booking details.
- Added an activity filter that updates both the interactive-map markers and the equivalent text list together. It provides concise choices for walking, running/cycling, strength/bodyweight, team sport and waterfront activity; no personal information is needed or retained.
- Added a three-step community-demo path that makes the prototype’s safety-first sequence explicit: acknowledge adult/rules boundary, choose a public facility, then review a local draft rather than publish it.
- Expanded documented map coverage with Orlik Kabel in Płaszów and Park Ogród nad Sudołem in Prądnik Czerwony. Both records link to the City source, distinguish equipment facts from current access, and leave availability/booking unconfirmed.
- Added Park Linearny Ruczaj as a documented District VIII outdoor-activity record, including its City-listed stationary spinning bikes, table tennis, minigolf and pétanque facilities.

### Next priority

Continue verifying pilot locations against durable municipal sources, then prepare concise submission-ready demo and project materials.

# Active City

**Active City** is a Kraków-focused, privacy-first outdoor activity companion. It helps people discover public places to move, see what facilities are documented there, plan a route, and choose an activity that matches their self-described confidence and goal.

The project is a HackYeah 2026 Sport & Healthcare submission in progress. It is a discovery and motivation tool, not a medical service or an assessment of whether activity is safe for an individual.

## Current milestone

The app currently provides:

- A public map and equivalent text alternative showing the 14 source-backed Kraków facility profiles; broader discovery records remain unpublished until their details are verified.
- Source-linked profiles for outdoor gyms, outdoor courts/pitches, waterfront recreation and a documented park-sport hub at Park Lotników Polskich.
- Nearby-place search from a neighbourhood, street or landmark, plus an optional browser device-location prompt; walking/running route previews and a public-transport handoff.
- A concise activity filter that updates the map and text alternative together.
- A tucked-away visitor update form for a selected place: people can record equipment condition, description accuracy, busyness and a broad visitor mix. Reports stay private to the browser tab in this prototype and never alter map data.
- A public-place suggestion flow that requires an adult/privacy acknowledgement and a public source or map link. It prepares a local draft only; identity, public access, evidence and moderation must be checked by a future named review service before a new marker can be published.
- Non-medical activity discovery based on an age band, movement comfort, goal and optional broad wellbeing focus.
- Strength and calisthenics recommendations name concrete, comfort-aware movements to try—such as bodyweight squats, standing press-ups, calf raises and, only at documented bar-based venues for the energetic setting, pull-up progressions.
- Venue-matched exercise ideas and a high-energy session builder for people who select energetic activity.
- A category-based movement library with NHS-linked walking/running, expanded strength/bodyweight, mobility and balance resources.
- An adult-only, browser-only community-board pilot design for activity companions, team-sport player requests and a separate unverified volunteer-guide/personal-trainer directory; it never exposes live locations or connects people.
- A visible three-step safety-first planning path: acknowledge rules, choose a public facility, then add a personal Today plan or save a private draft rather than publish.
- A local safety layer for that prototype: adult and community-rule confirmation, draft/moderation states, report controls, and a no-document trainer-verification journey.
- A private post-activity reflection and optional three-movement-day challenge; data stays in the browser unless the person explicitly opts into device storage.
- A private weekly view that turns recent check-ins into movement days, a familiar place and one modest next-step suggestion. It does not produce a health score, diagnosis or clinical record.
- Up to five device-local profiles for a person, someone they support, a child, or a household member; each keeps separate preferences, diary entries and challenge progress.
- Opt-in, read-only progress links that include only reflections the user selects; the app creates no server copy or account.
- A browser-only “Today’s plan” that turns a chosen documented activity into a time-budgeted session outline, reserves an estimated return journey, flags places that do not fit today’s time, and offers nearer documented alternatives where available.
- A direct “I’m back — reflect” hand-off from a completed Today plan to the private weekly check-in, carrying the chosen place through without marking activity as completed automatically.
- Four focused destinations instead of one long page: **Explore**, **Plan**, **My week**, and a clearly labelled **Community** future-pilot area.
- Direct browser addresses for each destination (`?view=explore`, `?view=plan`, `?view=week`, and `?view=community`), with Back/Forward support. Read-only progress links open directly on the shared weekly view.

## Run locally

```bash
npm install
npm run dev
```

To verify the project:

```bash
npm run lint
npm run build
```

## HackTribe submission details

Copy-ready project fields and the final upload checklist are in [`docs/HACKTRIBE_SUBMISSION.md`](docs/HACKTRIBE_SUBMISSION.md). The draft intentionally leaves team-specific fields marked for confirmation rather than inventing them.

## Stack

- React 18 + TypeScript
- Vite 5 (Node 18-compatible)
- Leaflet + React Leaflet
- OpenStreetMap tiles and attribution
- City-theme foundation: Kraków is the pilot with a civic route-based identity and palette tokens; later cities can provide their own landmark direction and colours.

See [`docs/DEVELOPMENT_LOG.md`](docs/DEVELOPMENT_LOG.md), [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md), and [`docs/HACKTRIBE_SUBMISSION.md`](docs/HACKTRIBE_SUBMISSION.md) for provenance, data limitations, and submission preparation.

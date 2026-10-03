# Active City

**Active City** is a Kraków-focused, privacy-first outdoor activity companion. It helps people discover public places to move, see what facilities are documented there, plan a route, and choose an activity that matches their self-described confidence and goal.

The project is a HackYeah 2026 Sport & Healthcare submission in progress. It is a discovery and motivation tool, not a medical service or an assessment of whether activity is safe for an individual.

## Current milestone

The app currently provides:

- 19 Kraków pilot locations on an interactive map and an equivalent text alternative.
- Source-linked profiles for outdoor gyms, outdoor courts/pitches, waterfront recreation and a documented park-sport hub at Park Lotników Polskich.
- Distance sorting from a voluntarily entered location, walking/running route previews, and a public-transport handoff.
- A concise activity filter that updates the map and text alternative together.
- Non-medical activity discovery based on an age band, movement comfort, goal and optional broad wellbeing focus.
- Venue-matched exercise ideas and a high-energy session builder for people who select energetic activity.
- A category-based movement library with NHS-linked walking/running, expanded strength/bodyweight, mobility and balance resources.
- An adult-only, browser-only community-board prototype for activity companions, team-sport player requests and a separate unverified volunteer-guide/personal-trainer directory; it does not expose live locations or connect people.
- A local safety layer for that prototype: adult and community-rule confirmation, draft/moderation states, report controls, and a no-document trainer-verification journey.
- A private post-activity reflection and optional three-movement-day challenge; data stays in the browser unless the person explicitly opts into device storage.
- A browser-only “Today’s plan” that links place selection, a documented activity, travel planning and post-activity reflection.

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
- City-theme foundation: Kraków is the pilot with its own landmark illustration and palette tokens; later cities can provide their own theme asset and colours.

See [`docs/DEVELOPMENT_LOG.md`](docs/DEVELOPMENT_LOG.md), [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md), and [`docs/HACKTRIBE_SUBMISSION.md`](docs/HACKTRIBE_SUBMISSION.md) for provenance, data limitations, and submission preparation.

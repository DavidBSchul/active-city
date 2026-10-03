# HackTribe project submission — draft

**Status:** ready to paste into HackTribe after the team confirms the bracketed details. Do not publish until the team has reviewed the copy, added the final repository link, and chosen a cover image.

## Project name

Active City

## Published

Keep as a draft until the team has reviewed the copy, added the final repository link, and chosen a cover image. Publish once those checks are complete.

## Problem

Public places to be active can be hard to find and even harder to trust: people may not know which nearby parks, outdoor gyms and courts actually offer the activity they want, whether equipment is documented, or how to get there. That creates friction before a walk, run or workout even begins.

The World Health Organization identifies insufficient physical activity as a major public-health issue and recommends making movement opportunities easier to access across everyday life. In Kraków, the information people need is spread across different municipal pages, map records and on-site notices. A person looking for a free outdoor gym, a volleyball court or a low-pressure walking route should not need to assemble that information themselves.

## Solution

Active City turns fragmented public recreation information into a clear, privacy-first activity journey:

1. Explore 22 Kraków pilot locations on an interactive map or accessible text list, then filter for walking, running/cycling, strength, team sport or waterfront activity.
2. Open a place profile to see its documented activities, equipment, access caveats and source link.
3. Build a simple “Today’s plan” from the selected place, one documented activity and a travel choice; enter an approximate starting point to sort by distance and choose walking, running or public transport.
4. Choose a narrow age band, movement comfort and goal to discover non-medical activity ideas matched to documented venue activities.
5. Select a higher-energy interval, bodyweight or court/pitch session when energetic activity matches the person’s self-described comfort and the venue record.
6. Optionally reflect on how the activity felt and build a private three-movement-day challenge. Check-ins stay on the device by default.
7. Explore an adult-only community prototype for planned public-place activity requests and volunteer/trainer guidance. It is explicitly browser-only: no accounts, live locations, contact details or connections are created.

This combines motivation, practical next steps and transparent data limits. It does not diagnose, prescribe exercise or share health data with providers.

## Challenge

Sport & Healthcare

## Idea stage

New idea / hackathon prototype.

## What was done so far and project goal

During HackYeah, the team built and validated a React and TypeScript Kraków pilot: source-backed facility profiles, activity filters, distance and route tools, a guided “Today’s plan”, non-medical activity discovery, an intensive-workout option, privacy-first wellbeing reflection, and a clearly bounded community prototype. Kraków is the first city theme; future city pilots can use their own landmark art and equivalent palette tokens without rewriting the experience.

The goal is a clear, demonstrable journey from “I want to move” to a realistic next activity at a nearby public place. All implementation activity and source limits are recorded in `docs/DEVELOPMENT_LOG.md` and `docs/DATA_SOURCES.md`.

## Team status

[Confirm: complete / looking for teammates]

## Current team size

[Confirm number]

## Needed skills

If the team is still recruiting, select:

- Design & UX
- Frontend Developer
- Pitching & Storytelling

Otherwise, leave this section empty.

## Skills comment

Looking for a UX designer to strengthen accessibility and onboarding, a frontend developer to help verify the pilot and improve mobile polish, and a storyteller to shape a short judging presentation. Familiarity with inclusive exercise communication, local open data or GIS is welcome.

## Video presentation

Not yet recorded. Record a short listed YouTube walkthrough after finalising the prototype and replace this with the URL.

## Website

Use the deployed demo URL when available. Do not add `http://127.0.0.1:5173` because it works only on the development computer.

## Code repository

https://github.com/DavidBSchul/active-city

## Instructions on how to open project

```text
Requirements: Node.js 18 or newer.

1. Clone the repository.
2. Run: npm install
3. Run: npm run dev
4. Open the local URL shown in the terminal.

Quality checks:
- npm run lint
- npm run build

The application is a frontend prototype. It uses public map tiles and makes on-demand route requests only when a person asks for a walking or running route. No API key is required to run the current version.
```

## Presentation

Create and upload a PDF or PPTX under 10 MB. Suggested six-slide structure:

1. **Active City** — “From intention to a real place to move in Kraków.”
2. **The friction** — public activity information is scattered and uncertain.
3. **The journey** — discover → verify → route → move → reflect.
4. **Live prototype** — filter the map, open a source-backed profile, then make a Today’s plan.
5. **Responsible personalisation and community** — non-medical suggestions, energetic pathway, device-first reflections and local-only community drafts.
6. **Impact and next steps** — validate more sites, co-design with residents, add current municipal availability data, and test future city themes.

## Cover image brief

Use `public/active-city-hero.png` as the starting cover visual. It is an original AI-generated Kraków riverside illustration (1672 × 941) with outdoor movement and no text or logo. Crop it to the platform’s preferred aspect ratio if needed; add project title text only in the platform/editor, and disclose the generated asset as required by the competition rules.

## Final pre-publish checklist

- [ ] Confirm the final provenance/start-time wording against the organizer’s rules before publishing.
- [ ] Confirm team status, team size, member names and any needed skills.
- [x] Create the GitHub repository, push the commit, and paste its public URL.
- [ ] Add a deployed demo URL if one is available.
- [ ] Make a cover image with rights-cleared assets.
- [ ] Record a short listed YouTube demo, if time allows.
- [ ] Export the final presentation as PDF/PPTX under 10 MB.
- [ ] Disclose use of AI tools and external/reused assets in the presentation/submission as required by the competition rules.

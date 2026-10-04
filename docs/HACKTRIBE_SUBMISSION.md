# HackTribe project submission — paste-ready update

## Keep / update these fields

| Field | Action |
| --- | --- |
| Project name | Keep **Active City**. |
| Published | Keep published. |
| Challenge | Keep **Open Task: Sport & Healthcare**. |
| Idea stage | Keep **New Idea**. |
| Team status / size | Keep **Full team** / **1**. |
| Needed skills / skills comment | Clear all selections and leave the comment blank: this team is not recruiting. |
| Video | Leave empty; a video is recommended, not required. |
| Website | Keep `https://zycie-razem.org.pl/active-city/`. |
| Code repository | Keep `https://github.com/DavidBSchul/active-city`. |
| Cover image | Replace the current cover with [`output/Active-City-HackYeah-2026-cover-v2.png`](../output/Active-City-HackYeah-2026-cover-v2.png). |
| Presentation | Replace the current deck with [`output/Active-City-HackYeah-2026-Fundacja-Zycie-Razem-v3.pptx`](../output/Active-City-HackYeah-2026-Fundacja-Zycie-Razem-v3.pptx). |

## Problem

Public places to be active can be hard to find and even harder to trust: people may not know which nearby parks, outdoor gyms and courts actually offer the activity they want, whether equipment is documented, or how to get there. That creates friction before a walk, run or workout even begins.

The World Health Organization identifies insufficient physical activity as a major public-health issue and recommends making movement opportunities easier to access across everyday life. In Kraków, the information people need is spread across different municipal pages, map records and on-site notices. A person looking for a free outdoor gym, a volleyball court or a low-pressure walking route should not need to assemble that information themselves.

## Solution

Active City turns fragmented public recreation information into a clear, privacy-first activity journey:

1. Explore 14 documented Kraków places on an interactive map or accessible text list.
2. Open a place profile to see documented activities, equipment, access caveats and a public source link.
3. Enter a neighbourhood, street or landmark to sort places by distance and choose walking, running or public-transport planning.
4. Build a time-aware Today’s Plan. It reserves return travel and suggests a closer documented place when the selected one does not fit today’s time.
5. Choose non-medical activity ideas from a narrow age band, movement comfort and goal; exercise cards name specific movements and link to instruction sources.
6. Keep a private wellbeing diary: after an activity, record how it felt and an optional note, then see a light weekly pattern. Device saving is optional.
7. Help keep future information current: a visitor can privately report equipment condition, description accuracy or busyness, or prepare a source-linked public-place suggestion. Nothing changes the public map until a future named reviewer verifies it.

This prototype does not diagnose, prescribe exercise, create user accounts, publish community requests, share health data with providers or automatically publish map updates.

## What’s done so far and goal of your project

During HackYeah, Fundacja Życie, Razem built and tested a React, TypeScript and Leaflet Kraków prototype: 14 source-backed facility profiles, a map and text alternative, distance and route tools, time-aware plans, concrete exercise ideas, local multi-profile use, a private wellbeing diary and local-only visitor-report/map-suggestion flows.

The goal is a clear journey from “I want to move” to a realistic next activity at a nearby public place. The next pilot stage is field-checking more facilities with operators, testing time-aware plans with residents, and appointing a named review partner before any community information or new map location can be published.

## Instructions on how to open project

Requirements: Node.js 18 or newer.

1. Clone the repository.
2. Run `npm ci`.
3. Run `npm run dev`.
4. Open the local URL shown in the terminal.

Quality checks: `npm run lint` and `npm run build`.

Optional browser smoke tests: run `npx playwright install chromium`, then `npm run test:smoke`.

The application is a frontend prototype. It uses public map tiles and makes on-demand route requests only when a person asks for a walking or running route. No API key is required.

## Upload note

The replacement deck has 11 slides and is 0.96 MB, below the platform’s 10 MB limit. It includes real local screenshots of Explore, Today’s Plan, the private wellbeing diary and the local-only visitor-report form, alongside the future verification requirement, sources and AI-mark disclosure.

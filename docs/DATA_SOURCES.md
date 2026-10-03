# Data sources and attribution

## Map and pilot location data

- **OpenStreetMap contributors** — map tiles and initial place discovery records. Licence: Open Database Licence (ODbL). Attribution is shown beside the map and links to the OpenStreetMap copyright page.
- **Status:** imported pilot records are not field-verified. Equipment, access, accessibility, opening hours, and cost are recorded as unknown unless explicitly supported.

## Visual asset provenance

- **`public/active-city-hero.png`** — a new AI-generated editorial illustration for the app’s hero area, created on 2026-10-03 with the built-in image-generation workflow. It uses a user-supplied AI illustration only as visual-direction reference (Kraków riverside, blue/green palette and outdoor movement); it does not reuse that image or its generated lettering/logo. The final asset contains no text, logo or branding. Disclose this generated asset in the HackYeah submission/presentation if required by the competition rules.

## Documented outdoor gyms

- **Olszanica outdoor gym, ul. Grzegorza Korzeniaka 20** — Kraków’s official city service reports six strength-training devices, one double cardio device, and two calisthenics devices, plus benches and a rules board. Source published 2025-08-15.
- **Centrum Sportu Parkowa street workout, ul. Parkowa 12a** — the municipal District XIII bulletin documents a free, generally accessible street-workout area with pull-up bars, parallel bars, ladders, and other bodyweight-training equipment. Source: 2025 bulletin.
- **Park Klinówka Parkour, ul. Komuny Paryskiej** — Kraków’s official city service documents pull-up bars, platforms, ladders, and gymnastic rings in an open-to-all street-workout space. Source published 2025-07-31.
- **Park Przylasek Wyciąski, ul. Siejówka** — the Municipal Greenery Authority confirms an outdoor gym and sports zone. Its individual gym devices are not itemised, so the app does not invent them. Source published 2024-05-08.

The app links each documented gym directly to its public source. Equipment can change, so the app still asks people to confirm the on-site rules and current condition.

## Documented park-sport hub

- **Park Lotników Polskich** — the Municipal Greenery Authority lists street-workout equipment, a multi-purpose sports court, a pumptrack, a skatepark and a designated running route. Because the record does not itemise individual gym devices or confirm court availability, the app keeps those details unclaimed and asks people to check local conditions.

## Documented outdoor courts and pitches

- **Olszanica, ul. Grzegorza Korzeniaka 20** — the ZIS municipal facility record lists an outdoor artificial-turf football pitch and an outdoor multi-sport court. The city’s 2026 renewal notice additionally confirms basketball and volleyball equipment at the site.
- **Orlik Victoria, ul. Forteczna 75** — the ZIS municipal record lists an artificial-turf football pitch plus an outdoor polyurethane court for basketball and volleyball, including the listed hours. The app labels the hours as changeable.
- **KS Borek, ul. Żywiecka 13** — the ZIS municipal record identifies outdoor football, basketball and beach-volleyball facilities as well as a street-workout park. The operator’s booking and cost are intentionally left unconfirmed.
- **Park Kurdwanów** — the Municipal Greenery Authority records a basketball-and-volleyball court modernised in 2022, another sports field and an outdoor gym.
- **Park Krowoderski** — the Municipal Greenery Authority records several football pitches, a basketball court, volleyball court, street-workout equipment and a mini skating ramp.
- **Orlik Kabel, ul. Myśliwska 67** — the ZIS municipal record lists an artificial-turf football pitch and an outdoor polyurethane court for basketball and volleyball, together with lighting, fencing and changing/sanitary facilities. The app makes no claim about current availability or booking.
- **Park Ogród nad Sudołem, ul. Naczelna** — the Municipal Greenery Authority lists a grass volleyball court, outdoor gym, table-tennis tables and a pétanque court. The app retains a local-condition caveat.
- **Park Linearny Ruczaj** — the Municipal Greenery Authority lists stationary spinning bikes, table-tennis tables, a minigolf course and a pétanque court. The app asks people to check park rules and current equipment condition.

## Documented waterfront activities

- **Zalew Bagry** — the Municipal Greenery Authority lists two designated bathing areas. The app deliberately describes swimming as seasonal and limited to designated areas, with current safety information and signs taking priority.
- **Park Zakrzówek** — the Municipal Greenery Authority records bathing infrastructure, prepared running paths with stretching elements and drinking fountains, and opportunities for cycling and climbing. The app keeps swimming conditional on the designated bathing area being open and keeps climbing/cycling subject to local rules and conditions.

## Public display rule

- The public map and text list show only locations whose profile has a linked public source and documented activity or equipment detail. Imported OpenStreetMap discovery records remain in the project’s internal data only until a later verification pass improves them.

## Data handling rule

An imported map feature must not be presented as confirmation that the location is open, safe, step-free, free of charge, or suitable for a particular activity. A later verification pass will attach each facility to a specific source record and record its verification date.

## Recommendation prototype and personal data

- The recommendation interface requests a narrowed age range, self-described movement comfort, a general activity goal and an optional broad wellbeing focus. It does not collect diagnoses, symptoms, medication, injuries or medical history.
- These preferences are kept in React state by default. Up to five profiles can be held separately in one browser; device storage for profiles and diary entries is an explicit opt-in, and no server transmission occurs. Broad wellbeing focuses prioritise activity categories rather than making a medical assessment, exercise prescription or suitability decision. The existing-condition, injury or recovery option deliberately suppresses recommendations.
- General age-context wording links to the World Health Organization’s *WHO guidelines on physical activity and sedentary behaviour: at a glance* (2020). The app does not calculate individual activity targets from the guideline.

## Instructional exercise links

- The activity ideas use the NHS **Strength and Flex exercise plan: How-to videos** for its warm-up, standing press-up, squat, pull-up and related how-to videos. The page includes suitability and stop-if-unwell guidance.
- Walking ideas link to the NHS **Walking for health** guide; run–walk intervals link to the NHS **Couch to 5K running plan**; sprint cards link to the NHS running-injury guidance, which recommends warming up and building pace gradually.
- Yoga/mobility cards link to NHS Pilates and yoga videos. Balance cards link to the NHS illustrated balance-exercise guide.
- These external links are instructional resources, not claims that the exercise treats a medical condition. The app does not host or reproduce their imagery or video.
- The high-energy session builder uses the same NHS Couch to 5K, running-safety and strength-and-flex guidance. It does not set a personal target pace, repetition count or intensity prescription; it exposes only general preparation, recovery and stop-if-unwell guidance.

## Private wellbeing reflection

- The post-activity check-in is a self-described feeling log, not a symptom screener, diagnostic questionnaire or clinical record. It offers descriptive responses (for example, calmer or tired) and optional notes.
- Entries remain in browser memory by default. Saving across visits is explicit opt-in local device storage; disabling it removes the saved browser copy. A private summary is prepared only on screen for the person to review and manually share.
- Profiles and check-ins are separated on the device, so a person can keep distinct records for themselves and people they support. The feature does not create online accounts or cross-device syncing.
- The optional share-link tool creates a read-only URL containing only the selected entries, and includes optional notes only after a second explicit choice. It creates no Active City server copy, but anyone with the link can view its contents; the interface warns that links may be forwarded or retained in browser history.
- The wording acknowledges the broad wellbeing evidence in the World Health Organization physical-activity guidance, but does not make an individual clinical claim or provide a treatment recommendation.

## Targeted movement library

- The expanded movement library links out to the NHS **Strength and Flex exercise plan: How-to videos** for warm-up, posture and bodyweight-learning resources, and the NHS **Balance exercises** guide for sideways walking, heel-to-toe walking, supported one-leg stands, step-ups and simple grapevine steps.
- The strength/bodyweight category also links to the NHS **Strength exercises** guide for sit-to-stands, mini-squats, calf raises, supported sideways leg lifts, supported rear leg extensions and wall press-ups. The app repeats the guide’s emphasis on stable support, controlled movement and gradual progression.
- These are general educational resources. NHS advises people with a health problem, injury, symptoms, recent health event or uncertainty about suitability to seek individual healthcare advice before starting; the app preserves that boundary and tells people to stop if they feel pain or become unwell.

## Community activity-board prototype

- The app’s activity board is deliberately a browser-only, non-networked pilot design. Illustrative posts and newly created requests are not visible to other people; a planning action can add a documented activity to the active profile’s Today plan or open the public facility profile, but cannot send contact details, invite a person, or disclose live location.
- The design uses planned sessions at mapped public facilities rather than real-time check-ins. It deliberately excludes health information, direct contact details and location sharing. It is adult-only in this prototype; supporting younger people would require separate consent, safeguarding and supervision rules.
- Volunteer coach and trainer entries are labelled as unverified examples. The guidance directory separates volunteer movement guides (general encouragement only) from personal trainers. A live service must provide identity/role verification, qualification and insurance checks where relevant, safeguarding policy, clear boundaries between general instruction and healthcare, moderation and reporting, and venue availability checks before connecting people.
- The social rationale is grounded in the World Health Organization’s **Commission on Social Connection** (2025), which identifies social connection as a health and wellbeing concern. This is rationale for carefully designed group participation, not a claim that a particular meeting is safe or suitable for any individual.
- The safety-onboarding, moderation states, local report controls and trainer-verification screen are interaction prototypes only. They do not create accounts, capture supporting documents, verify credentials, submit reports, publish listings or exchange messages. A production system would need independently designed privacy, moderation, safeguarding, incident-response and credential-verification processes before enabling those actions. In particular, a named city, NGO or venue operator must appoint trained reviewers before a volunteer or trainer can be verified.
- The volunteer-application screen is also a local interaction prototype. Its acknowledgement is expressly **not** a liability waiver: a live service would still need identity checks, safeguarding, role-boundary review, any required qualification/insurance checks, a written volunteer agreement, moderation and venue approval before publishing a volunteer.

## Routing and travel estimates

- **Walking and running:** the interactive route layer requests a pedestrian route from the OpenStreetMap routing service only after the user asks for it. Running uses the same pedestrian geometry, with a different time and calorie estimate.
- **Public transport:** the app hands the journey to Google Maps, which can calculate a live transit itinerary. Kraków’s official ZTP GTFS and real-time feeds are suitable input for a future self-hosted journey planner but do not by themselves provide one.
- **Calories:** estimates use standard MET-based arithmetic from the selected mode, estimated duration, and a user-entered weight. They are general informational estimates, not medical or fitness advice.

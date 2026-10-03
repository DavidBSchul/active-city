# Data sources and attribution

## Map and pilot location data

- **OpenStreetMap contributors** — map tiles and initial place discovery records. Licence: Open Database Licence (ODbL). Attribution is shown beside the map and links to the OpenStreetMap copyright page.
- **Status:** imported pilot records are not field-verified. Equipment, access, accessibility, opening hours, and cost are recorded as unknown unless explicitly supported.

## Documented outdoor gyms

- **Olszanica outdoor gym, ul. Grzegorza Korzeniaka 20** — Kraków’s official city service reports six strength-training devices, one double cardio device, and two calisthenics devices, plus benches and a rules board. Source published 2025-08-15.
- **Centrum Sportu Parkowa street workout, ul. Parkowa 12a** — the municipal District XIII bulletin documents a free, generally accessible street-workout area with pull-up bars, parallel bars, ladders, and other bodyweight-training equipment. Source: 2025 bulletin.
- **Park Klinówka Parkour, ul. Komuny Paryskiej** — Kraków’s official city service documents pull-up bars, platforms, ladders, and gymnastic rings in an open-to-all street-workout space. Source published 2025-07-31.
- **Park Przylasek Wyciąski, ul. Siejówka** — the Municipal Greenery Authority confirms an outdoor gym and sports zone. Its individual gym devices are not itemised, so the app does not invent them. Source published 2024-05-08.

The app links each documented gym directly to its public source. Equipment can change, so the app still asks people to confirm the on-site rules and current condition.

## Documented outdoor courts and pitches

- **Olszanica, ul. Grzegorza Korzeniaka 20** — the ZIS municipal facility record lists an outdoor artificial-turf football pitch and an outdoor multi-sport court. The city’s 2026 renewal notice additionally confirms basketball and volleyball equipment at the site.
- **Orlik Victoria, ul. Forteczna 75** — the ZIS municipal record lists an artificial-turf football pitch plus an outdoor polyurethane court for basketball and volleyball, including the listed hours. The app labels the hours as changeable.
- **KS Borek, ul. Żywiecka 13** — the ZIS municipal record identifies outdoor football, basketball and beach-volleyball facilities as well as a street-workout park. The operator’s booking and cost are intentionally left unconfirmed.
- **Park Kurdwanów** — the Municipal Greenery Authority records a basketball-and-volleyball court modernised in 2022, another sports field and an outdoor gym.
- **Park Krowoderski** — the Municipal Greenery Authority records several football pitches, a basketball court, volleyball court, street-workout equipment and a mini skating ramp.

## Documented waterfront activities

- **Zalew Bagry** — the Municipal Greenery Authority lists two designated bathing areas. The app deliberately describes swimming as seasonal and limited to designated areas, with current safety information and signs taking priority.
- **Park Zakrzówek** — the Municipal Greenery Authority records bathing infrastructure, prepared running paths with stretching elements and drinking fountains, and opportunities for cycling and climbing. The app keeps swimming conditional on the designated bathing area being open and keeps climbing/cycling subject to local rules and conditions.

## Data handling rule

An imported map feature must not be presented as confirmation that the location is open, safe, step-free, free of charge, or suitable for a particular activity. A later verification pass will attach each facility to a specific source record and record its verification date.

## Recommendation prototype and personal data

- The recommendation interface requests a narrowed age range, self-described movement comfort, a general activity goal and an optional broad wellbeing focus. It does not collect diagnoses, symptoms, medication, injuries or medical history.
- These preferences are kept in React state only, with no local storage or server transmission. Broad wellbeing focuses prioritise activity categories rather than making a medical assessment, exercise prescription or suitability decision. The existing-condition, injury or recovery option deliberately suppresses recommendations.
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
- The wording acknowledges the broad wellbeing evidence in the World Health Organization physical-activity guidance, but does not make an individual clinical claim or provide a treatment recommendation.

## Targeted movement library

- The expanded movement library links out to the NHS **Strength and Flex exercise plan: How-to videos** for warm-up, posture and bodyweight-learning resources, and the NHS **Balance exercises** guide for sideways walking, heel-to-toe walking, supported one-leg stands, step-ups and simple grapevine steps.
- These are general educational resources. NHS advises people with a health problem, injury, symptoms, recent health event or uncertainty about suitability to seek individual healthcare advice before starting; the app preserves that boundary and tells people to stop if they feel pain or become unwell.

## Community activity-board prototype

- The app’s activity board is deliberately a browser-only, non-networked prototype. Sample posts and newly created requests are not visible to other people; pressing interest does not send contact details, invite a person, or disclose live location.
- The design uses planned sessions at mapped public facilities rather than real-time check-ins. It deliberately excludes health information, direct contact details and location sharing. It is adult-only in this prototype; supporting younger people would require separate consent, safeguarding and supervision rules.
- Volunteer coach and trainer entries are labelled as unverified examples. A live service must provide identity/role verification, qualification and insurance checks where relevant, safeguarding policy, clear boundaries between general instruction and healthcare, moderation and reporting, and venue availability checks before connecting people.
- The social rationale is grounded in the World Health Organization’s **Commission on Social Connection** (2025), which identifies social connection as a health and wellbeing concern. This is rationale for carefully designed group participation, not a claim that a particular meeting is safe or suitable for any individual.

## Routing and travel estimates

- **Walking and running:** the interactive route layer requests a pedestrian route from the OpenStreetMap routing service only after the user asks for it. Running uses the same pedestrian geometry, with a different time and calorie estimate.
- **Public transport:** the app hands the journey to Google Maps, which can calculate a live transit itinerary. Kraków’s official ZTP GTFS and real-time feeds are suitable input for a future self-hosted journey planner but do not by themselves provide one.
- **Calories:** estimates use standard MET-based arithmetic from the selected mode, estimated duration, and a user-entered weight. They are general informational estimates, not medical or fitness advice.

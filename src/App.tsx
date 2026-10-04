import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet'
import { locations, type RecreationLocation } from './data/locations'
import './App.css'

const KRAKOW_CENTER: [number, number] = [50.0614, 19.9366]
const pilotCity = {
  id: 'krakow',
  name: 'Krakow',
}
type Coordinates = { latitude: number; longitude: number }
type TravelMode = 'walking' | 'running' | 'transit'
type RouteData = { coordinates: [number, number][]; distanceKm: number; minutes: number; calories: number }
type TodayPlan = { locationId: string; activity: string; travelMode: TravelMode; timeBudgetMinutes: number }
type RoutingResponse = { routes?: Array<{ distance: number; geometry: { coordinates: [number, number][] } }> }
type GeocodingResult = { lat: string; lon: string; display_name: string }
type PlanStep = { title: string; detail: string; minutes: number }
type AgeRange = '0-4' | '5-8' | '9-12' | '13-15' | '16-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65-74' | '75-plus'
type MovementComfort = 'gentle' | 'steady' | 'energetic'
type ActivityGoal = 'everyday' | 'endurance' | 'strength' | 'team' | 'waterfront'
type WellbeingFocus = 'general' | 'mood' | 'heart' | 'mobility' | 'strength-bone' | 'condition'
type PostActivityFeeling = 'energised' | 'calmer' | 'about-the-same' | 'tired' | 'drained'
type ProfileRelationship = 'self' | 'person-supported' | 'child-supported' | 'partner-household'
type Profile = { id: string; name: string; relationship: ProfileRelationship; ageRange: AgeRange; movementComfort: MovementComfort; activityGoal: ActivityGoal; wellbeingFocus: WellbeingFocus }
type WellbeingCheckIn = { id: string; profileId: string; date: string; locationName: string; feeling: PostActivityFeeling; note: string }
type SharedProgress = { profileName: string; relationship: ProfileRelationship; entries: Array<Pick<WellbeingCheckIn, 'date' | 'locationName' | 'feeling' | 'note'>> }
type IntensiveSession = 'intervals' | 'strength-circuit' | 'court-conditioning'
type ExerciseCategory = 'all' | 'walk-run' | 'strength' | 'mobility-balance' | 'team'
type LocationActivityFilter = 'all' | 'walking' | 'running-cycling' | 'strength' | 'team' | 'waterfront'
type CommunityPostKind = 'activity' | 'team' | 'guidance'
type ModerationState = 'Illustrative listing — no connection' | 'Private draft — not published'
type CommunityPost = { id: string; kind: CommunityPostKind; activity: string; locationId: string; timing: string; capacity: number; interested: number; note: string; moderation: ModerationState }
type GuidanceRole = 'volunteer' | 'trainer'
type GuidanceOffer = { id: string; role: GuidanceRole; title: string; locationId: string; availability: string; topics: string; scope: string; enquiries: number; moderation: ModerationState }
type AppView = 'explore' | 'plan' | 'week' | 'community'
type WeeklyPattern = { movementDays: number; checkIns: number; familiarPlace?: string; reflection: string; nextStep: string }
type EquipmentCondition = 'good' | 'attention' | 'not-checked' | 'not-applicable'
type DescriptionAccuracy = 'accurate' | 'partly-accurate' | 'needs-review' | 'not-sure'
type PlaceBusyness = 'quiet' | 'some-people' | 'busy' | 'not-sure'
type VisitorMix = 'mostly-adults' | 'families-mixed' | 'mostly-young-people' | 'mixed-not-sure'
type PlaceReport = {
  id: string
  locationId: string
  equipmentCondition: EquipmentCondition
  descriptionAccuracy: DescriptionAccuracy
  busyness: PlaceBusyness
  visitorMix: VisitorMix
  note: string
  date: string
}
type MapSuggestion = {
  id: string
  name: string
  publicArea: string
  category: RecreationLocation['category']
  sourceUrl: string
  date: string
}

function viewFromCurrentUrl(): AppView {
  const view = new URLSearchParams(window.location.search).get('view')
  return view === 'plan' || view === 'week' || view === 'community' ? view : 'explore'
}

const WELLBEING_STORAGE_KEY = 'active-city-wellbeing-checkins-v1'
const WELLBEING_CONSENT_KEY = 'active-city-wellbeing-save-on-device-v1'
const PROFILE_STORAGE_KEY = 'active-city-profiles-v1'
const ACTIVE_PROFILE_STORAGE_KEY = 'active-city-active-profile-v1'
const SHARE_HASH_PREFIX = '#active-city-shared-progress='
const DEFAULT_PROFILE: Profile = { id: 'profile-self', name: 'My profile', relationship: 'self', ageRange: '25-34', movementComfort: 'steady', activityGoal: 'everyday', wellbeingFocus: 'general' }
const documentedLocations = locations.filter((location) => location.verificationStatus === 'documented')

const profileRelationshipLabel: Record<ProfileRelationship, string> = {
  self: 'My profile',
  'person-supported': 'Person I support',
  'child-supported': 'Child or young person I support',
  'partner-household': 'Partner or household profile',
}

const communityPostLabel: Record<CommunityPostKind, string> = {
  activity: 'Move together',
  team: 'Need players',
  guidance: 'Volunteer guidance offer',
}

const communitySeedPosts: CommunityPost[] = [
  { id: 'walk-bagry', kind: 'activity', activity: 'Easy waterfront walk', locationId: 'bagry', timing: 'A planned daytime session', capacity: 6, interested: 2, note: 'A low-pressure walk around the designated public paths.', moderation: 'Illustrative listing — no connection' },
  { id: 'basketball-olszanica', kind: 'team', activity: 'Basketball — need two more players', locationId: 'olszanica-outdoor-gym', timing: 'A planned evening session', capacity: 6, interested: 4, note: 'Bring a ball if you can; check court availability before travel.', moderation: 'Illustrative listing — no connection' },
  { id: 'mobility-klinowka', kind: 'guidance', activity: 'Outdoor mobility and warm-up basics', locationId: 'klinowka-parkour', timing: 'A planned weekend session', capacity: 8, interested: 3, note: 'Illustrative volunteer listing. Any live service would verify the organiser and clearly state qualifications.', moderation: 'Illustrative listing — no connection' },
]

const guidanceRoleLabel: Record<GuidanceRole, string> = {
  volunteer: 'Volunteer movement guide',
  trainer: 'Personal trainer',
}

const guidanceSeedOffers: GuidanceOffer[] = [
  { id: 'volunteer-warmup', role: 'volunteer', title: 'General warm-up and outdoor movement buddy', locationId: 'parkowa-street-workout', availability: 'Planned weekend daytime session', topics: 'Warm-up basics, gentle mobility, using public equipment with care', scope: 'Unverified role. General movement support only—not healthcare, rehabilitation or individual fitness assessment.', enquiries: 2, moderation: 'Illustrative listing — no connection' },
  { id: 'trainer-bodyweight', role: 'trainer', title: 'Bodyweight technique introduction', locationId: 'olszanica-outdoor-gym', availability: 'Planned weekday evening session', topics: 'Squat, supported press-up, pull-up progression and session warm-up', scope: 'Unverified trainer listing. A live service must verify identity, qualifications, insurance and scope before publication.', enquiries: 1, moderation: 'Illustrative listing — no connection' },
]

const exerciseCategoryLabel: Record<ExerciseCategory, string> = {
  all: 'All movement ideas',
  'walk-run': 'Walking and running',
  strength: 'Strength and bodyweight',
  'mobility-balance': 'Mobility and balance',
  team: 'Court and pitch preparation',
}

const exerciseCategoryIds: Record<Exclude<ExerciseCategory, 'all'>, string[]> = {
  'walk-run': ['fast-walk', 'run-walk', 'short-sprints', 'warm-up-posture'],
  strength: ['standing-press-up', 'bodyweight-squat', 'pull-up', 'sit-to-stand', 'calf-raises', 'sideways-leg-lift', 'rear-leg-extension'],
  'mobility-balance': ['yoga-mobility', 'sideways-walk', 'heel-to-toe', 'one-leg-stand', 'step-up', 'grapevine'],
  team: ['short-sprints', 'warm-up-posture', 'bodyweight-squat'],
}

const locationActivityFilterLabel: Record<LocationActivityFilter, string> = {
  all: 'All places',
  walking: 'Walking and gentle movement',
  'running-cycling': 'Running and cycling',
  strength: 'Strength and bodyweight',
  team: 'Team sport',
  waterfront: 'Waterfront activity',
}

const locationActivityMatches: Record<Exclude<LocationActivityFilter, 'all'>, string[]> = {
  walking: ['Walking', 'Gentle mobility', 'Outdoor movement', 'Low-impact outdoor movement', 'Walking and viewpoints'],
  'running-cycling': ['Running', 'Cycling'],
  strength: ['Strength training', 'Calisthenics', 'Bodyweight strength', 'Outdoor fitness', 'Street workout'],
  team: ['Football', 'Basketball', 'Volleyball', 'Beach volleyball'],
  waterfront: ['Seasonal swimming at designated bathing areas', 'Waterfront relaxation', 'Nature observation', 'Walking and viewpoints'],
}

const activityMatches: Record<ActivityGoal, Record<MovementComfort, string[]>> = {
  everyday: {
    gentle: ['Walking', 'Gentle mobility', 'Outdoor movement', 'Outdoor recreation', 'Walking and viewpoints'],
    steady: ['Walking', 'Gentle mobility', 'Outdoor movement', 'Outdoor recreation', 'Walking and viewpoints', 'Cycling'],
    energetic: ['Walking', 'Outdoor movement', 'Outdoor recreation', 'Walking and viewpoints', 'Running', 'Cycling'],
  },
  endurance: {
    gentle: ['Walking', 'Walking and viewpoints'],
    steady: ['Walking', 'Walking and viewpoints', 'Running', 'Cycling'],
    energetic: ['Running', 'Cycling', 'Seasonal swimming at designated bathing areas'],
  },
  strength: {
    gentle: ['Gentle mobility', 'Outdoor movement'],
    steady: ['Strength training', 'Calisthenics', 'Bodyweight strength', 'Outdoor fitness', 'Street workout'],
    energetic: ['Strength training', 'Calisthenics', 'Bodyweight strength', 'Outdoor fitness', 'Street workout'],
  },
  team: {
    gentle: [],
    steady: ['Basketball', 'Volleyball', 'Beach volleyball'],
    energetic: ['Football', 'Basketball', 'Volleyball', 'Beach volleyball'],
  },
  waterfront: {
    gentle: ['Walking and viewpoints', 'Waterfront relaxation', 'Nature observation', 'Walking'],
    steady: ['Walking and viewpoints', 'Waterfront relaxation', 'Nature observation', 'Walking', 'Cycling'],
    energetic: ['Walking and viewpoints', 'Running', 'Cycling', 'Seasonal swimming at designated bathing areas'],
  },
}

const wellbeingMatches: Record<Exclude<WellbeingFocus, 'general' | 'condition'>, Record<MovementComfort, string[]>> = {
  mood: activityMatches.everyday,
  heart: activityMatches.endurance,
  mobility: {
    gentle: ['Walking', 'Gentle mobility', 'Walking and viewpoints'],
    steady: ['Walking', 'Gentle mobility', 'Walking and viewpoints', 'Cycling'],
    energetic: ['Walking', 'Walking and viewpoints', 'Cycling', 'Running'],
  },
  'strength-bone': activityMatches.strength,
}

const ageGuide: Record<AgeRange, string> = {
  '0-4': 'This pilot does not recommend independent activities for children under five. Use local rules and caregiver judgement.',
  '5-8': 'For children, activity choices need caregiver judgement, supervision and local facility rules.',
  '9-12': 'For children, activity choices need caregiver judgement, supervision and local facility rules.',
  '13-15': 'For young people, activity choices need local facility rules and appropriate supervision where needed.',
  '16-17': 'For young people, activity choices need local facility rules and appropriate supervision where needed.',
  '18-24': 'For adults, WHO provides broad public-health guidance on regular aerobic and muscle-strengthening activity.',
  '25-34': 'For adults, WHO provides broad public-health guidance on regular aerobic and muscle-strengthening activity.',
  '35-44': 'For adults, WHO provides broad public-health guidance on regular aerobic and muscle-strengthening activity.',
  '45-54': 'For adults, WHO provides broad public-health guidance on regular aerobic and muscle-strengthening activity.',
  '55-64': 'For adults, WHO provides broad public-health guidance on regular aerobic and muscle-strengthening activity.',
  '65-74': 'For older adults, WHO notes the value of activity adjusted to functional ability, including balance and strength work where suitable.',
  '75-plus': 'For older adults, WHO notes the value of activity adjusted to functional ability, including balance and strength work where suitable.',
}

const goalLabel: Record<ActivityGoal, string> = {
  everyday: 'Build an everyday movement habit',
  endurance: 'Build cardio endurance',
  strength: 'Build strength and mobility',
  team: 'Play a team sport',
  waterfront: 'Enjoy waterfront activity',
}

const wellbeingLabel: Record<WellbeingFocus, string> = {
  general: 'General wellbeing',
  mood: 'Stress and mood',
  heart: 'Heart and aerobic fitness',
  mobility: 'Mobility and everyday movement',
  'strength-bone': 'Strength and bone health',
  condition: 'An existing health condition, injury or recovery',
}

const feelingLabel: Record<PostActivityFeeling, string> = {
  energised: 'More energised',
  calmer: 'Calmer',
  'about-the-same': 'About the same',
  tired: 'Tired',
  drained: 'Drained',
}

const feelingMessage: Record<PostActivityFeeling, string> = {
  energised: 'Nice work. Noticing what made this activity feel doable can help you repeat it.',
  calmer: 'You made space for a reset. A short activity can still be a meaningful part of a routine.',
  'about-the-same': 'Showing up still counts. Use the next check-in to notice what you would change.',
  tired: 'Rest and recovery are part of a sustainable routine. Choose your next step based on how you feel.',
  drained: 'A gentler next step may be more suitable. If this feeling is persistent, severe or worrying, seek individual support.',
}

function todayInKrakow() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date())
}

type ExerciseIdea = {
  id: string
  name: string
  summary: string
  safetyNote: string
  comfort: MovementComfort[]
  goals: ActivityGoal[]
  focuses: Exclude<WellbeingFocus, 'general' | 'condition'>[]
  locationActivities: string[]
  instructionUrl: string
  instructionLabel: string
}

const exerciseLibrary: ExerciseIdea[] = [
  {
    id: 'fast-walk', name: 'Fast walk', summary: 'A brisk walking option for building an everyday movement habit or aerobic fitness.', safetyNote: 'Choose a route and pace that feel manageable; build time and pace gradually.', comfort: ['gentle', 'steady', 'energetic'], goals: ['everyday', 'endurance', 'waterfront'], focuses: ['mood', 'heart', 'mobility'], locationActivities: ['Walking', 'Walking and viewpoints'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/walking-for-health/', instructionLabel: 'Open NHS walking guide',
  },
  {
    id: 'run-walk', name: 'Run–walk intervals', summary: 'A paced running-and-walking option for people comfortable with steady activity.', safetyNote: 'Use the gradual plan rather than jumping straight to sprints; stop if you feel pain or become unwell.', comfort: ['steady', 'energetic'], goals: ['everyday', 'endurance'], focuses: ['mood', 'heart'], locationActivities: ['Running'], instructionUrl: 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/', instructionLabel: 'Open NHS Couch to 5K plan',
  },
  {
    id: 'short-sprints', name: 'Short sprint efforts', summary: 'A higher-intensity running option for people already comfortable with energetic exercise.', safetyNote: 'Warm up first, use a clear and even surface, and build speed gradually rather than sprinting cold.', comfort: ['energetic'], goals: ['endurance', 'team'], focuses: ['heart'], locationActivities: ['Running', 'Football'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/knee-pain-and-other-running-injuries/', instructionLabel: 'Open NHS running safety guide',
  },
  {
    id: 'standing-press-up', name: 'Standing press-up', summary: 'A gentle upper-body movement that needs only a stable wall or other suitable fixed surface.', safetyNote: 'Use the video’s form guidance; choose a stable surface and stop if anything hurts.', comfort: ['gentle', 'steady'], goals: ['strength', 'everyday'], focuses: ['strength-bone', 'mobility'], locationActivities: ['Gentle mobility', 'Outdoor movement', 'Outdoor fitness'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/', instructionLabel: 'Open NHS press-up how-to video',
  },
  {
    id: 'bodyweight-squat', name: 'Bodyweight squat', summary: 'A lower-body movement to practise with a controlled range and no equipment.', safetyNote: 'Use the NHS video to check form and only move through a comfortable range.', comfort: ['steady', 'energetic'], goals: ['strength'], focuses: ['strength-bone', 'mobility'], locationActivities: ['Strength training', 'Outdoor fitness', 'Bodyweight strength'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/', instructionLabel: 'Open NHS squat how-to video',
  },
  {
    id: 'pull-up', name: 'Pull-up', summary: 'A bar-based upper-body movement for a documented calisthenics or bodyweight-training area.', safetyNote: 'For energetic users only. Inspect the bar, use the form video, and do not use damaged equipment.', comfort: ['energetic'], goals: ['strength'], focuses: ['strength-bone'], locationActivities: ['Calisthenics', 'Bodyweight strength'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/', instructionLabel: 'Open NHS pull-up how-to video',
  },
  {
    id: 'yoga-mobility', name: 'Yoga and mobility flow', summary: 'A movement and flexibility option that can be done in a calm, open part of a park.', safetyNote: 'Use a level-labelled video and a clear, dry space; do not treat a general video as care for pain or injury.', comfort: ['gentle', 'steady', 'energetic'], goals: ['everyday', 'strength', 'waterfront'], focuses: ['mood', 'mobility', 'strength-bone'], locationActivities: ['Gentle mobility', 'Outdoor movement', 'Walking and viewpoints'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/pilates-and-yoga/', instructionLabel: 'Open NHS yoga and Pilates videos',
  },
  {
    id: 'sideways-walk', name: 'Sideways walking and balance practice', summary: 'A gentle controlled-movement option for an everyday mobility focus.', safetyNote: 'Use a clear surface and stay near a stable support if you need one; this is not a substitute for falls assessment or rehabilitation.', comfort: ['gentle', 'steady'], goals: ['everyday'], focuses: ['mobility'], locationActivities: ['Walking', 'Gentle mobility', 'Outdoor movement'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/balance-exercises/', instructionLabel: 'Open NHS illustrated balance guide',
  },
  {
    id: 'heel-to-toe', name: 'Heel-to-toe walk', summary: 'A slow, controlled balance drill that can fit a calm walking routine.', safetyNote: 'Use a clear, level surface and stay near a stable support if you need one. Start small and build gradually.', comfort: ['gentle', 'steady'], goals: ['everyday'], focuses: ['mobility'], locationActivities: ['Walking', 'Gentle mobility', 'Outdoor movement'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/balance-exercises/', instructionLabel: 'Open NHS heel-to-toe guide',
  },
  {
    id: 'one-leg-stand', name: 'Supported one-leg stand', summary: 'A controlled balance practice for a clear space near a stable support.', safetyNote: 'Keep a wall or other stable support within reach; do not use this as a response to a recent fall or unsteadiness without individual advice.', comfort: ['gentle', 'steady'], goals: ['everyday'], focuses: ['mobility'], locationActivities: ['Gentle mobility', 'Outdoor movement', 'Walking'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/balance-exercises/', instructionLabel: 'Open NHS one-leg-stand guide',
  },
  {
    id: 'step-up', name: 'Controlled step-up', summary: 'A lower-body and balance movement for a secure step or low platform with support nearby.', safetyNote: 'Only use a stable step or platform that is intended for use; avoid damaged or wet surfaces and move slowly.', comfort: ['gentle', 'steady'], goals: ['everyday', 'strength'], focuses: ['mobility', 'strength-bone'], locationActivities: ['Outdoor fitness', 'Outdoor movement', 'Bodyweight strength'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/balance-exercises/', instructionLabel: 'Open NHS step-up guide',
  },
  {
    id: 'grapevine', name: 'Simple grapevine steps', summary: 'A sideways stepping pattern for coordination and gentle movement variety.', safetyNote: 'Use a dry, clear surface and a smaller step pattern if you are new to it; keep a stable support close if needed.', comfort: ['gentle', 'steady'], goals: ['everyday'], focuses: ['mobility', 'mood'], locationActivities: ['Walking', 'Gentle mobility', 'Outdoor movement'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/balance-exercises/', instructionLabel: 'Open NHS grapevine guide',
  },
  {
    id: 'warm-up-posture', name: 'Warm-up and movement posture', summary: 'A preparation routine before a faster walk, run, court session or bodyweight workout.', safetyNote: 'Warm up before more demanding activity and stop if pain or illness occurs. This is general fitness guidance, not treatment advice.', comfort: ['gentle', 'steady', 'energetic'], goals: ['everyday', 'endurance', 'strength', 'team'], focuses: ['mood', 'heart', 'mobility', 'strength-bone'], locationActivities: ['Walking', 'Running', 'Football', 'Basketball', 'Volleyball', 'Calisthenics', 'Strength training'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/', instructionLabel: 'Open NHS warm-up and posture videos',
  },
  {
    id: 'sit-to-stand', name: 'Sit-to-stand', summary: 'A controlled lower-body movement that starts and ends at a stable seat.', safetyNote: 'Only use a solid, stable seat or bench that will not move. Use the NHS guide and choose a comfortable range.', comfort: ['gentle', 'steady'], goals: ['everyday', 'strength'], focuses: ['mobility', 'strength-bone'], locationActivities: ['Outdoor movement', 'Outdoor fitness', 'Gentle mobility'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/', instructionLabel: 'Open NHS sit-to-stand guide',
  },
  {
    id: 'calf-raises', name: 'Controlled calf raises', summary: 'A slow standing movement that works the lower legs with support if needed.', safetyNote: 'Start near a stable support on a clear, dry surface. Lift and lower in a controlled way rather than bouncing.', comfort: ['gentle', 'steady'], goals: ['everyday', 'strength'], focuses: ['mobility', 'strength-bone'], locationActivities: ['Walking', 'Outdoor movement', 'Outdoor fitness'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/', instructionLabel: 'Open NHS calf-raise guide',
  },
  {
    id: 'sideways-leg-lift', name: 'Supported sideways leg lift', summary: 'A slow, supported standing movement for lower-body strength and control.', safetyNote: 'Keep a stable support within reach, move only as far as feels comfortable, and do not use it to self-treat pain or an injury.', comfort: ['gentle', 'steady'], goals: ['everyday', 'strength'], focuses: ['mobility', 'strength-bone'], locationActivities: ['Outdoor movement', 'Outdoor fitness', 'Gentle mobility'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/', instructionLabel: 'Open NHS sideways-leg-lift guide',
  },
  {
    id: 'rear-leg-extension', name: 'Supported rear leg extension', summary: 'A controlled standing movement that emphasises the back of the leg and hip area.', safetyNote: 'Use a stable support, keep your back neutral, and stop if the movement causes pain or makes you feel unwell.', comfort: ['gentle', 'steady'], goals: ['everyday', 'strength'], focuses: ['mobility', 'strength-bone'], locationActivities: ['Outdoor movement', 'Outdoor fitness', 'Gentle mobility'], instructionUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/', instructionLabel: 'Open NHS rear-leg-extension guide',
  },
]

function exercisesForRecommendedActivity(activity: string, comfort: MovementComfort) {
  const strengthLike = ['Strength training', 'Calisthenics', 'Bodyweight strength', 'Outdoor fitness', 'Street workout'].includes(activity)
  if (!strengthLike) return []
  const ids = comfort === 'gentle'
    ? ['standing-press-up', 'sit-to-stand', 'calf-raises']
    : comfort === 'energetic'
      ? activity === 'Calisthenics' || activity === 'Bodyweight strength'
        ? ['bodyweight-squat', 'pull-up', 'standing-press-up']
        : ['bodyweight-squat', 'standing-press-up', 'calf-raises']
      : ['bodyweight-squat', 'standing-press-up', 'calf-raises']
  return ids.map((id) => exerciseLibrary.find((exercise) => exercise.id === id)).filter((exercise): exercise is ExerciseIdea => Boolean(exercise))
}

const intensiveSessions: Record<IntensiveSession, { name: string; summary: string; requiredActivities: string[]; steps: string[]; instructionUrl: string; instructionLabel: string }> = {
  intervals: {
    name: 'High-energy intervals',
    summary: 'A run, pitch or court session that alternates faster efforts with easy recovery.',
    requiredActivities: ['Running', 'Football', 'Basketball'],
    steps: ['Warm up first with an easy walk or jog.', 'Use short, controlled faster efforts with easy walking or jogging recovery between them.', 'Finish with an easy walk and stop if pain, dizziness or unusual breathlessness occurs.'],
    instructionUrl: 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/',
    instructionLabel: 'Open NHS run–walk interval guidance',
  },
  'strength-circuit': {
    name: 'High-energy bodyweight circuit',
    summary: 'A bodyweight session using suitable documented outdoor-gym or calisthenics equipment.',
    requiredActivities: ['Strength training', 'Calisthenics', 'Bodyweight strength', 'Outdoor fitness'],
    steps: ['Warm up and inspect every bar or surface before using it.', 'Choose a pull-up or assisted pull-up, push-up and squat variation that you can control with good form.', 'Take recovery when form changes, then cool down before leaving the site.'],
    instructionUrl: 'https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/',
    instructionLabel: 'Open NHS strength and form videos',
  },
  'court-conditioning': {
    name: 'Court or pitch conditioning',
    summary: 'A fast-paced session for a clear, permitted outdoor court or pitch.',
    requiredActivities: ['Football', 'Basketball', 'Volleyball', 'Beach volleyball'],
    steps: ['Confirm the court or pitch is available, clear and permitted for training.', 'Warm up before using quick direction changes or short faster efforts.', 'Use generous recovery and finish while your movement remains controlled.'],
    instructionUrl: 'https://www.nhs.uk/live-well/exercise/knee-pain-and-other-running-injuries/',
    instructionLabel: 'Open NHS running warm-up and safety guidance',
  },
}

function labelForStatus(status: RecreationLocation['verificationStatus']) {
  return status === 'imported' ? 'Imported, not field-verified' : 'Documented in a public source'
}

function distanceInKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371
  const toRadians = (value: number) => (value * Math.PI) / 180
  const latitudeDifference = toRadians(to.latitude - from.latitude)
  const longitudeDifference = toRadians(to.longitude - from.longitude)
  const a = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(longitudeDifference / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function calorieEstimate(mode: Exclude<TravelMode, 'transit'>, minutes: number, weightKg: number) {
  const met = mode === 'walking' ? 3.5 : 9.8
  return Math.round((met * 3.5 * weightKg * minutes) / 200)
}

function travelEstimateMinutes(mode: TravelMode, distanceKm: number) {
  if (mode === 'walking') return Math.max(1, Math.round((distanceKm / 4.8) * 60))
  if (mode === 'running') return Math.max(1, Math.round((distanceKm / 8.5) * 60))
  return Math.max(8, Math.round((distanceKm / 22) * 60) + 8)
}

function allocatePlanMinutes(totalMinutes: number, weights: number[]) {
  const remaining = Math.max(0, totalMinutes)
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0)
  return weights.map((weight, index) => index === weights.length - 1
    ? Math.max(1, remaining - weights.slice(0, -1).reduce((sum, earlierWeight) => sum + Math.max(1, Math.round((remaining * earlierWeight) / weightTotal)), 0))
    : Math.max(1, Math.round((remaining * weight) / weightTotal)))
}

function buildSessionSteps(activity: string, availableMinutes: number): PlanStep[] {
  const minutes = Math.max(10, availableMinutes)
  const [warmUp, main, technique, coolDown] = allocatePlanMinutes(minutes, [2, 5, 2, 1])
  const activityName = activity.toLowerCase()
  if (activityName.includes('calisthenics') || activityName.includes('strength') || activityName.includes('bodyweight') || activityName.includes('fitness') || activityName.includes('street workout')) {
    return [
      { title: 'Warm up', minutes: warmUp, detail: 'Walk easily, then use gentle shoulder, hip and ankle movements. Inspect every bar, platform and surface before using it.' },
      { title: 'Main strength practice', minutes: main, detail: 'Choose controlled squats and standing press-ups. If a documented bar is sound and you are already comfortable, use an appropriate pull-up progression; rest whenever form changes.' },
      { title: 'Movement control', minutes: technique, detail: 'Add slow calf raises or supported balance work on a clear, dry surface. Keep a stable support within reach if you need one.' },
      { title: 'Ease out', minutes: coolDown, detail: 'Walk slowly, let your breathing settle, and stop if pain, dizziness or unusual breathlessness occurs.' },
    ]
  }
  if (activityName.includes('running')) {
    return [
      { title: 'Warm up', minutes: warmUp, detail: 'Start with an easy walk or very gentle jog on a clear surface.' },
      { title: 'Run–walk block', minutes: main, detail: 'Alternate comfortable running with easy walking recovery. Keep the faster portions controlled rather than sprinting cold.' },
      { title: 'Posture reset', minutes: technique, detail: 'Walk easily and check that your breathing and movement still feel controlled.' },
      { title: 'Ease out', minutes: coolDown, detail: 'Finish with an easy walk. Stop if pain, dizziness or unusual breathlessness occurs.' },
    ]
  }
  if (activityName.includes('football') || activityName.includes('basketball') || activityName.includes('volleyball')) {
    return [
      { title: 'Warm up', minutes: warmUp, detail: 'Confirm the court or pitch is available, clear and permitted for use; begin with easy walking, jogging and joint movements.' },
      { title: 'Skill block', minutes: main, detail: 'Practise the sport’s basic movements at a controlled pace. Leave generous recovery between faster changes of direction.' },
      { title: 'Movement control', minutes: technique, detail: 'Use slow side steps, balance work or easy passing before a final check that the surface still feels safe.' },
      { title: 'Ease out', minutes: coolDown, detail: 'Walk slowly and stop while your movement remains controlled.' },
    ]
  }
  if (activityName.includes('swimming')) {
    return [
      { title: 'Safety check', minutes: warmUp, detail: 'Use only an open, designated bathing area. Check current lifeguard, water-safety and on-site guidance before entering.' },
      { title: 'Water activity', minutes: main, detail: 'Keep the activity within your confidence and current conditions. Do not treat this outline as swimming instruction or water-safety advice.' },
      { title: 'Easy movement', minutes: technique, detail: 'Walk calmly on the designated paths and reassess how you feel.' },
      { title: 'Finish safely', minutes: coolDown, detail: 'Dry off, warm up and follow the site’s rules before leaving.' },
    ]
  }
  return [
    { title: 'Ease in', minutes: warmUp, detail: 'Start with a comfortable walk and gentle movements on a clear surface.' },
    { title: 'Main movement', minutes: main, detail: 'Use the documented activity at a pace that feels manageable. For walking, add short brisk sections only if they remain comfortable.' },
    { title: 'Mobility and balance', minutes: technique, detail: 'Try controlled calf raises, heel-to-toe walking or supported balance near a stable support if appropriate.' },
    { title: 'Ease out', minutes: coolDown, detail: 'Slow down, let your breathing settle, and stop if anything feels wrong.' },
  ]
}

function App() {
  const [activeView, setActiveView] = useState<AppView>(viewFromCurrentUrl)
  const [selectedId, setSelectedId] = useState(documentedLocations[0].id)
  const [profiles, setProfiles] = useState<Profile[]>([DEFAULT_PROFILE])
  const [activeProfileId, setActiveProfileId] = useState(DEFAULT_PROFILE.id)
  const [profileNameDraft, setProfileNameDraft] = useState('')
  const [profileRelationshipDraft, setProfileRelationshipDraft] = useState<ProfileRelationship>('self')
  const [showProfileCreator, setShowProfileCreator] = useState(false)
  const [locationInput, setLocationInput] = useState('')
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [locationError, setLocationError] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const [travelMode, setTravelMode] = useState<TravelMode>('walking')
  const [plannedActivity, setPlannedActivity] = useState(documentedLocations[0].activities[0])
  const [planDurationMinutes, setPlanDurationMinutes] = useState(60)
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null)
  const [weightKg, setWeightKg] = useState('70')
  const [route, setRoute] = useState<RouteData | null>(null)
  const [routeStatus, setRouteStatus] = useState('')
  const [ageRange, setAgeRange] = useState<AgeRange>('25-34')
  const [movementComfort, setMovementComfort] = useState<MovementComfort>('steady')
  const [activityGoal, setActivityGoal] = useState<ActivityGoal>('everyday')
  const [wellbeingFocus, setWellbeingFocus] = useState<WellbeingFocus>('general')
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [postActivityFeeling, setPostActivityFeeling] = useState<PostActivityFeeling>('energised')
  const [checkInNote, setCheckInNote] = useState('')
  const [checkIns, setCheckIns] = useState<WellbeingCheckIn[]>([])
  const [saveOnDevice, setSaveOnDevice] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState('')
  const [showPrivateSummary, setShowPrivateSummary] = useState(false)
  const [shareEntryIds, setShareEntryIds] = useState<string[]>([])
  const [shareIncludeNotes, setShareIncludeNotes] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [sharedProgress, setSharedProgress] = useState<SharedProgress | null>(null)
  const [intensiveSession, setIntensiveSession] = useState<IntensiveSession>('intervals')
  const [showIntensivePlan, setShowIntensivePlan] = useState(false)
  const [exerciseCategory, setExerciseCategory] = useState<ExerciseCategory>('all')
  const [locationActivityFilter, setLocationActivityFilter] = useState<LocationActivityFilter>('all')
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(communitySeedPosts)
  const [communityKind, setCommunityKind] = useState<CommunityPostKind>('activity')
  const [communityActivity, setCommunityActivity] = useState('Walking')
  const [communityMessage, setCommunityMessage] = useState('')
  const [guidanceOffers, setGuidanceOffers] = useState<GuidanceOffer[]>(guidanceSeedOffers)
  const [guidanceRole, setGuidanceRole] = useState<GuidanceRole>('volunteer')
  const [guidanceFocus, setGuidanceFocus] = useState('Warm-up and mobility')
  const [guidanceMessage, setGuidanceMessage] = useState('')
  const [adultDeclaration, setAdultDeclaration] = useState(false)
  const [communityRulesAccepted, setCommunityRulesAccepted] = useState(false)
  const [communityAccessReady, setCommunityAccessReady] = useState(false)
  const [communityAccessMessage, setCommunityAccessMessage] = useState('')
  const [flaggedItemIds, setFlaggedItemIds] = useState<string[]>([])
  const [trainerVerificationState, setTrainerVerificationState] = useState<'not-started' | 'demo-review'>('not-started')
  const [volunteerSafetyAcknowledged, setVolunteerSafetyAcknowledged] = useState(false)
  const [volunteerApplicationState, setVolunteerApplicationState] = useState<'not-started' | 'draft-review'>('not-started')
  const [equipmentCondition, setEquipmentCondition] = useState<EquipmentCondition>('good')
  const [descriptionAccuracy, setDescriptionAccuracy] = useState<DescriptionAccuracy>('accurate')
  const [placeBusyness, setPlaceBusyness] = useState<PlaceBusyness>('some-people')
  const [visitorMix, setVisitorMix] = useState<VisitorMix>('mixed-not-sure')
  const [placeReportNote, setPlaceReportNote] = useState('')
  const [placeReports, setPlaceReports] = useState<PlaceReport[]>([])
  const [placeReportMessage, setPlaceReportMessage] = useState('')
  const [contributorAcknowledged, setContributorAcknowledged] = useState(false)
  const [contributorReviewReady, setContributorReviewReady] = useState(false)
  const [contributorMessage, setContributorMessage] = useState('')
  const [suggestionName, setSuggestionName] = useState('')
  const [suggestionArea, setSuggestionArea] = useState('')
  const [suggestionCategory, setSuggestionCategory] = useState<RecreationLocation['category']>('Outdoor gym and sports complex')
  const [suggestionSourceUrl, setSuggestionSourceUrl] = useState('')
  const [mapSuggestions, setMapSuggestions] = useState<MapSuggestion[]>([])
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0]
  const selectedLocation = documentedLocations.find((location) => location.id === selectedId) ?? documentedLocations[0]
  const todayPlanLocation = todayPlan ? documentedLocations.find((location) => location.id === todayPlan.locationId) ?? documentedLocations[0] : null
  const visibleLocations = useMemo(() => {
    const withDistance = documentedLocations.map((location) => ({
      ...location,
      distanceKm: userLocation ? distanceInKm(userLocation, location) : undefined,
    }))
    return userLocation ? withDistance.sort((first, second) => first.distanceKm! - second.distanceKm!) : withDistance
  }, [userLocation])
  const filteredLocations = useMemo(() => {
    if (locationActivityFilter === 'all') return visibleLocations
    const matchingActivities = locationActivityMatches[locationActivityFilter]
    return visibleLocations.filter((location) => location.activities.some((activity) => matchingActivities.includes(activity)))
  }, [locationActivityFilter, visibleLocations])
  const todayPlanDistanceKm = todayPlan && userLocation && todayPlanLocation
    ? distanceInKm(userLocation, todayPlanLocation)
    : undefined
  const todayPlanOneWayMinutes = todayPlanDistanceKm === undefined || !todayPlan
    ? undefined
    : route && todayPlanLocation?.id === selectedLocation.id && todayPlan.travelMode !== 'transit' && travelMode === todayPlan.travelMode
      ? route.minutes
      : travelEstimateMinutes(todayPlan.travelMode, todayPlanDistanceKm)
  const todayPlanTravelMinutes = todayPlanOneWayMinutes === undefined ? undefined : todayPlanOneWayMinutes * 2
  const todayPlanActivityMinutes = todayPlan
    ? todayPlanTravelMinutes === undefined
      ? todayPlan.timeBudgetMinutes
      : Math.max(0, todayPlan.timeBudgetMinutes - todayPlanTravelMinutes)
    : 0
  const todayPlanSteps = todayPlan && todayPlanActivityMinutes >= 10
    ? buildSessionSteps(todayPlan.activity, todayPlanActivityMinutes)
    : []
  const nearbyPlanAlternatives = useMemo(() => {
    if (!todayPlan || !userLocation) return []
    const candidates = documentedLocations.filter((location) => location.id !== todayPlan.locationId)
    const exactActivityMatches = candidates.filter((location) => location.activities.includes(todayPlan.activity))
    const options = exactActivityMatches.length > 0 ? exactActivityMatches : candidates
    return options
      .map((location) => ({
        location,
        distanceKm: distanceInKm(userLocation, location),
        activity: location.activities.includes(todayPlan.activity) ? todayPlan.activity : location.activities[0],
        matchesActivity: location.activities.includes(todayPlan.activity),
      }))
      .sort((first, second) => first.distanceKm - second.distanceKm)
      .slice(0, 2)
  }, [todayPlan, userLocation])
  const activeCheckIns = useMemo(() => checkIns.filter((checkIn) => checkIn.profileId === activeProfile.id), [activeProfile.id, checkIns])
  const recommendations = useMemo(() => {
    const matches = wellbeingFocus === 'general'
      ? activityMatches[activityGoal][movementComfort]
      : wellbeingFocus === 'condition' ? [] : wellbeingMatches[wellbeingFocus][movementComfort]
    if (ageRange === '0-4' || matches.length === 0) return []
    const chosenIds = new Set<string>()
    return visibleLocations.flatMap((location) => {
      const matchingActivity = matches.find((activity) => location.activities.includes(activity))
      if (!matchingActivity || chosenIds.has(location.id)) return []
      chosenIds.add(location.id)
      return [{ location, matchingActivity, recommendedExercises: exercisesForRecommendedActivity(matchingActivity, movementComfort) }]
    }).slice(0, 3)
  }, [activityGoal, ageRange, movementComfort, visibleLocations, wellbeingFocus])
  const exerciseIdeas = useMemo(() => {
    if (ageRange === '0-4' || wellbeingFocus === 'condition') return []
    return exerciseLibrary.flatMap((exercise) => {
      const suitsFocus = wellbeingFocus === 'general' ? exercise.goals.includes(activityGoal) : exercise.focuses.includes(wellbeingFocus)
      if (!suitsFocus || !exercise.comfort.includes(movementComfort)) return []
      const location = visibleLocations.find((candidate) => exercise.locationActivities.some((activity) => candidate.activities.includes(activity)))
      return location ? [{ exercise, location }] : []
    }).slice(0, 4)
  }, [activityGoal, ageRange, movementComfort, visibleLocations, wellbeingFocus])
  const movementLibrary = useMemo(() => {
    const categoryIds = exerciseCategory === 'all' ? undefined : exerciseCategoryIds[exerciseCategory]
    return exerciseLibrary.filter((exercise) => !categoryIds || categoryIds.includes(exercise.id)).slice(0, 6)
  }, [exerciseCategory])
  const adultCommunityAccess = !['0-4', '5-8', '9-12', '13-15', '16-17'].includes(ageRange)
  const communityActionsEnabled = adultCommunityAccess && communityAccessReady
  const communityPostsWithLocation = useMemo(() => communityPosts.map((post) => ({
    ...post,
    location: documentedLocations.find((location) => location.id === post.locationId) ?? documentedLocations[0],
  })), [communityPosts])
  const guidanceOffersWithLocation = useMemo(() => guidanceOffers.map((offer) => ({
    ...offer,
    location: documentedLocations.find((location) => location.id === offer.locationId) ?? documentedLocations[0],
  })), [guidanceOffers])
  const activeChallengeDays = useMemo(() => {
    const today = new Date(`${todayInKrakow()}T00:00:00`)
    const activeDays = new Set<string>()
    activeCheckIns.forEach((checkIn) => {
      const loggedDay = new Date(`${checkIn.date}T00:00:00`)
      const difference = Math.round((today.getTime() - loggedDay.getTime()) / 86_400_000)
      if (difference >= 0 && difference < 7) activeDays.add(checkIn.date)
    })
    return activeDays.size
  }, [activeCheckIns])
  const weeklyPattern = useMemo<WeeklyPattern>(() => {
    const today = new Date(`${todayInKrakow()}T00:00:00`)
    const recentCheckIns = activeCheckIns.filter((checkIn) => {
      const loggedDay = new Date(`${checkIn.date}T00:00:00`)
      const difference = Math.round((today.getTime() - loggedDay.getTime()) / 86_400_000)
      return difference >= 0 && difference < 7
    })
    const placeCounts = recentCheckIns.reduce<Record<string, number>>((counts, checkIn) => ({ ...counts, [checkIn.locationName]: (counts[checkIn.locationName] ?? 0) + 1 }), {})
    const familiarPlace = Object.entries(placeCounts).sort(([, first], [, second]) => second - first)[0]?.[0]
    const tiredCheckIns = recentCheckIns.filter((checkIn) => checkIn.feeling === 'tired' || checkIn.feeling === 'drained').length
    const positiveCheckIns = recentCheckIns.filter((checkIn) => checkIn.feeling === 'energised' || checkIn.feeling === 'calmer').length

    if (recentCheckIns.length === 0) {
      return { movementDays: 0, checkIns: 0, reflection: 'Nothing logged yet. A short walk or a few minutes of gentle movement is enough to start a week.', nextStep: 'Choose a nearby place and give yourself 30 minutes, including the journey.' }
    }
    if (tiredCheckIns > positiveCheckIns) {
      return { movementDays: activeChallengeDays, checkIns: recentCheckIns.length, familiarPlace, reflection: 'You have logged more tired or drained moments than energised or calmer ones this week.', nextStep: 'Keep the next plan short and gentle. A nearby walk, warm-up or mobility session may feel more manageable.' }
    }
    if (activeChallengeDays < 3) {
      return { movementDays: activeChallengeDays, checkIns: recentCheckIns.length, familiarPlace, reflection: familiarPlace ? `${familiarPlace} has been your familiar place this week.` : 'You have started building a picture of what your week feels like.', nextStep: 'Add one more short movement day before the week ends. Repeating a place you already know is a good place to start.' }
    }
    return { movementDays: activeChallengeDays, checkIns: recentCheckIns.length, familiarPlace, reflection: familiarPlace ? `You came back to ${familiarPlace} this week.` : 'You have made time for movement on three or more days this week.', nextStep: 'Keep the next session easy to repeat. Notice what made it work, then write a few words afterwards.' }
  }, [activeChallengeDays, activeCheckIns])
  const privateSummary = useMemo(() => {
    const lines = activeCheckIns.slice(0, 14).map((checkIn) => `${checkIn.date} | ${checkIn.locationName} | ${feelingLabel[checkIn.feeling]}${checkIn.note ? ` | Note: ${checkIn.note}` : ''}`)
    return [`Active City private activity reflection — ${activeProfile.name}`, 'Generated locally for the user to review before sharing.', 'This is a personal reflection, not a clinical record.', '', ...lines].join('\n')
  }, [activeCheckIns, activeProfile.name])
  const selectedIntensiveSession = intensiveSessions[intensiveSession]
  const intensiveVenueMatch = selectedIntensiveSession.requiredActivities.some((activity) => selectedLocation.activities.includes(activity))

  useEffect(() => {
    try {
      if (window.localStorage.getItem(WELLBEING_CONSENT_KEY) === 'yes') {
        const savedProfiles = window.localStorage.getItem(PROFILE_STORAGE_KEY)
        const parsedProfiles = savedProfiles ? JSON.parse(savedProfiles) : []
        const validProfiles = Array.isArray(parsedProfiles)
          ? parsedProfiles.filter((profile): profile is Profile => typeof profile?.id === 'string' && typeof profile?.name === 'string' && typeof profile?.relationship === 'string' && typeof profile?.ageRange === 'string' && typeof profile?.movementComfort === 'string' && typeof profile?.activityGoal === 'string' && typeof profile?.wellbeingFocus === 'string')
          : []
        if (validProfiles.length > 0) {
          setProfiles(validProfiles)
          const savedActiveProfileId = window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)
          const savedActiveProfile = validProfiles.find((profile) => profile.id === savedActiveProfileId) ?? validProfiles[0]
          setActiveProfileId(savedActiveProfile.id)
          setAgeRange(savedActiveProfile.ageRange)
          setMovementComfort(savedActiveProfile.movementComfort)
          setActivityGoal(savedActiveProfile.activityGoal)
          setWellbeingFocus(savedActiveProfile.wellbeingFocus)
        }
        const saved = window.localStorage.getItem(WELLBEING_STORAGE_KEY)
        const parsed = saved ? JSON.parse(saved) : []
        if (Array.isArray(parsed)) setCheckIns(parsed.filter((entry) => typeof entry?.id === 'string' && typeof entry?.date === 'string' && typeof entry?.locationName === 'string' && typeof entry?.feeling === 'string' && typeof entry?.note === 'string').map((entry): WellbeingCheckIn => ({ ...entry, profileId: typeof entry.profileId === 'string' ? entry.profileId : DEFAULT_PROFILE.id })))
        setSaveOnDevice(true)
      }
    } catch {
      // A private check-in can still work for this browser session if storage is unavailable.
    }
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady || !saveOnDevice) return
    try {
      window.localStorage.setItem(WELLBEING_CONSENT_KEY, 'yes')
      window.localStorage.setItem(WELLBEING_STORAGE_KEY, JSON.stringify(checkIns))
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))
      window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, activeProfileId)
    } catch {
      setCheckInMessage('Your check-in is available in this browser tab, but this device could not save it for later.')
    }
  }, [activeProfileId, checkIns, profiles, saveOnDevice, storageReady])

  useEffect(() => {
    setProfiles((current) => current.map((profile) => profile.id === activeProfileId
      ? { ...profile, ageRange, movementComfort, activityGoal, wellbeingFocus }
      : profile))
  }, [activeProfileId, ageRange, activityGoal, movementComfort, wellbeingFocus])

  useEffect(() => {
    if (!window.location.hash.startsWith(SHARE_HASH_PREFIX)) return
    try {
      const payload = JSON.parse(decodeURIComponent(window.location.hash.slice(SHARE_HASH_PREFIX.length))) as SharedProgress
      if (typeof payload.profileName === 'string' && typeof payload.relationship === 'string' && Array.isArray(payload.entries) && payload.entries.every((entry) => typeof entry?.date === 'string' && typeof entry?.locationName === 'string' && typeof entry?.feeling === 'string' && typeof entry?.note === 'string')) {
        setSharedProgress(payload)
        setActiveView('week')
      }
    } catch {
      // An invalid shared link leaves the normal app view available.
    }
  }, [])

  useEffect(() => {
    const syncViewFromBrowser = () => setActiveView(viewFromCurrentUrl())
    window.addEventListener('popstate', syncViewFromBrowser)
    return () => window.removeEventListener('popstate', syncViewFromBrowser)
  }, [])

  const selectLocation = (location: RecreationLocation) => {
    openView('explore')
    setSelectedId(location.id)
    setPlannedActivity(location.activities[0])
    setRoute(null)
    setRouteStatus('')
    window.setTimeout(() => document.getElementById('location-profile')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0)
  }

  const activateProfile = (profile: Profile) => {
    setActiveProfileId(profile.id)
    setAgeRange(profile.ageRange)
    setMovementComfort(profile.movementComfort)
    setActivityGoal(profile.activityGoal)
    setWellbeingFocus(profile.wellbeingFocus)
    setShowRecommendations(false)
    setShowPrivateSummary(false)
    setShareEntryIds([])
    setShareLink('')
    setShareMessage('')
    setCommunityAccessReady(false)
    setCommunityAccessMessage('')
    setVolunteerSafetyAcknowledged(false)
    setVolunteerApplicationState('not-started')
  }

  const createProfile = () => {
    const name = profileNameDraft.trim()
    if (!name) return
    const profile: Profile = {
      id: `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      relationship: profileRelationshipDraft,
      ageRange: DEFAULT_PROFILE.ageRange,
      movementComfort: DEFAULT_PROFILE.movementComfort,
      activityGoal: DEFAULT_PROFILE.activityGoal,
      wellbeingFocus: DEFAULT_PROFILE.wellbeingFocus,
    }
    setProfiles((current) => [...current, profile])
    setProfileNameDraft('')
    setProfileRelationshipDraft('self')
    setShowProfileCreator(false)
    activateProfile(profile)
  }

  const updateLocation = async () => {
    if (!locationInput.trim()) {
      setUserLocation(null)
      setLocationError('')
      return
    }
    setIsLocating(true)
    setLocationError('')
    try {
      const endpoint = new URL('https://nominatim.openstreetmap.org/search')
      endpoint.searchParams.set('format', 'jsonv2')
      endpoint.searchParams.set('limit', '1')
      endpoint.searchParams.set('countrycodes', 'pl')
      endpoint.searchParams.set('q', `${locationInput.trim()}, Kraków`)
      const response = await fetch(endpoint)
      const matches = await response.json() as GeocodingResult[]
      const result = matches[0]
      const latitude = Number(result?.lat)
      const longitude = Number(result?.lon)
      if (!response.ok || !Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('No place found')
      setUserLocation({ latitude, longitude })
      setRoute(null)
      setRouteStatus('')
    } catch {
      setLocationError('We could not find that spot in Kraków. Try a neighbourhood, street or landmark—or use your device location.')
    } finally {
      setIsLocating(false)
    }
  }

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser cannot share its location here. Try a neighbourhood, street or landmark instead.')
      return
    }
    setIsLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude })
        setRoute(null)
        setRouteStatus('')
        setIsLocating(false)
      },
      () => {
        setLocationError('No problem—location was not shared. Try a neighbourhood, street or landmark instead.')
        setIsLocating(false)
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    )
  }

  const buildTodayPlan = () => {
    setTodayPlan({ locationId: selectedLocation.id, activity: plannedActivity, travelMode, timeBudgetMinutes: planDurationMinutes })
  }

  const choosePlanningLocation = (locationId: string) => {
    const location = documentedLocations.find((candidate) => candidate.id === locationId)
    if (!location) return
    setSelectedId(location.id)
    setPlannedActivity(location.activities[0])
    setTodayPlan(null)
    setRoute(null)
    setRouteStatus('')
  }

  const chooseNearbyPlanLocation = (location: RecreationLocation, activity: string) => {
    if (!todayPlan) return
    setSelectedId(location.id)
    setPlannedActivity(activity)
    setTodayPlan({ ...todayPlan, locationId: location.id, activity })
    setRoute(null)
    setRouteStatus('')
  }

  const reflectOnTodayPlan = () => {
    if (!todayPlanLocation || !todayPlan) return
    setSelectedId(todayPlanLocation.id)
    setPlannedActivity(todayPlan.activity)
    openView('week')
    setCheckInMessage(`Your ${todayPlan.activity.toLowerCase()} plan at ${todayPlanLocation.name} is ready to reflect on. Add a note only if it would be useful to you.`)
    window.setTimeout(() => document.getElementById('wellbeing-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const moveToPlanStep = (elementId: string) => {
    const viewByElement: Record<string, AppView> = {
      'location-profile': 'explore',
      'today-plan-heading': 'plan',
      'route-heading': 'plan',
      'wellbeing-heading': 'week',
    }
    openView(viewByElement[elementId] ?? 'plan')
    window.setTimeout(() => document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const openView = (view: AppView) => {
    setActiveView(view)
    const url = new URL(window.location.href)
    url.searchParams.set('view', view)
    window.history.pushState({ view }, '', `${url.pathname}${url.search}${url.hash}`)
    const startByView: Record<AppView, string> = {
      explore: 'app-content',
      plan: 'today-plan-heading',
      week: 'profile-hub-heading',
      community: 'community-heading',
    }
    window.setTimeout(() => document.getElementById(startByView[view])?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const showPedestrianRoute = async () => {
    if (!userLocation) {
      setRouteStatus('Add a starting point first, then we can look for a route.')
      return
    }
    const numericWeight = Number(weightKg)
    if (!Number.isFinite(numericWeight) || numericWeight <= 0 || numericWeight > 350) {
      setRouteStatus('Add a weight between 1 and 350 kg to see a general calorie estimate.')
      return
    }

    setRouteStatus('Finding a pedestrian route…')
    setRoute(null)
    try {
      const endpoint = new URL('https://routing.openstreetmap.de/routed-foot/route/v1/driving/')
      endpoint.pathname += `${userLocation.longitude},${userLocation.latitude};${selectedLocation.longitude},${selectedLocation.latitude}`
      endpoint.search = 'overview=full&geometries=geojson'
      const response = await fetch(endpoint)
      const payload = await response.json() as RoutingResponse
      const routeResult = payload.routes?.[0]
      if (!response.ok || !routeResult) throw new Error('No route returned')
      const distanceKm = routeResult.distance / 1000
      const speedKmPerHour = travelMode === 'walking' ? 4.8 : 8.5
      const minutes = Math.max(1, Math.round((distanceKm / speedKmPerHour) * 60))
      setRoute({
        coordinates: routeResult.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
        distanceKm,
        minutes,
        calories: calorieEstimate(travelMode === 'running' ? 'running' : 'walking', minutes, numericWeight),
      })
      setRouteStatus('')
    } catch {
      setRouteStatus('We could not get a walking route just now. Try again in a moment or use the public-transport option.')
    }
  }

  const addCheckIn = () => {
    const entry: WellbeingCheckIn = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      profileId: activeProfile.id,
      date: todayInKrakow(),
      locationName: selectedLocation.name,
      feeling: postActivityFeeling,
      note: checkInNote.trim(),
    }
    setCheckIns((current) => [entry, ...current].slice(0, 90))
    setCheckInNote('')
    setCheckInMessage(feelingMessage[postActivityFeeling])
    setShowPrivateSummary(false)
  }

  const updateDeviceSaving = (enabled: boolean) => {
    setSaveOnDevice(enabled)
    if (!enabled) {
      try {
        window.localStorage.removeItem(WELLBEING_CONSENT_KEY)
        window.localStorage.removeItem(WELLBEING_STORAGE_KEY)
        window.localStorage.removeItem(PROFILE_STORAGE_KEY)
        window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
      } catch {
        setCheckInMessage('Saving is off for future check-ins. This browser could not clear its previous saved copy.')
      }
    }
  }

  const clearCheckIns = () => {
    setCheckIns((current) => current.filter((checkIn) => checkIn.profileId !== activeProfile.id))
    setShareEntryIds([])
    setShareLink('')
    setShowPrivateSummary(false)
    setCheckInMessage(`Check-ins for ${activeProfile.name} have been cleared from this browser tab and, if enabled, this device.`)
  }

  const toggleShareEntry = (entryId: string) => {
    setShareEntryIds((current) => current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId])
    setShareLink('')
    setShareMessage('')
  }

  const prepareShareLink = () => {
    const entries = activeCheckIns.filter((entry) => shareEntryIds.includes(entry.id)).map((entry) => ({
      date: entry.date,
      locationName: entry.locationName,
      feeling: entry.feeling,
      note: shareIncludeNotes ? entry.note : '',
    }))
    if (entries.length === 0) {
      setShareMessage('Choose at least one reflection to share first.')
      return
    }
    const payload: SharedProgress = { profileName: activeProfile.name, relationship: activeProfile.relationship, entries }
    setShareLink(`${window.location.origin}${window.location.pathname}${SHARE_HASH_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`)
    setShareMessage('Your link is ready. Anyone with it can see only the reflections you chose.')
  }

  const copyShareLink = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setShareMessage('Link copied. Share it only with someone you trust.')
    } catch {
      setShareMessage('Copy was not available in this browser. You can select and copy the link below manually.')
    }
  }

  const addCommunityActivityToPlan = (postId: string) => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Tick the two safety statements first, then you can add this to your plan.')
      return
    }
    const post = communityPosts.find((item) => item.id === postId)
    const location = post ? documentedLocations.find((item) => item.id === post.locationId) : undefined
    if (!post || !location) return
    const activity = location.activities.find((item) => post.activity.includes(item)) ?? location.activities[0]
    setSelectedId(location.id)
    setPlannedActivity(activity)
    setTodayPlan({ locationId: location.id, activity, travelMode, timeBudgetMinutes: planDurationMinutes })
    setRoute(null)
    setRouteStatus('')
    setCommunityMessage(`${activity} at ${location.name} is now in ${activeProfile.name}'s plan. No one else has been contacted.`)
    moveToPlanStep('today-plan-heading')
  }

  const createCommunityRequest = () => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Tick the two safety statements first, then you can make a private draft.')
      return
    }
    const activityLabel = communityActivity
    const description = communityKind === 'team'
      ? `${activityLabel} — need players`
      : communityKind === 'guidance'
        ? `${activityLabel} guidance offer`
        : `${activityLabel} activity request`
    setCommunityPosts((current) => [{
      id: `community-${Date.now()}`,
      kind: communityKind,
      activity: description,
      locationId: selectedLocation.id,
      timing: 'A future planned session',
      capacity: communityKind === 'team' ? 6 : 8,
      interested: 1,
      moderation: 'Private draft — not published',
      note: communityKind === 'guidance'
        ? 'Private guidance draft. A live service must verify credentials, role boundaries and safeguarding before publishing.'
        : 'Private request draft. Confirm venue availability and agree details through a moderated service before meeting.',
    }, ...current])
    setCommunityMessage('Your idea is saved as a private draft in this browser tab. It is not visible to anyone else and does not send an invitation.')
  }

  const registerGuidanceInterest = (offerId: string) => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Tick the two safety statements first, then you can review this listing.')
      return
    }
    const offer = guidanceOffers.find((item) => item.id === offerId)
    const location = offer ? documentedLocations.find((item) => item.id === offer.locationId) : undefined
    if (!offer || !location) return
    setSelectedId(location.id)
    setPlannedActivity(location.activities[0])
    setRoute(null)
    setRouteStatus('')
    setGuidanceMessage(`${location.name} is selected so you can look at the place and what this guide could offer. This is not a contactable listing yet.`)
    moveToPlanStep('location-profile')
  }

  const addGuidanceOffer = () => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Complete the local safety setup before creating a sample listing.')
      return
    }
    const title = guidanceRole === 'trainer'
      ? `${guidanceFocus} personal-training offer`
      : `${guidanceFocus} volunteer movement offer`
    setGuidanceOffers((current) => [{
      id: `guidance-${Date.now()}`,
      role: guidanceRole,
      title,
      locationId: selectedLocation.id,
      availability: 'A future planned session',
      topics: guidanceFocus,
      scope: guidanceRole === 'trainer'
        ? 'Private trainer draft. A live listing requires identity, qualification, insurance and scope verification before it can receive enquiries.'
        : 'Private volunteer draft. General activity encouragement only—not healthcare, rehabilitation or individual fitness assessment.',
      enquiries: 0,
      moderation: 'Private draft — not published',
    }, ...current])
    setGuidanceMessage('Your guidance offer is saved as a private draft in this browser tab. It has not been published or shared with anyone.')
  }

  const enableCommunityActions = () => {
    if (!adultCommunityAccess) {
      setCommunityAccessMessage('This prototype does not enable community actions for under-18 profiles.')
      return
    }
    if (!adultDeclaration || !communityRulesAccepted) {
      setCommunityAccessMessage('Confirm both safety statements before enabling local planning actions.')
      return
    }
    setCommunityAccessReady(true)
    setCommunityAccessMessage('Local planning actions are enabled for this browser tab. Nothing is published, sent, or saved after you close it.')
  }

  const flagCommunityItem = (itemId: string) => {
    setFlaggedItemIds((current) => current.includes(itemId) ? current : [...current, itemId])
    setCommunityAccessMessage('This item is flagged in this browser tab. A real service would send it to trained moderators and provide follow-up options.')
  }

  const startTrainerVerificationDemo = () => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Complete the local safety setup before preparing a verification checklist.')
      return
    }
    setTrainerVerificationState('demo-review')
    setGuidanceMessage('A local verification checklist is ready. No documents were collected and nobody was verified: a live service needs a named city, NGO, or venue operator to appoint trained reviewers.')
  }

  const startVolunteerApplicationDemo = () => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Complete the local safety setup before preparing a volunteer application draft.')
      return
    }
    if (!volunteerSafetyAcknowledged) {
      setGuidanceMessage('Read and acknowledge the volunteer safety boundary before preparing a local application draft.')
      return
    }
    setVolunteerApplicationState('draft-review')
    setGuidanceMessage('A local application draft is ready. It was not submitted or verified: a live service needs a named city, NGO, or venue operator to check identity, safeguarding, role boundaries and the written agreement before approval.')
  }

  const savePlaceReport = () => {
    const report: PlaceReport = {
      id: `place-report-${Date.now()}`,
      locationId: selectedLocation.id,
      equipmentCondition,
      descriptionAccuracy,
      busyness: placeBusyness,
      visitorMix,
      note: placeReportNote.trim(),
      date: todayInKrakow(),
    }
    setPlaceReports((current) => [report, ...current].slice(0, 25))
    setPlaceReportNote('')
    setPlaceReportMessage(`Saved privately for ${selectedLocation.name}. It has not changed the public map.`)
  }

  const prepareContributorReview = () => {
    if (!contributorAcknowledged) {
      setContributorMessage('Please confirm the public-place and privacy statement first.')
      return
    }
    setContributorReviewReady(true)
    setContributorMessage('Contributor review is ready in this prototype. No identity documents are requested or checked here.')
  }

  const saveMapSuggestion = () => {
    const name = suggestionName.trim()
    const publicArea = suggestionArea.trim()
    const sourceUrl = suggestionSourceUrl.trim()
    if (!name || !publicArea || !sourceUrl) {
      setContributorMessage('Add a name, a public park or street reference, and a public source or map link.')
      return
    }
    setMapSuggestions((current) => [{
      id: `map-suggestion-${Date.now()}`,
      name,
      publicArea,
      category: suggestionCategory,
      sourceUrl,
      date: todayInKrakow(),
    }, ...current].slice(0, 10))
    setSuggestionName('')
    setSuggestionArea('')
    setSuggestionSourceUrl('')
    setContributorMessage('Suggestion saved privately in this browser. A future reviewer must confirm public access, the location and the description before any marker is added.')
  }

  const publicTransportUrl = userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedLocation.latitude},${selectedLocation.longitude}&travelmode=transit`
    : undefined

  return (
    <main className={`city-theme city-theme--${pilotCity.id}`}>
      <header className="hero">
        <div className="hero-copy">
          <img alt="Green Active City tree mark with subtle movement symbols" className="active-city-logo" src={`${import.meta.env.BASE_URL}active-city-logo.png`} />
          <p className="eyebrow">Fundacja Życie, Razem · HackYeah 2026 prototype</p>
          <h1>Active City Kraków</h1>
          <p className="intro">Find a nearby public place to move, then make a plan for the time you have.</p>
        </div>
      </header>

      <nav aria-label="Main sections" className="app-navigation">
        {([
          ['explore', 'Explore'],
          ['plan', 'Plan'],
          ['week', 'My week'],
          ['community', 'Community'],
        ] as Array<[AppView, string]>).map(([view, label]) => (
          <a aria-current={activeView === view ? 'page' : undefined} className={activeView === view ? 'selected' : ''} href={`?view=${view}${window.location.hash}`} key={view} onClick={(event) => { event.preventDefault(); openView(view) }}>
            <strong>{label}</strong>
          </a>
        ))}
      </nav>

      {sharedProgress && activeView === 'week' && (
        <aside className="shared-progress" aria-labelledby="shared-progress-heading">
          <p className="eyebrow">Shared with you</p>
          <h2 id="shared-progress-heading">A few reflections from {sharedProgress.profileName}</h2>
          <p>This link shows only what they chose to share. It will not change anything on your device or make health recommendations.</p>
          <ul>{sharedProgress.entries.map((entry, index) => <li key={`${entry.date}-${entry.locationName}-${index}`}><strong>{entry.date}</strong> · {entry.locationName} · {feelingLabel[entry.feeling]}{entry.note ? ` — ${entry.note}` : ''}</li>)}</ul>
        </aside>
      )}

      <section className="profile-hub" aria-labelledby="profile-hub-heading" hidden={activeView !== 'week'}>
        <div>
          <p className="eyebrow">Your space</p>
          <h2 id="profile-hub-heading">Who is this plan for?</h2>
          <p>Keep a separate space for yourself, someone you support, a child, or someone at home. No sign-in needed.</p>
        </div>
        <div className="profile-tabs" aria-label="Choose a profile">
          {profiles.map((profile) => <button aria-pressed={profile.id === activeProfile.id} className={profile.id === activeProfile.id ? 'selected' : ''} key={profile.id} onClick={() => activateProfile(profile)} type="button"><strong>{profile.name}</strong><span>{profileRelationshipLabel[profile.relationship]}</span></button>)}
          {profiles.length < 5 && <button className="add-profile" onClick={() => setShowProfileCreator((visible) => !visible)} type="button">{showProfileCreator ? 'Close' : 'Add profile'}</button>}
        </div>
        {showProfileCreator && (
          <form className="profile-creator" onSubmit={(event) => { event.preventDefault(); createProfile() }}>
            <label>
              Profile name
              <input maxLength={40} onChange={(event) => setProfileNameDraft(event.target.value)} placeholder="For example, Mum or Our weekend plan" value={profileNameDraft} />
            </label>
            <label>
              This profile is for
              <select onChange={(event) => setProfileRelationshipDraft(event.target.value as ProfileRelationship)} value={profileRelationshipDraft}>
                {Object.entries(profileRelationshipLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button disabled={!profileNameDraft.trim()} type="submit">Create profile</button>
          </form>
        )}
        <p className="profile-device-note">{saveOnDevice ? 'Profiles and diary entries are saved on this device only.' : 'Profiles and diary entries are currently available only in this browser tab. Turn on device saving below to keep them after closing it.'}</p>
      </section>

      <section aria-labelledby="map-heading" className="discovery" id="app-content">
        <div className="section-heading" hidden={activeView !== 'explore'}>
          <div>
            <p className="eyebrow">Explore</p>
            <h2 id="map-heading">Krakow recreation spaces</h2>
          </div>
          <p className="location-count">{documentedLocations.length} places to explore</p>
        </div>

        <form className="distance-form" hidden={activeView !== 'explore'} onSubmit={(event) => { event.preventDefault(); updateLocation() }}>
          <div>
            <label htmlFor="location-input">Where are you starting from?</label>
            <input
              aria-describedby="location-help location-error"
              id="location-input"
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Neighbourhood, street, or landmark — e.g. Main Square"
              type="text"
              value={locationInput}
            />
          </div>
          <div className="location-actions">
            <button disabled={isLocating} type="submit">{isLocating ? 'Finding your place…' : 'Find nearby places'}</button>
            <button className="secondary-location-action" disabled={isLocating} onClick={useDeviceLocation} type="button">Use my device location</button>
          </div>
          <p id="location-help">We only search after you tap the button. A typed place or route request is sent to OpenStreetMap services to find it; Active City does not save it. Device location asks your browser first. <a href="/trust/privacy/">Privacy</a></p>
          {locationError && <p className="location-error" id="location-error" role="alert">{locationError}</p>}
          {userLocation && <p className="location-sorted">Here are the places closest to you first.</p>}
        </form>
        <label className="location-filter" hidden={activeView !== 'explore'}>
          Show places for
          <select onChange={(event) => setLocationActivityFilter(event.target.value as LocationActivityFilter)} value={locationActivityFilter}>
            {Object.entries(locationActivityFilterLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <span>{filteredLocations.length} of {documentedLocations.length} places are on the map and in the list below.</span>
        </label>
        <p className="coverage-note" hidden={activeView !== 'explore'}>We have started with places we can link back to a public source. More places are being checked before they appear here.</p>

        <section className="today-plan" aria-labelledby="today-plan-heading" hidden={activeView !== 'plan'}>
          <div>
            <p className="eyebrow">Make it work for today</p>
            <h3 id="today-plan-heading">What have you got time for?</h3>
            <p>Pick the time you have, including getting there and back. We will help you work out whether this place fits—and suggest a simple way to use the time you have left.</p>
          </div>
          <div className="today-plan-controls">
            <label>
              Choose a place
              <select onChange={(event) => choosePlanningLocation(event.target.value)} value={selectedLocation.id}>
                {visibleLocations.map((location) => <option key={location.id} value={location.id}>{location.name}{location.distanceKm === undefined ? '' : ` · ${location.distanceKm.toFixed(1)} km`}</option>)}
              </select>
            </label>
            <label>
              Activity at this place
              <select onChange={(event) => setPlannedActivity(event.target.value)} value={plannedActivity}>
                {selectedLocation.activities.map((activity) => <option key={activity} value={activity}>{activity}</option>)}
              </select>
            </label>
            <label>
              Travel choice
              <select onChange={(event) => { setTravelMode(event.target.value as TravelMode); setRoute(null); setRouteStatus('') }} value={travelMode}>
                <option value="walking">Walk there</option>
                <option value="running">Run there</option>
                <option value="transit">Take public transport</option>
              </select>
            </label>
            <label>
              Total time available
              <select onChange={(event) => setPlanDurationMinutes(Number(event.target.value))} value={planDurationMinutes}>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1½ hours</option>
                <option value={120}>2 hours</option>
              </select>
            </label>
            <button onClick={buildTodayPlan} type="button">Make today’s plan</button>
          </div>
          {todayPlan && todayPlanLocation && (
            <div className="today-plan-result" aria-live="polite">
              <div>
                <p className="eyebrow">Today’s plan</p>
                <h4>{todayPlan.activity} at {todayPlanLocation.name}</h4>
                {todayPlanDistanceKm === undefined ? (
                  <p>Add a starting point above and we can check whether the journey fits. For now, here is a {todayPlan.timeBudgetMinutes}-minute movement outline without travel time.</p>
                ) : (
                  <p><strong>{todayPlanDistanceKm.toFixed(1)} km away</strong> as the crow-flies distance. Plan for around {todayPlanOneWayMinutes} minutes each way by {todayPlan.travelMode === 'transit' ? 'public transport' : todayPlan.travelMode}; that is {todayPlanTravelMinutes} of your {todayPlan.timeBudgetMinutes} minutes for getting there and back.</p>
                )}
              </div>
              <div className="today-plan-actions">
                <button onClick={() => moveToPlanStep('location-profile')} type="button">Review place details</button>
                <button onClick={() => moveToPlanStep('route-heading')} type="button">Plan travel</button>
                <button onClick={reflectOnTodayPlan} type="button">I’m back — reflect</button>
              </div>
              {todayPlanDistanceKm !== undefined && todayPlanActivityMinutes < 10 ? (
                <div className="today-plan-warning">
                  <strong>That is a lot of travelling for today.</strong>
                  <p>The return journey would leave less than 10 minutes to move. A closer place—or a little more time—will make this feel more worthwhile.</p>
                  {nearbyPlanAlternatives.length > 0 ? (
                    <div className="nearby-plan-options">
                      <p>{nearbyPlanAlternatives[0].matchesActivity ? 'Closer places with the same documented activity:' : 'Closest documented places, with an activity available there:'}</p>
                      {nearbyPlanAlternatives.map(({ location, distanceKm, activity }) => <button key={location.id} onClick={() => chooseNearbyPlanLocation(location, activity)} type="button">Choose {location.name} · {distanceKm.toFixed(1)} km · {activity}</button>)}
                    </div>
                  ) : <p>No other documented place is available in this pilot yet. Try a different activity or increase the time available.</p>}
                </div>
              ) : (
                <div className="today-session-outline">
                  <div>
                    <p className="eyebrow">Your movement time</p>
                    <h5>{todayPlanActivityMinutes} minutes to get moving</h5>
                    <p>{todayPlanDistanceKm === undefined ? 'Add travel time once you set a starting point.' : 'This is what is left once you have allowed for the journey.'}</p>
                  </div>
                  <ol>
                    {todayPlanSteps.map((step) => <li key={step.title}><strong>{step.minutes} min · {step.title}</strong><span>{step.detail}</span></li>)}
                  </ol>
                </div>
              )}
              <p className="today-plan-note">Journeys and access can change, so check the route, timetable and on-site signs before you go. This is a gentle starting point—not a prescription or a safety assessment.</p>
            </div>
          )}
        </section>

        <section className="preference-panel" aria-labelledby="preference-heading" hidden={activeView !== 'plan'}>
          <div>
            <p className="eyebrow">Start where you are</p>
            <h3 id="preference-heading">What feels right today?</h3>
            <p className="preference-intro">Tell us a little about what <strong>{activeProfile.name}</strong> is in the mood for. We use these broad choices to find ideas at the places on the map—not medical details.</p>
          </div>
          <form className="preference-form" onSubmit={(event) => { event.preventDefault(); setShowRecommendations(true) }}>
            <label>
              Age range
              <select onChange={(event) => setAgeRange(event.target.value as AgeRange)} value={ageRange}>
                <option value="0-4">0–4</option>
                <option value="5-8">5–8</option>
                <option value="9-12">9–12</option>
                <option value="13-15">13–15</option>
                <option value="16-17">16–17</option>
                <option value="18-24">18–24</option>
                <option value="25-34">25–34</option>
                <option value="35-44">35–44</option>
                <option value="45-54">45–54</option>
                <option value="55-64">55–64</option>
                <option value="65-74">65–74</option>
                <option value="75-plus">75+</option>
              </select>
            </label>
            <label>
              Movement comfort today
              <select onChange={(event) => setMovementComfort(event.target.value as MovementComfort)} value={movementComfort}>
                <option value="gentle">Gentle or getting started</option>
                <option value="steady">Comfortable with steady activity</option>
                <option value="energetic">Comfortable with energetic activity</option>
              </select>
            </label>
            <label>
              Activity or health goal
              <select onChange={(event) => setActivityGoal(event.target.value as ActivityGoal)} value={activityGoal}>
                <option value="everyday">Build an everyday movement habit</option>
                <option value="endurance">Build cardio endurance</option>
                <option value="strength">Build strength and mobility</option>
                <option value="team">Play a team sport</option>
                <option value="waterfront">Enjoy waterfront activity</option>
              </select>
            </label>
            <label>
              Wellbeing focus
              <select onChange={(event) => setWellbeingFocus(event.target.value as WellbeingFocus)} value={wellbeingFocus}>
                <option value="general">General wellbeing</option>
                <option value="mood">Stress and mood</option>
                <option value="heart">Heart and aerobic fitness</option>
                <option value="mobility">Mobility and everyday movement</option>
                <option value="strength-bone">Strength and bone health</option>
                <option value="condition">Existing health condition, injury or recovery</option>
              </select>
            </label>
            <button type="submit">Show activity ideas</button>
          </form>
          {showRecommendations && (
            <div className="recommendation-results" aria-live="polite">
              <p className="recommendation-guide">{ageGuide[ageRange]} {wellbeingFocus === 'condition' ? 'For an existing condition, injury or recovery, get individual advice from a qualified health professional before using this tool for activity decisions.' : `These are place-and-activity matches for “${goalLabel[activityGoal]}” with a “${wellbeingLabel[wellbeingFocus]}” focus, not medical or training advice.`} <a href="https://www.who.int/publications/i/item/9789240014886" rel="noreferrer" target="_blank">Read WHO’s general physical-activity guidance.</a></p>
              {recommendations.length > 0 ? (
                <div>
                  <div className="recommendation-cards">
                    {recommendations.map(({ location, matchingActivity, recommendedExercises }) => (
                      <button className="recommendation-card" key={location.id} onClick={() => selectLocation(location)} type="button">
                        <span className="category-dot" style={{ background: location.color }} />
                        <span>
                          {recommendedExercises.length > 0 ? <><strong>Try {recommendedExercises.map((exercise) => exercise.name).join(', ')}</strong><span>At {location.name} · {matchingActivity}</span></> : <><strong>{matchingActivity} at {location.name}</strong><span>Choose this place to see some ideas for getting started</span></>}
                          <span className="recommendation-distance">{userLocation ? `${location.distanceKm!.toFixed(1)} km away · ` : ''}Tap to see the place and exercise guides</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {exerciseIdeas.length > 0 && (
                    <section className="exercise-ideas" aria-labelledby="exercise-ideas-heading">
                      <div>
                        <p className="eyebrow">A few ideas to get started</p>
                        <h4 id="exercise-ideas-heading">Movements you could try</h4>
                        <p>These links open clear how-to videos or guides. Have a look first, then check that the space and equipment feel right when you arrive.</p>
                      </div>
                      <div className="exercise-cards">
                        {exerciseIdeas.map(({ exercise, location }) => (
                          <article className="exercise-card" key={exercise.id}>
                            <span className="exercise-tag">{movementComfort} comfort</span>
                            <h5>{exercise.name}</h5>
                            <p>{exercise.summary}</p>
                            <p className="exercise-venue">Suggested setting: <button onClick={() => selectLocation(location)} type="button">{location.name}</button></p>
                            <p className="exercise-safety">{exercise.safetyNote}</p>
                            <a href={exercise.instructionUrl} rel="noreferrer" target="_blank">{exercise.instructionLabel} ↗</a>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                  <section className="intensive-panel" aria-labelledby="intensive-heading">
                    <div>
                      <p className="eyebrow">Feeling up for more?</p>
                      <h4 id="intensive-heading">Try a more energetic session</h4>
                      <p>Choose one when you fancy a harder workout. These are for the “energetic” setting, and the space still needs to be open, clear and right for the activity.</p>
                    </div>
                    <div className="intensive-controls">
                      <label>
                        Session style
                        <select onChange={(event) => { setIntensiveSession(event.target.value as IntensiveSession); setShowIntensivePlan(false) }} value={intensiveSession}>
                          <option value="intervals">High-energy intervals</option>
                          <option value="strength-circuit">High-energy bodyweight circuit</option>
                          <option value="court-conditioning">Court or pitch conditioning</option>
                        </select>
                      </label>
                      <button onClick={() => setShowIntensivePlan(true)} type="button">Show intensive session</button>
                    </div>
                    {showIntensivePlan && (
                      <div className="intensive-result" aria-live="polite">
                        {movementComfort !== 'energetic' ? (
                          <p>Switch “Movement comfort today” to <strong>Comfortable with energetic activity</strong> before using a high-energy session. The standard activity ideas remain available for your current setting.</p>
                        ) : !intensiveVenueMatch ? (
                          <p><strong>{selectedLocation.name}</strong> does not have a documented activity match for this session. Select a venue with {selectedIntensiveSession.requiredActivities.join(', ')} before starting.</p>
                        ) : (
                          <>
                            <h5>{selectedIntensiveSession.name} at {selectedLocation.name}</h5>
                            <p>{selectedIntensiveSession.summary}</p>
                            <ol>{selectedIntensiveSession.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                            <a href={selectedIntensiveSession.instructionUrl} rel="noreferrer" target="_blank">{selectedIntensiveSession.instructionLabel} ↗</a>
                          </>
                        )}
                      </div>
                    )}
                  </section>
                </div>
              ) : (
                <p className="no-recommendations">{wellbeingFocus === 'condition' ? 'No condition-specific activity recommendation is shown. The app does not assess symptoms, injuries, treatment or recovery needs.' : 'No suitable place match is available in this pilot for those choices yet. Try another movement-comfort level or browse the map; this does not mean an activity is unsuitable for you.'}</p>
              )}
            </div>
          )}
        </section>

        <section className="movement-library" aria-labelledby="movement-library-heading" hidden={activeView !== 'plan'}>
          <div>
            <p className="eyebrow">Try something new</p>
            <h3 id="movement-library-heading">A few ways to get moving</h3>
            <p>Pick a category for simple ideas and helpful how-to guides. Take what feels useful and leave the rest—always check the space is suitable when you get there.</p>
          </div>
          <label className="movement-filter">
            Exercise category
            <select onChange={(event) => setExerciseCategory(event.target.value as ExerciseCategory)} value={exerciseCategory}>
              {Object.entries(exerciseCategoryLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <div className="movement-library-cards">
            {movementLibrary.map((exercise) => (
              <article className="movement-library-card" key={exercise.id}>
                <h4>{exercise.name}</h4>
                <p>{exercise.summary}</p>
                <p className="movement-safety">{exercise.safetyNote}</p>
                <a href={exercise.instructionUrl} rel="noreferrer" target="_blank">{exercise.instructionLabel} ↗</a>
              </article>
            ))}
          </div>
        </section>

        <section className="community-panel" aria-labelledby="community-heading" hidden={activeView !== 'community'}>
          <div>
            <p className="eyebrow">Move with others</p>
            <h3 id="community-heading">Move with other people</h3>
            <p>Browse a few public-place ideas, then add one to your own plan. This is a private demo: it never contacts anyone or shares your details.</p>
          </div>
          {!adultCommunityAccess ? (
            <p className="community-adult-note">Community coordination is designed as an adult-only feature. A live version for young people would need separate consent, safeguarding and supervision arrangements.</p>
          ) : (
            <>
              <div className="community-safety-note">
                <strong>Private demo.</strong> Nothing here creates a group, shares a location or sends a message.
              </div>
              <details className="community-details">
                <summary>How a live community service would stay safe</summary>
                <ol className="community-demo-path" aria-label="How the community planning journey works">
                  <li>Adult-only community access and clear rules.</li>
                  <li>Public venues, moderation and venue approval.</li>
                  <li>Private drafts until a trusted local operator is ready.</li>
                </ol>
                <p className="community-footnote">For a future live service: meet only in public places, and never share an address, medical information or a live location.</p>
              </details>
              <form className="community-access-form" onSubmit={(event) => { event.preventDefault(); enableCommunityActions() }}>
                <div>
                  <p className="eyebrow">Before you explore</p>
                  <h4>Use the demo safely</h4>
                  <p>No account. Nothing is sent.</p>
                </div>
                <label><input checked={adultDeclaration} onChange={(event) => setAdultDeclaration(event.target.checked)} type="checkbox" /> I confirm this is an 18+ community profile.</label>
                <label><input checked={communityRulesAccepted} onChange={(event) => setCommunityRulesAccepted(event.target.checked)} type="checkbox" /> I will keep personal details and live locations private.</label>
                <button type="submit">Use planning tools</button>
              </form>
              {communityAccessMessage && <p className="community-access-message" role="status">{communityAccessMessage}</p>}
              <div className="community-posts" aria-live="polite">
                {communityPostsWithLocation.map((post) => (
                  <article className="community-post" key={post.id}>
                    <span className={`community-kind ${post.kind}`}>{communityPostLabel[post.kind]}</span>
                    <h4>{post.activity}</h4>
                    <p className="community-location"><button onClick={() => selectLocation(post.location)} type="button">{post.location.name}</button> · {post.timing}</p>
                    <p className="moderation-state">Sample only · no contact</p>
                    <div className="community-post-footer">
                      <span>Plan it for yourself</span>
                      <button disabled={!communityActionsEnabled} onClick={() => addCommunityActivityToPlan(post.id)} type="button">Add to Today</button>
                    </div>
                    <button className="report-action" disabled={flaggedItemIds.includes(post.id)} onClick={() => flagCommunityItem(post.id)} type="button">{flaggedItemIds.includes(post.id) ? 'Flagged in this tab' : 'Flag concern in this tab'}</button>
                  </article>
                ))}
              </div>
              <details className="community-details community-guidance">
                <summary>Guides and trainers — future pilot</summary>
              <section className="guidance-directory" aria-labelledby="guidance-heading">
                <div>
                  <p className="eyebrow">Guides and trainers</p>
                  <h4 id="guidance-heading">Getting a little extra support</h4>
                  <p>Volunteer encouragement and trainer support would need local checks before anyone could be contacted. Neither replaces healthcare advice.</p>
                </div>
                <div className="verification-workflow">
                  <div>
                    <p className="eyebrow">Trainer verification</p>
                    <h5>{trainerVerificationState === 'demo-review' ? 'Local checklist prepared' : 'Before a trainer can go live'}</h5>
                    <p>A city, NGO or venue operator would appoint reviewers. This pilot does not collect documents or verify anyone.</p>
                  </div>
                  <button disabled={!communityActionsEnabled || trainerVerificationState === 'demo-review'} onClick={startTrainerVerificationDemo} type="button">{trainerVerificationState === 'demo-review' ? 'Checklist prepared' : 'Prepare verification checklist'}</button>
                </div>
                <section className="volunteer-application" aria-labelledby="volunteer-application-heading">
                  <div>
                    <p className="eyebrow">Volunteer application</p>
                    <h5 id="volunteer-application-heading">Offer general movement support safely</h5>
                    <p>{volunteerApplicationState === 'draft-review' ? 'Draft review is ready. A real service would need identity, safeguarding, role and venue checks before listing anyone.' : 'Volunteers can offer general encouragement, not healthcare, rehabilitation or individual assessment.'}</p>
                  </div>
                  <label><input checked={volunteerSafetyAcknowledged} onChange={(event) => setVolunteerSafetyAcknowledged(event.target.checked)} type="checkbox" /> I understand this is a safety check, not a liability waiver. I would not give medical advice, collect health details or appear publicly before verification.</label>
                  <button disabled={!communityActionsEnabled || volunteerApplicationState === 'draft-review'} onClick={startVolunteerApplicationDemo} type="button">{volunteerApplicationState === 'draft-review' ? 'Application draft prepared' : 'Prepare application draft'}</button>
                </section>
                <div className="guidance-offers">
                  {guidanceOffersWithLocation.map((offer) => (
                    <article className="guidance-offer" key={offer.id}>
                      <span className={`guidance-role ${offer.role}`}>{guidanceRoleLabel[offer.role]} · not contactable</span>
                      <h5>{offer.title}</h5>
                      <p className="guidance-venue"><button onClick={() => selectLocation(offer.location)} type="button">{offer.location.name}</button> · {offer.availability}</p>
                      <dl className="guidance-details">
                        <div><dt>Focus</dt><dd>{offer.topics}</dd></div>
                        <div><dt>Role boundary</dt><dd>{offer.scope}</dd></div>
                      </dl>
                      <p className="moderation-state">Status: {offer.moderation}</p>
                      <div className="guidance-footer"><span>Review before a future launch</span><button disabled={!communityActionsEnabled} onClick={() => registerGuidanceInterest(offer.id)} type="button">Review safety and place</button></div>
                      <button className="report-action" disabled={flaggedItemIds.includes(offer.id)} onClick={() => flagCommunityItem(offer.id)} type="button">{flaggedItemIds.includes(offer.id) ? 'Flagged in this tab' : 'Flag concern in this tab'}</button>
                    </article>
                  ))}
                </div>
                <form className="guidance-offer-form" onSubmit={(event) => { event.preventDefault(); addGuidanceOffer() }}>
                  <div>
                    <p className="eyebrow">Offer time or expertise</p>
                    <h5>Build a local guidance-listing draft</h5>
                    <p>Uses the selected facility: <strong>{selectedLocation.name}</strong>. It is not published or shown to other people.</p>
                  </div>
                  <label>
                    Role
                    <select onChange={(event) => setGuidanceRole(event.target.value as GuidanceRole)} value={guidanceRole}>
                      <option value="volunteer">Volunteer movement guide</option>
                      <option value="trainer">Personal trainer</option>
                    </select>
                  </label>
                  <label>
                    General focus
                    <select onChange={(event) => setGuidanceFocus(event.target.value)} value={guidanceFocus}>
                      <option value="Warm-up and mobility">Warm-up and mobility</option>
                      <option value="Bodyweight strength basics">Bodyweight strength basics</option>
                      <option value="Outdoor running basics">Outdoor running basics</option>
                      <option value="Court or pitch warm-up">Court or pitch warm-up</option>
                    </select>
                  </label>
                  <button disabled={!communityActionsEnabled} type="submit">Save private listing draft</button>
                </form>
              </section>
              </details>
              <details className="community-details community-request-details">
                <summary>Create a private activity request</summary>
                <form className="community-request" onSubmit={(event) => { event.preventDefault(); createCommunityRequest() }}>
                  <div>
                    <p className="eyebrow">Try a request</p>
                    <h4>Plan a walk, game or session</h4>
                    <p>Uses: <strong>{selectedLocation.name}</strong>.</p>
                  </div>
                  <label>
                    Request type
                    <select onChange={(event) => setCommunityKind(event.target.value as CommunityPostKind)} value={communityKind}>
                      <option value="activity">Find activity companions</option>
                      <option value="team">Request players for a team sport</option>
                      <option value="guidance">Offer volunteer movement guidance</option>
                    </select>
                  </label>
                  <label>
                    Activity
                    <select onChange={(event) => setCommunityActivity(event.target.value)} value={communityActivity}>
                      <option value="Walking">Walking</option>
                      <option value="Running">Running</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Volleyball">Volleyball</option>
                      <option value="Football">Football</option>
                      <option value="Bodyweight strength">Bodyweight strength</option>
                      <option value="Mobility warm-up">Mobility warm-up</option>
                    </select>
                  </label>
                  <button disabled={!communityActionsEnabled} type="submit">Save private draft</button>
                </form>
              </details>
              {(guidanceMessage || communityMessage) && <p className="community-message" role="status">{guidanceMessage || communityMessage}</p>}
            </>
          )}
        </section>

        <section className="wellbeing-panel" aria-labelledby="wellbeing-heading" hidden={activeView !== 'week'}>
          <div>
            <p className="eyebrow">Afterwards</p>
            <h3 id="wellbeing-heading">How did that feel, {activeProfile.name}?</h3>
            <p className="wellbeing-intro">Take a moment to notice how you feel. This is your own reflection—not a health assessment or clinical record.</p>
          </div>
          <section className="weekly-pattern" aria-labelledby="weekly-pattern-heading">
            <div>
              <p className="eyebrow">Your week at a glance</p>
              <h4 id="weekly-pattern-heading">A small picture of what is working</h4>
              <p>{weeklyPattern.reflection}</p>
            </div>
            <dl className="weekly-pattern-stats">
              <div><dt>Movement days</dt><dd>{weeklyPattern.movementDays}</dd></div>
              <div><dt>Check-ins</dt><dd>{weeklyPattern.checkIns}</dd></div>
              <div><dt>Familiar place</dt><dd>{weeklyPattern.familiarPlace ?? 'Still to find'}</dd></div>
            </dl>
            <div className="weekly-next-step">
              <strong>Next small step</strong>
              <p>{weeklyPattern.nextStep}</p>
              <button onClick={() => openView('plan')} type="button">Make a plan for today</button>
            </div>
          </section>
          <form className="checkin-form" onSubmit={(event) => { event.preventDefault(); addCheckIn() }}>
            <label>
              How do you feel after activity?
              <select onChange={(event) => setPostActivityFeeling(event.target.value as PostActivityFeeling)} value={postActivityFeeling}>
                <option value="energised">More energised</option>
                <option value="calmer">Calmer</option>
                <option value="about-the-same">About the same</option>
                <option value="tired">Tired</option>
                <option value="drained">Drained</option>
              </select>
            </label>
            <p className="checkin-location">Activity location: <strong>{selectedLocation.name}</strong></p>
            <label className="note-field">
              Optional private note
              <textarea maxLength={500} onChange={(event) => setCheckInNote(event.target.value)} placeholder="What made this activity easier or harder today?" value={checkInNote} />
            </label>
            <label className="save-choice"><input checked={saveOnDevice} onChange={(event) => updateDeviceSaving(event.target.checked)} type="checkbox" /> Save profiles and diary entries on this device</label>
            <button type="submit">Add today’s check-in</button>
          </form>
          <div className="challenge-card" aria-live="polite">
            <div>
              <p className="eyebrow">A small nudge</p>
              <h4>Three movement days this week</h4>
              <p><strong>{Math.min(activeChallengeDays, 3)} of 3 days logged</strong> in the last seven days. Track a day of movement, not a performance score.</p>
            </div>
            <div className="challenge-progress" aria-label={`${Math.min(activeChallengeDays, 3)} of 3 movement days logged`}><span style={{ width: `${Math.min((activeChallengeDays / 3) * 100, 100)}%` }} /></div>
          </div>
          {checkInMessage && <p className="checkin-message" role="status">{checkInMessage}</p>}
          {activeCheckIns.length > 0 && (
            <div className="checkin-history">
              <div className="history-heading"><h4>Recent reflections</h4><button onClick={clearCheckIns} type="button">Clear check-ins</button></div>
              <ul>{activeCheckIns.slice(0, 3).map((checkIn) => <li key={checkIn.id}><strong>{checkIn.date}</strong> · {checkIn.locationName} · {feelingLabel[checkIn.feeling]}{checkIn.note ? ` — ${checkIn.note}` : ''}</li>)}</ul>
              <button className="summary-button" onClick={() => setShowPrivateSummary(true)} type="button">Prepare a private summary to review</button>
              {showPrivateSummary && <><p className="summary-note">Review this before manually copying or sharing it. Active City does not send it anywhere.</p><textarea aria-label="Private activity reflection summary" className="private-summary" readOnly value={privateSummary} /></>}
              <section className="share-progress" aria-labelledby="share-progress-heading">
                <div>
                  <p className="eyebrow">Optional sharing</p>
                  <h4 id="share-progress-heading">Share selected progress</h4>
                  <p>Choose exactly which reflections to include. A link is read-only and keeps the information in the link itself—there is no Active City account or server copy.</p>
                </div>
                <div className="share-entry-list">
                  {activeCheckIns.slice(0, 10).map((checkIn) => <label key={checkIn.id}><input checked={shareEntryIds.includes(checkIn.id)} onChange={() => toggleShareEntry(checkIn.id)} type="checkbox" /> <strong>{checkIn.date}</strong> · {checkIn.locationName} · {feelingLabel[checkIn.feeling]}</label>)}
                </div>
                <label className="share-notes-choice"><input checked={shareIncludeNotes} onChange={(event) => { setShareIncludeNotes(event.target.checked); setShareLink('') }} type="checkbox" /> Include the optional private notes in the selected entries</label>
                <button className="summary-button" onClick={prepareShareLink} type="button">Create read-only share link</button>
                {shareMessage && <p className="share-message" role="status">{shareMessage}</p>}
                {shareLink && <><textarea aria-label="Read-only progress share link" className="private-summary share-link" readOnly value={shareLink} /><button className="share-copy" onClick={copyShareLink} type="button">Copy share link</button></>}
                <p className="share-warning">Anyone who receives this link can read its selected contents. Do not include notes, locations or reflections you would not want them to see; links may remain in browser history or forwarded messages.</p>
              </section>
            </div>
          )}
          <p className="wellbeing-safety">If you feel in immediate danger or are at risk of harming yourself or someone else, contact local emergency services. For persistent or worrying changes in mood, energy or wellbeing, seek support from a qualified health professional.</p>
        </section>

        <section className="route-panel" aria-labelledby="route-heading" hidden={activeView !== 'plan'}>
          <div>
            <p className="eyebrow">Getting there</p>
            <h3 id="route-heading">Find your way to {selectedLocation.name}</h3>
          </div>
          <label>
            Travel mode
            <select onChange={(event) => { setTravelMode(event.target.value as TravelMode); setRoute(null); setRouteStatus('') }} value={travelMode}>
              <option value="walking">Walking</option>
              <option value="running">Running</option>
              <option value="transit">Public transport</option>
            </select>
          </label>
          {travelMode !== 'transit' && (
            <label>
              Weight for estimate (kg)
              <input min="1" max="350" onChange={(event) => setWeightKg(event.target.value)} type="number" value={weightKg} />
            </label>
          )}
          {travelMode === 'transit' ? (
            publicTransportUrl ? <a className="route-action" href={publicTransportUrl} rel="noreferrer" target="_blank">Plan public transport</a> : <p className="route-help">Enter your location to plan a public-transport journey.</p>
          ) : (
            <button className="route-action" onClick={showPedestrianRoute} type="button">Show {travelMode} route</button>
          )}
          <div className="route-summary" aria-live="polite">
            {routeStatus && <p>{routeStatus}</p>}
            {route && <p><strong>{route.distanceKm.toFixed(1)} km · about {route.minutes} min · about {route.calories} kcal</strong><br />General estimate based on the selected mode and entered weight; it is not medical guidance.</p>}
          </div>
        </section>

        <div className="map-frame" aria-label="Interactive map of Krakow recreation spaces" hidden={activeView !== 'explore'}>
          <MapContainer center={KRAKOW_CENTER} zoom={12} scrollWheelZoom={false} aria-label="Krakow map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
              <CircleMarker center={[userLocation.latitude, userLocation.longitude]} pathOptions={{ color: '#153f78', fillColor: '#4b9ed6', fillOpacity: 1, weight: 3 }} radius={10}>
                <Tooltip direction="top" offset={[0, -8]}>Your starting point</Tooltip>
              </CircleMarker>
            )}
            {route && <Polyline pathOptions={{ color: travelMode === 'running' ? '#db5b36' : '#245f50', weight: 5, opacity: 0.85 }} positions={route.coordinates} />}
            {filteredLocations.map((location) => (
              <CircleMarker
                center={[location.latitude, location.longitude]}
                eventHandlers={{ click: () => selectLocation(location) }}
                key={location.id}
                pathOptions={{
                  color: location.id === selectedLocation.id ? '#183d35' : '#ffffff',
                  fillColor: location.color,
                  fillOpacity: 1,
                  weight: location.id === selectedLocation.id ? 4 : 2,
                }}
                radius={location.id === selectedLocation.id ? 11 : 8}
              >
                <Tooltip direction="top" offset={[0, -8]}>{location.name}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <p className="map-note" hidden={activeView !== 'explore'}>
          Map tiles © OpenStreetMap contributors. Select a marker or use the accessible location list below.
        </p>
      </section>

      <section className="content-grid" aria-label="Location discovery details" hidden={activeView !== 'explore'}>
        <div className="location-list" aria-labelledby="list-heading">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Text alternative</p>
              <h2 id="list-heading">Browse by location</h2>
            </div>
          </div>
          <div className="cards">
            {filteredLocations.map((location) => (
              <button
                aria-pressed={location.id === selectedLocation.id}
                className={`location-card ${location.id === selectedLocation.id ? 'selected' : ''}`}
                key={location.id}
                onClick={() => selectLocation(location)}
                type="button"
              >
                <span className="category-dot" style={{ background: location.color }} />
                <span>
                  <strong>{location.name}</strong>
                  <span className="card-meta">{location.distanceKm === undefined ? '' : `${location.distanceKm.toFixed(1)} km away · `}{location.category}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <article className="profile" id="location-profile" aria-labelledby="profile-heading">
          <p className="eyebrow">Selected facility profile</p>
          <h2 id="profile-heading">{selectedLocation.name}</h2>
          <p className="profile-description">{selectedLocation.description}</p>

          <dl>
            <div><dt>Category</dt><dd>{selectedLocation.category}</dd></div>
            <div><dt>Known activities</dt><dd>{selectedLocation.activities.join(', ')}</dd></div>
            <div><dt>Equipment</dt><dd>{selectedLocation.equipment}</dd></div>
            <div><dt>Access and cost</dt><dd>{selectedLocation.access}</dd></div>
            <div><dt>Accessibility</dt><dd>{selectedLocation.accessibility}</dd></div>
            <div><dt>Verification</dt><dd><span className="status">{labelForStatus(selectedLocation.verificationStatus)}</span></dd></div>
          </dl>

          <p className="source-note">
            <a href={selectedLocation.sourceUrl} rel="noreferrer" target="_blank">
              {selectedLocation.sourceLabel ?? 'View source map'}
            </a>
            {' · '}Last recorded: {selectedLocation.lastReported}
          </p>
        </article>
      </section>

      <section className="place-contribution" aria-labelledby="place-contribution-heading" hidden={activeView !== 'explore'}>
        <details>
          <summary id="place-contribution-heading">Help keep this place up to date</summary>
          <p className="contribution-intro">Tell us what you found at <strong>{selectedLocation.name}</strong>. In this prototype, your report stays in this browser and does not change the public map.</p>
          <form className="place-report-form" onSubmit={(event) => { event.preventDefault(); savePlaceReport() }}>
            <label>
              Equipment today
              <select onChange={(event) => setEquipmentCondition(event.target.value as EquipmentCondition)} value={equipmentCondition}>
                <option value="good">In good shape</option>
                <option value="attention">Some equipment needs attention</option>
                <option value="not-checked">Could not check</option>
                <option value="not-applicable">No equipment at this place</option>
              </select>
            </label>
            <label>
              Place description
              <select onChange={(event) => setDescriptionAccuracy(event.target.value as DescriptionAccuracy)} value={descriptionAccuracy}>
                <option value="accurate">Looks accurate</option>
                <option value="partly-accurate">Partly accurate</option>
                <option value="needs-review">Needs review</option>
                <option value="not-sure">Not sure</option>
              </select>
            </label>
            <label>
              How busy was it?
              <select onChange={(event) => setPlaceBusyness(event.target.value as PlaceBusyness)} value={placeBusyness}>
                <option value="quiet">Quiet</option>
                <option value="some-people">Some people</option>
                <option value="busy">Busy</option>
                <option value="not-sure">Could not tell</option>
              </select>
            </label>
            <label>
              Visitor mix (broad terms only)
              <select onChange={(event) => setVisitorMix(event.target.value as VisitorMix)} value={visitorMix}>
                <option value="mostly-adults">Mostly adults</option>
                <option value="families-mixed">Families and mixed ages</option>
                <option value="mostly-young-people">Mostly young people</option>
                <option value="mixed-not-sure">Mixed or not sure</option>
              </select>
            </label>
            <label className="place-report-note">
              Optional note
              <textarea maxLength={280} onChange={(event) => setPlaceReportNote(event.target.value)} placeholder="For example: two exercise stations were unavailable. Do not add names, photos or personal details." value={placeReportNote} />
            </label>
            <button type="submit">Save private report</button>
          </form>
          {placeReportMessage && <p className="contribution-message" role="status">{placeReportMessage}</p>}
          {placeReports.some((report) => report.locationId === selectedLocation.id) && <p className="private-report-count">{placeReports.filter((report) => report.locationId === selectedLocation.id).length} private report{placeReports.filter((report) => report.locationId === selectedLocation.id).length === 1 ? '' : 's'} saved for this place in this browser tab.</p>}

          <details className="map-suggestion">
            <summary>Suggest a missing public place</summary>
            <p className="contribution-intro">A real service would use trained reviewers to check identity, public access, evidence and the proposed description. This prototype does not collect documents or add a marker automatically.</p>
            <label className="contributor-check"><input checked={contributorAcknowledged} onChange={(event) => setContributorAcknowledged(event.target.checked)} type="checkbox" /> I am 18+ and will suggest only a public outdoor place. I will not include a private address or personal details.</label>
            <button onClick={prepareContributorReview} type="button">Prepare contributor review</button>
            {contributorReviewReady && (
              <form className="suggestion-form" onSubmit={(event) => { event.preventDefault(); saveMapSuggestion() }}>
                <label>
                  Place name
                  <input onChange={(event) => setSuggestionName(event.target.value)} required value={suggestionName} />
                </label>
                <label>
                  Public park or nearest street
                  <input onChange={(event) => setSuggestionArea(event.target.value)} placeholder="Park name or nearest public street" required value={suggestionArea} />
                </label>
                <label>
                  Type of place
                  <select onChange={(event) => setSuggestionCategory(event.target.value as RecreationLocation['category'])} value={suggestionCategory}>
                    <option value="Outdoor gym and sports complex">Outdoor gym or sports area</option>
                    <option value="Outdoor team-sport facility">Outdoor court or pitch</option>
                    <option value="Park and open space">Park or open space</option>
                    <option value="Waterfront recreation">Waterfront recreation</option>
                    <option value="Urban green corridor">Green corridor</option>
                  </select>
                </label>
                <label>
                  Public source or map link
                  <input onChange={(event) => setSuggestionSourceUrl(event.target.value)} placeholder="https://" required type="url" value={suggestionSourceUrl} />
                </label>
                <button type="submit">Save map suggestion</button>
              </form>
            )}
            {contributorMessage && <p className="contribution-message" role="status">{contributorMessage}</p>}
            {mapSuggestions.length > 0 && <p className="private-report-count">{mapSuggestions.length} private map suggestion{mapSuggestions.length === 1 ? '' : 's'} saved in this browser tab.</p>}
          </details>
        </details>
      </section>

      <aside className="safety-note" hidden={activeView === 'week' || activeView === 'community'}>
        <strong>Good to know:</strong> location records are a starting point, not a guarantee of access, condition,
        or suitability. Check local signs and conditions before starting an activity. If you have a health concern,
        injury, symptoms, or need individual exercise advice, speak with a qualified health professional.
      </aside>
    </main>
  )
}

export default App

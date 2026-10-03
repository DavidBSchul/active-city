import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet'
import { locations, type RecreationLocation } from './data/locations'
import './App.css'

const KRAKOW_CENTER: [number, number] = [50.0614, 19.9366]
const pilotCity = {
  id: 'krakow',
  name: 'Krakow',
  heroImage: '/active-city-hero.png',
  heroAlt: 'Illustration of adults walking, cycling and using outdoor fitness equipment beside the Vistula in Krakow',
}
type Coordinates = { latitude: number; longitude: number }
type TravelMode = 'walking' | 'running' | 'transit'
type RouteData = { coordinates: [number, number][]; distanceKm: number; minutes: number; calories: number }
type RoutingResponse = { routes?: Array<{ distance: number; geometry: { coordinates: [number, number][] } }> }
type AgeRange = '0-4' | '5-8' | '9-12' | '13-15' | '16-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65-74' | '75-plus'
type MovementComfort = 'gentle' | 'steady' | 'energetic'
type ActivityGoal = 'everyday' | 'endurance' | 'strength' | 'team' | 'waterfront'
type WellbeingFocus = 'general' | 'mood' | 'heart' | 'mobility' | 'strength-bone' | 'condition'
type PostActivityFeeling = 'energised' | 'calmer' | 'about-the-same' | 'tired' | 'drained'
type WellbeingCheckIn = { id: string; date: string; locationName: string; feeling: PostActivityFeeling; note: string }
type IntensiveSession = 'intervals' | 'strength-circuit' | 'court-conditioning'
type ExerciseCategory = 'all' | 'walk-run' | 'strength' | 'mobility-balance' | 'team'
type CommunityPostKind = 'activity' | 'team' | 'guidance'
type ModerationState = 'Sample only — not live' | 'Draft — not submitted'
type CommunityPost = { id: string; kind: CommunityPostKind; activity: string; locationId: string; timing: string; capacity: number; interested: number; note: string; moderation: ModerationState }
type GuidanceRole = 'volunteer' | 'trainer'
type GuidanceOffer = { id: string; role: GuidanceRole; title: string; locationId: string; availability: string; topics: string; scope: string; enquiries: number; moderation: ModerationState }

const WELLBEING_STORAGE_KEY = 'active-city-wellbeing-checkins-v1'
const WELLBEING_CONSENT_KEY = 'active-city-wellbeing-save-on-device-v1'

const communityPostLabel: Record<CommunityPostKind, string> = {
  activity: 'Move together',
  team: 'Need players',
  guidance: 'Volunteer guidance offer',
}

const communitySeedPosts: CommunityPost[] = [
  { id: 'walk-bagry', kind: 'activity', activity: 'Easy waterfront walk', locationId: 'bagry', timing: 'A planned daytime session', capacity: 6, interested: 2, note: 'A low-pressure walk around the designated public paths.', moderation: 'Sample only — not live' },
  { id: 'basketball-olszanica', kind: 'team', activity: 'Basketball — need two more players', locationId: 'olszanica-outdoor-gym', timing: 'A planned evening session', capacity: 6, interested: 4, note: 'Bring a ball if you can; check court availability before travel.', moderation: 'Sample only — not live' },
  { id: 'mobility-klinowka', kind: 'guidance', activity: 'Outdoor mobility and warm-up basics', locationId: 'klinowka-parkour', timing: 'A planned weekend session', capacity: 8, interested: 3, note: 'Example volunteer listing. Any live service would verify the organiser and clearly state qualifications.', moderation: 'Sample only — not live' },
]

const guidanceRoleLabel: Record<GuidanceRole, string> = {
  volunteer: 'Volunteer movement guide',
  trainer: 'Personal trainer',
}

const guidanceSeedOffers: GuidanceOffer[] = [
  { id: 'volunteer-warmup', role: 'volunteer', title: 'General warm-up and outdoor movement buddy', locationId: 'parkowa-street-workout', availability: 'Planned weekend daytime session', topics: 'Warm-up basics, gentle mobility, using public equipment with care', scope: 'Unverified demo role. General movement support only—not healthcare, rehabilitation or individual fitness assessment.', enquiries: 2, moderation: 'Sample only — not live' },
  { id: 'trainer-bodyweight', role: 'trainer', title: 'Bodyweight technique introduction', locationId: 'olszanica-outdoor-gym', availability: 'Planned weekday evening session', topics: 'Squat, supported press-up, pull-up progression and session warm-up', scope: 'Unverified demo trainer listing. A live service must verify identity, qualifications, insurance and scope before publication.', enquiries: 1, moderation: 'Sample only — not live' },
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

function parseCoordinates(value: string): Coordinates | null {
  const parts = value.trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) return null
  const [latitude, longitude] = parts
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}

function calorieEstimate(mode: Exclude<TravelMode, 'transit'>, minutes: number, weightKg: number) {
  const met = mode === 'walking' ? 3.5 : 9.8
  return Math.round((met * 3.5 * weightKg * minutes) / 200)
}

function App() {
  const [selectedId, setSelectedId] = useState(locations[0].id)
  const [locationInput, setLocationInput] = useState('')
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [locationError, setLocationError] = useState('')
  const [travelMode, setTravelMode] = useState<TravelMode>('walking')
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
  const [intensiveSession, setIntensiveSession] = useState<IntensiveSession>('intervals')
  const [showIntensivePlan, setShowIntensivePlan] = useState(false)
  const [exerciseCategory, setExerciseCategory] = useState<ExerciseCategory>('all')
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
  const selectedLocation = locations.find((location) => location.id === selectedId) ?? locations[0]
  const visibleLocations = useMemo(() => {
    const withDistance = locations.map((location) => ({
      ...location,
      distanceKm: userLocation ? distanceInKm(userLocation, location) : undefined,
    }))
    return userLocation ? withDistance.sort((first, second) => first.distanceKm! - second.distanceKm!) : withDistance
  }, [userLocation])
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
      return [{ location, matchingActivity }]
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
    location: locations.find((location) => location.id === post.locationId) ?? locations[0],
  })), [communityPosts])
  const guidanceOffersWithLocation = useMemo(() => guidanceOffers.map((offer) => ({
    ...offer,
    location: locations.find((location) => location.id === offer.locationId) ?? locations[0],
  })), [guidanceOffers])
  const activeChallengeDays = useMemo(() => {
    const today = new Date(`${todayInKrakow()}T00:00:00`)
    const activeDays = new Set<string>()
    checkIns.forEach((checkIn) => {
      const loggedDay = new Date(`${checkIn.date}T00:00:00`)
      const difference = Math.round((today.getTime() - loggedDay.getTime()) / 86_400_000)
      if (difference >= 0 && difference < 7) activeDays.add(checkIn.date)
    })
    return activeDays.size
  }, [checkIns])
  const privateSummary = useMemo(() => {
    const lines = checkIns.slice(0, 14).map((checkIn) => `${checkIn.date} | ${checkIn.locationName} | ${feelingLabel[checkIn.feeling]}${checkIn.note ? ` | Note: ${checkIn.note}` : ''}`)
    return ['Active City private activity reflection', 'Generated locally for the user to review before sharing.', 'This is a personal reflection, not a clinical record.', '', ...lines].join('\n')
  }, [checkIns])
  const selectedIntensiveSession = intensiveSessions[intensiveSession]
  const intensiveVenueMatch = selectedIntensiveSession.requiredActivities.some((activity) => selectedLocation.activities.includes(activity))

  useEffect(() => {
    try {
      if (window.localStorage.getItem(WELLBEING_CONSENT_KEY) === 'yes') {
        const saved = window.localStorage.getItem(WELLBEING_STORAGE_KEY)
        const parsed = saved ? JSON.parse(saved) : []
        if (Array.isArray(parsed)) setCheckIns(parsed.filter((entry): entry is WellbeingCheckIn => typeof entry?.id === 'string' && typeof entry?.date === 'string' && typeof entry?.locationName === 'string' && typeof entry?.feeling === 'string' && typeof entry?.note === 'string'))
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
    } catch {
      setCheckInMessage('Your check-in is available in this browser tab, but this device could not save it for later.')
    }
  }, [checkIns, saveOnDevice, storageReady])

  const selectLocation = (location: RecreationLocation) => {
    setSelectedId(location.id)
    setRoute(null)
    setRouteStatus('')
    document.getElementById('location-profile')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const updateLocation = () => {
    if (!locationInput.trim()) {
      setUserLocation(null)
      setLocationError('')
      return
    }
    const coordinates = parseCoordinates(locationInput)
    if (!coordinates) {
      setLocationError('Enter latitude and longitude, for example: 50.0614, 19.9366.')
      return
    }
    setUserLocation(coordinates)
    setLocationError('')
    setRoute(null)
    setRouteStatus('')
  }

  const showPedestrianRoute = async () => {
    if (!userLocation) {
      setRouteStatus('Enter your location before requesting a route.')
      return
    }
    const numericWeight = Number(weightKg)
    if (!Number.isFinite(numericWeight) || numericWeight <= 0 || numericWeight > 350) {
      setRouteStatus('Enter a weight between 1 and 350 kg to calculate a general calorie estimate.')
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
      setRouteStatus('The pedestrian routing service is unavailable. Try again shortly or use the public-transport handoff.')
    }
  }

  const addCheckIn = () => {
    const entry: WellbeingCheckIn = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
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
      } catch {
        setCheckInMessage('Saving is off for future check-ins. This browser could not clear its previous saved copy.')
      }
    }
  }

  const clearCheckIns = () => {
    setCheckIns([])
    setShowPrivateSummary(false)
    setCheckInMessage('Your check-ins have been cleared from this browser tab and, if enabled, this device.')
    try {
      window.localStorage.removeItem(WELLBEING_STORAGE_KEY)
    } catch {
      // The browser tab has still been cleared.
    }
  }

  const registerCommunityInterest = (postId: string) => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Complete the local safety setup before saving demo interest.')
      return
    }
    setCommunityPosts((current) => current.map((post) => post.id === postId && post.interested < post.capacity
      ? { ...post, interested: post.interested + 1 }
      : post))
    setCommunityMessage('Interest saved in this browser demo only. No contact details, location, or health information were shared.')
  }

  const createCommunityRequest = () => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Complete the local safety setup before creating a demo request.')
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
      moderation: 'Draft — not submitted',
      note: communityKind === 'guidance'
        ? 'Demo guidance offer. A live service must verify credentials, role boundaries and safeguarding before publishing.'
        : 'Demo request. Confirm venue availability and agree details through a moderated service before meeting.',
    }, ...current])
    setCommunityMessage('Your request has been added to this browser-only demo. It is not visible to other people and does not send an invitation.')
  }

  const registerGuidanceInterest = (offerId: string) => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Complete the local safety setup before requesting demo details.')
      return
    }
    setGuidanceOffers((current) => current.map((offer) => offer.id === offerId ? { ...offer, enquiries: offer.enquiries + 1 } : offer))
    setGuidanceMessage('Interest saved in this browser demo only. No profile, contact information or health details were sent.')
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
        ? 'Demo trainer offer. A live listing requires identity, qualification, insurance and scope verification before it can receive enquiries.'
        : 'Demo volunteer offer. General activity encouragement only—not healthcare, rehabilitation or individual fitness assessment.',
      enquiries: 0,
      moderation: 'Draft — not submitted',
    }, ...current])
    setGuidanceMessage('Your guidance offer was added to this browser-only demo. It has not been published or shared with anyone.')
  }

  const enableCommunityActions = () => {
    if (!adultCommunityAccess) {
      setCommunityAccessMessage('This prototype does not enable community actions for under-18 profiles.')
      return
    }
    if (!adultDeclaration || !communityRulesAccepted) {
      setCommunityAccessMessage('Confirm both safety statements before enabling local demo actions.')
      return
    }
    setCommunityAccessReady(true)
    setCommunityAccessMessage('Local demo actions are enabled for this browser tab. Nothing is published, sent, or saved after you close it.')
  }

  const flagCommunityItem = (itemId: string) => {
    setFlaggedItemIds((current) => current.includes(itemId) ? current : [...current, itemId])
    setCommunityAccessMessage('This item is flagged in your local demo only. A real service would send it to trained moderators and provide follow-up options.')
  }

  const startTrainerVerificationDemo = () => {
    if (!communityActionsEnabled) {
      setCommunityAccessMessage('Complete the local safety setup before starting a verification demo.')
      return
    }
    setTrainerVerificationState('demo-review')
    setGuidanceMessage('Verification workflow marked “demo review”. No documents, identity details or credentials were uploaded or collected.')
  }

  const publicTransportUrl = userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedLocation.latitude},${selectedLocation.longitude}&travelmode=transit`
    : undefined

  return (
    <main className={`city-theme city-theme--${pilotCity.id}`}>
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Krakow pilot · Milestone 1</p>
          <h1>Active City</h1>
          <p className="tagline">Your city. Your space. Your workout.</p>
          <p className="intro">
            Start with a place you can use today. Browse public recreation spaces, inspect what is known about
            them, and keep unknown details visible instead of guessing.
          </p>
          <p className="hero-strapline">Move · Meet · Explore</p>
        </div>
        <figure className="hero-art">
          <img alt={pilotCity.heroAlt} src={pilotCity.heroImage} />
        </figure>
      </header>

      <section aria-labelledby="map-heading" className="discovery">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explore</p>
            <h2 id="map-heading">Krakow recreation spaces</h2>
          </div>
          <p className="location-count">{locations.length} pilot locations</p>
        </div>

        <form className="distance-form" onSubmit={(event) => { event.preventDefault(); updateLocation() }}>
          <div>
            <label htmlFor="location-input">Sort places by your location</label>
            <input
              aria-describedby="location-help location-error"
              id="location-input"
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Latitude, longitude — e.g. 50.0614, 19.9366"
              type="text"
              value={locationInput}
            />
          </div>
          <button type="submit">Sort by distance</button>
          <p id="location-help">Used only in this browser tab. Distances are straight-line estimates.</p>
          {locationError && <p className="location-error" id="location-error" role="alert">{locationError}</p>}
          {userLocation && <p className="location-sorted">Showing nearest places first from {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}.</p>}
        </form>
        <p className="coverage-note">A source-backed selection of outdoor gyms, courts, pitches and waterfront activities is shown. This is a growing citywide pilot, not yet a complete municipal inventory.</p>

        <section className="preference-panel" aria-labelledby="preference-heading">
          <div>
            <p className="eyebrow">Personalised discovery</p>
            <h3 id="preference-heading">Find an activity idea</h3>
            <p className="preference-intro">Choose broad preferences, not medical details. They stay only in this browser tab and are used to match known activities at the mapped places.</p>
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
                    {recommendations.map(({ location, matchingActivity }) => (
                      <button className="recommendation-card" key={location.id} onClick={() => selectLocation(location)} type="button">
                        <span className="category-dot" style={{ background: location.color }} />
                        <span><strong>{matchingActivity} at {location.name}</strong><span>{userLocation ? `${location.distanceKm!.toFixed(1)} km away · ` : ''}{location.verificationStatus === 'documented' ? 'Public source documented' : 'Check details before use'}</span></span>
                      </button>
                    ))}
                  </div>
                  {exerciseIdeas.length > 0 && (
                    <section className="exercise-ideas" aria-labelledby="exercise-ideas-heading">
                      <div>
                        <p className="eyebrow">Instructional ideas</p>
                        <h4 id="exercise-ideas-heading">Specific movements to explore</h4>
                        <p>Links open trusted instructional videos or illustrated guides. The mapped venue is a suggested setting, not a guarantee that equipment is available or safe.</p>
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
                      <p className="eyebrow">More intensity</p>
                      <h4 id="intensive-heading">Build a high-energy session</h4>
                      <p>Choose an intensive style when you want a harder session. The plan opens only for the “energetic” comfort setting and still depends on the venue being available and safe.</p>
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

        <section className="movement-library" aria-labelledby="movement-library-heading">
          <div>
            <p className="eyebrow">Build your activity menu</p>
            <h3 id="movement-library-heading">Explore targeted movement ideas</h3>
            <p>Choose a category to see specific, source-linked ideas. These are general learning resources—not a diagnosis, prescription or guarantee that a venue is suitable.</p>
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

        <section className="community-panel" aria-labelledby="community-heading">
          <div>
            <p className="eyebrow">Community layer — prototype</p>
            <h3 id="community-heading">Plan an activity together</h3>
            <p>Group activity can be motivating, but the app does not broadcast your live location. This board uses planned sessions at public facilities, never health details or direct contact information.</p>
          </div>
          {!adultCommunityAccess ? (
            <p className="community-adult-note">Community coordination is designed as an adult-only feature. A live version for young people would need separate consent, safeguarding and supervision arrangements.</p>
          ) : (
            <>
              <div className="community-safety-note">
                <strong>Prototype boundaries:</strong> examples and new requests exist only in this browser tab. A real service would need account protection, moderation and reporting, venue rules, and verified coach/trainer roles before it could connect people.
              </div>
              <form className="community-access-form" onSubmit={(event) => { event.preventDefault(); enableCommunityActions() }}>
                <div>
                  <p className="eyebrow">Safety setup</p>
                  <h4>Enable local community-demo actions</h4>
                  <p>This does not create an account or share data. It makes the prototype’s buttons available in this tab only.</p>
                </div>
                <label><input checked={adultDeclaration} onChange={(event) => setAdultDeclaration(event.target.checked)} type="checkbox" /> I confirm this is an 18+ community profile.</label>
                <label><input checked={communityRulesAccepted} onChange={(event) => setCommunityRulesAccepted(event.target.checked)} type="checkbox" /> I will not share health details, a home address, a live location, or arrange unsafe meetings.</label>
                <button type="submit">Enable local demo actions</button>
              </form>
              {communityAccessMessage && <p className="community-access-message" role="status">{communityAccessMessage}</p>}
              <div className="community-posts" aria-live="polite">
                {communityPostsWithLocation.map((post) => (
                  <article className="community-post" key={post.id}>
                    <span className={`community-kind ${post.kind}`}>{communityPostLabel[post.kind]}</span>
                    <h4>{post.activity}</h4>
                    <p className="community-location"><button onClick={() => selectLocation(post.location)} type="button">{post.location.name}</button> · {post.timing}</p>
                    <p>{post.note}</p>
                    <p className="moderation-state">Moderation: {post.moderation}</p>
                    <div className="community-post-footer">
                      <span>{post.interested} of {post.capacity} places interested</span>
                      <button disabled={!communityActionsEnabled || post.interested >= post.capacity} onClick={() => registerCommunityInterest(post.id)} type="button">{post.interested >= post.capacity ? 'Interest list full' : 'Request to connect — demo'}</button>
                    </div>
                    <button className="report-action" disabled={flaggedItemIds.includes(post.id)} onClick={() => flagCommunityItem(post.id)} type="button">{flaggedItemIds.includes(post.id) ? 'Flagged locally' : 'Report concern — demo'}</button>
                  </article>
                ))}
              </div>
              <section className="guidance-directory" aria-labelledby="guidance-heading">
                <div>
                  <p className="eyebrow">Guidance directory — prototype</p>
                  <h4 id="guidance-heading">Meet a guide or trainer at a public facility</h4>
                  <p>Volunteer guides can offer general encouragement. Personal trainers must show verified credentials and clear scope before a live listing can take enquiries. Neither role replaces healthcare advice.</p>
                </div>
                <div className="verification-workflow">
                  <div>
                    <p className="eyebrow">Trainer verification — prototype</p>
                    <h5>{trainerVerificationState === 'demo-review' ? 'Demo review started' : 'Before a trainer can go live'}</h5>
                    <p>Real review would check identity, appropriate qualification, insurance where relevant, role boundaries, safeguarding and a moderation agreement. This prototype never asks for or stores those documents.</p>
                  </div>
                  <button disabled={!communityActionsEnabled || trainerVerificationState === 'demo-review'} onClick={startTrainerVerificationDemo} type="button">{trainerVerificationState === 'demo-review' ? 'Demo review pending' : 'Start verification demo'}</button>
                </div>
                <div className="guidance-offers">
                  {guidanceOffersWithLocation.map((offer) => (
                    <article className="guidance-offer" key={offer.id}>
                      <span className={`guidance-role ${offer.role}`}>{guidanceRoleLabel[offer.role]} · unverified demo</span>
                      <h5>{offer.title}</h5>
                      <p className="guidance-venue"><button onClick={() => selectLocation(offer.location)} type="button">{offer.location.name}</button> · {offer.availability}</p>
                      <dl className="guidance-details">
                        <div><dt>Focus</dt><dd>{offer.topics}</dd></div>
                        <div><dt>Role boundary</dt><dd>{offer.scope}</dd></div>
                      </dl>
                      <p className="moderation-state">Moderation: {offer.moderation}</p>
                      <div className="guidance-footer"><span>{offer.enquiries} demo enquiries</span><button disabled={!communityActionsEnabled} onClick={() => registerGuidanceInterest(offer.id)} type="button">Request details — demo</button></div>
                      <button className="report-action" disabled={flaggedItemIds.includes(offer.id)} onClick={() => flagCommunityItem(offer.id)} type="button">{flaggedItemIds.includes(offer.id) ? 'Flagged locally' : 'Report concern — demo'}</button>
                    </article>
                  ))}
                </div>
                <form className="guidance-offer-form" onSubmit={(event) => { event.preventDefault(); addGuidanceOffer() }}>
                  <div>
                    <p className="eyebrow">Offer time or expertise</p>
                    <h5>Build a sample guidance listing</h5>
                    <p>Uses the selected facility: <strong>{selectedLocation.name}</strong>. This is not published.</p>
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
                  <button disabled={!communityActionsEnabled} type="submit">Add sample listing</button>
                </form>
              </section>
              <form className="community-request" onSubmit={(event) => { event.preventDefault(); createCommunityRequest() }}>
                <div>
                  <p className="eyebrow">Try a request</p>
                  <h4>Create a browser-only activity request</h4>
                  <p>It uses the currently selected location: <strong>{selectedLocation.name}</strong>.</p>
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
                <button disabled={!communityActionsEnabled} type="submit">Add request to demo</button>
              </form>
              {(guidanceMessage || communityMessage) && <p className="community-message" role="status">{guidanceMessage || communityMessage}</p>}
              <p className="community-footnote">Do not arrange a first meeting in a secluded place or share an address, medical information, personal number, or live location. Check the facility’s access rules before travelling.</p>
            </>
          )}
        </section>

        <section className="wellbeing-panel" aria-labelledby="wellbeing-heading">
          <div>
            <p className="eyebrow">After your activity</p>
            <h3 id="wellbeing-heading">Private wellbeing check-in</h3>
            <p className="wellbeing-intro">Capture how you feel after an activity. This is a personal reflection, not a mental-health assessment or clinical record.</p>
          </div>
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
            <label className="save-choice"><input checked={saveOnDevice} onChange={(event) => updateDeviceSaving(event.target.checked)} type="checkbox" /> Save these entries on this device</label>
            <button type="submit">Add today’s check-in</button>
          </form>
          <div className="challenge-card" aria-live="polite">
            <div>
              <p className="eyebrow">Optional challenge</p>
              <h4>Three movement days this week</h4>
              <p><strong>{Math.min(activeChallengeDays, 3)} of 3 days logged</strong> in the last seven days. Track a day of movement, not a performance score.</p>
            </div>
            <div className="challenge-progress" aria-label={`${Math.min(activeChallengeDays, 3)} of 3 movement days logged`}><span style={{ width: `${Math.min((activeChallengeDays / 3) * 100, 100)}%` }} /></div>
          </div>
          {checkInMessage && <p className="checkin-message" role="status">{checkInMessage}</p>}
          {checkIns.length > 0 && (
            <div className="checkin-history">
              <div className="history-heading"><h4>Recent reflections</h4><button onClick={clearCheckIns} type="button">Clear check-ins</button></div>
              <ul>{checkIns.slice(0, 3).map((checkIn) => <li key={checkIn.id}><strong>{checkIn.date}</strong> · {checkIn.locationName} · {feelingLabel[checkIn.feeling]}{checkIn.note ? ` — ${checkIn.note}` : ''}</li>)}</ul>
              <button className="summary-button" onClick={() => setShowPrivateSummary(true)} type="button">Prepare a private summary to review</button>
              {showPrivateSummary && <><p className="summary-note">Review this before manually copying or sharing it. Active City does not send it anywhere.</p><textarea aria-label="Private activity reflection summary" className="private-summary" readOnly value={privateSummary} /></>}
            </div>
          )}
          <p className="wellbeing-safety">If you feel in immediate danger or are at risk of harming yourself or someone else, contact local emergency services. For persistent or worrying changes in mood, energy or wellbeing, seek support from a qualified health professional.</p>
        </section>

        <section className="route-panel" aria-labelledby="route-heading">
          <div>
            <p className="eyebrow">Travel layer</p>
            <h3 id="route-heading">Route to {selectedLocation.name}</h3>
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

        <div className="map-frame" aria-label="Interactive map of Krakow recreation spaces">
          <MapContainer center={KRAKOW_CENTER} zoom={12} scrollWheelZoom={false} aria-label="Krakow map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
              <CircleMarker center={[userLocation.latitude, userLocation.longitude]} pathOptions={{ color: '#153f78', fillColor: '#4b9ed6', fillOpacity: 1, weight: 3 }} radius={10}>
                <Tooltip direction="top" offset={[0, -8]}>Your entered location</Tooltip>
              </CircleMarker>
            )}
            {route && <Polyline pathOptions={{ color: travelMode === 'running' ? '#db5b36' : '#245f50', weight: 5, opacity: 0.85 }} positions={route.coordinates} />}
            {visibleLocations.map((location) => (
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
        <p className="map-note">
          Map tiles © OpenStreetMap contributors. Select a marker or use the accessible location list below.
        </p>
      </section>

      <section className="content-grid" aria-label="Location discovery details">
        <div className="location-list" aria-labelledby="list-heading">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Text alternative</p>
              <h2 id="list-heading">Browse by location</h2>
            </div>
          </div>
          <div className="cards">
            {visibleLocations.map((location) => (
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

      <aside className="safety-note">
        <strong>Good to know:</strong> location records are a starting point, not a guarantee of access, condition,
        or suitability. Check local signs and conditions before starting an activity. If you have a health concern,
        injury, symptoms, or need individual exercise advice, speak with a qualified health professional.
      </aside>
    </main>
  )
}

export default App

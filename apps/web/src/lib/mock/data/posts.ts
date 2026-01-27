import type { Post, EventPostWithDetails } from '@event-monitor/shared';
import { generateId, generateISODate, randomInt, randomFloat, pickRandom } from './generators';

// Realistic post content templates for different event types
const POST_TEMPLATES: Record<string, string[]> = {
  // Conflict - military operations, attacks, active fighting
  conflict: [
    'BREAKING: Heavy fighting reported in {location}. Multiple casualties feared. Residents urged to seek shelter.',
    'Update from {location}: Situation deteriorating. Fighting intensifies near city center.',
    'Eyewitness reports of explosions in {location} overnight. Emergency services responding.',
    'Situation in {location} remains critical. Local sources report ongoing clashes.',
    'Air raid sirens sounding in {location}. Residents taking cover.',
    // Venezuela intervention
    'BREAKING: Loud explosions heard across {location}. Military operation reportedly underway. Residents urged to stay indoors.',
    'Eyewitness in {location}: "The sky lit up around 2am. We could hear jets overhead." People are terrified.',
    'Reports of forces on the ground in {location}. Infrastructure strikes targeting government facilities.',
    'Air defense systems in {location} reportedly neutralized. Operation appears to be targeting key compound.',
    'Video circulating showing explosions in {location}. Cannot independently verify.',
    // Ukraine attacks
    'BREAKING: Massive attack on {location}. Air raid alerts across the region. Take shelter immediately.',
    'Reports of 375+ drones and 21 missiles launched overnight. {location} among targets.',
    'Explosions heard in {location}. Air defense systems active. Stay away from windows.',
    'Update from {location}: Multiple hits reported. Emergency services responding. Casualties feared.',
    'Power outages spreading across {location} following overnight strikes.',
  ],
  // Military - troop movements, strategic developments
  military: [
    'Forces advancing toward {location}. Situation critical.',
    'Heavy fighting reported near {location}. Defensive positions holding.',
    'Satellite imagery shows troop buildup near {location}. Analysts warn of potential offensive.',
    'Air defense active over {location}. Multiple drones intercepted but some got through.',
    'Drone wreckage recovered in {location}. Foreign-made UAV confirmed.',
    'Front line updates: Forces claim gains near {location}. Military contesting reports.',
  ],
  // Humanitarian - civilian impact, aid, medical
  humanitarian: [
    'URGENT: Humanitarian crisis deepens in {location}. Critical shortages of food and medicine reported.',
    'Thousands displaced from {location}. Emergency shelters reaching capacity.',
    'Power and water cut off in {location}. Civilians suffering in difficult conditions.',
    'Medical facilities in {location} overwhelmed. International assistance urgently needed.',
    'Aid distribution point established in {location}. Long queues as supplies run low.',
    // Ukraine humanitarian
    'Hospital in {location} hit by strike. At least 30 wounded including children.',
    'Dormitory housing displaced persons struck in {location}. Rescue operations ongoing.',
    'Medical facilities in {location} overwhelmed after attacks. Blood donations urgently needed.',
    'Water infrastructure damaged in {location}. Residents advised to store water.',
    'Heating systems failing across {location} as temperatures drop below freezing. Crisis worsening.',
  ],
  // Political - government actions, diplomatic developments
  political: [
    'Political crisis unfolds in {location}. Government response awaited.',
    'Opposition leaders call for calm in {location}. International community monitoring.',
    'Emergency session called in {location}. Constitutional questions raised.',
    'Government announces measures in {location}. Public reaction mixed.',
    'Political tensions in {location} as factions debate path forward.',
    // Venezuela political
    'Leader reportedly in custody. Operation in {location} appears successful. Awaiting official confirmation.',
    'Supreme Court has appointed interim president following events in {location}.',
    'Political prisoners being released from detention in {location}. Families gathering outside facilities.',
    'Opposition figures emerging in {location} after years in hiding. Uncertain political future ahead.',
    // Ukraine diplomatic
    'Leaders sign agreement on potential peacekeeping forces. {location} could see deployment.',
    'Coalition declares need for "robust security guarantees." Negotiations ongoing.',
    'Diplomatic pressure mounting for ceasefire. {location} residents skeptical after years of broken promises.',
  ],
  // Protest - demonstrations, civil unrest
  protest: [
    'Celebrations erupting in {location}! Flags waving, people chanting in the streets.',
    'Thousands pouring into the streets of {location}. Both pro and anti-government demonstrations ongoing.',
    'Supporters gathering in {location} with portraits and party banners. Tensions high.',
    'Clashes between rival groups in {location}. Security forces attempting to maintain order.',
    'Peaceful vigil in {location} for those lost during years of crisis. Emotional scenes.',
    'Citizens abroad celebrating in major cities. In {location}, mood more uncertain.',
  ],
  // Other - general/unclassified
  other: [
    'Developing situation in {location}. Details emerging. Following closely.',
    'Multiple sources reporting from {location}. Awaiting confirmation.',
    'Breaking news from {location}. Updates to follow.',
    'Monitoring situation in {location}. More information expected soon.',
    'Situation in {location} evolving. Stay tuned for updates.',
  ],
};

// OSINT-style usernames relevant to Venezuela and Ukraine coverage
const USERNAMES = [
  'WarMonitor',
  'OSINTdefender',
  'IntelCrab',
  'sentdefender',
  'UkraineWarReport',
  'KyivIndependent',
  'UkrWarUpdates',
  'LatAmNewsAlert',
  'CaracasChronicle',
  'VenezuelaNews24',
  'ReporteConfidencial',
  'AlJazeera',
  'BBCWorld',
  'AFP',
  'Reuters',
  'CNN_Intl',
  'MilitaryLand',
  'DefMon3',
];

// Placeholder images using picsum.photos with consistent seeds
const PLACEHOLDER_IMAGES = [
  'https://picsum.photos/seed/conflict1/800/600',
  'https://picsum.photos/seed/conflict2/800/600',
  'https://picsum.photos/seed/conflict3/800/600',
  'https://picsum.photos/seed/conflict4/800/600',
  'https://picsum.photos/seed/news1/800/600',
  'https://picsum.photos/seed/news2/800/600',
];

export function createMockPost(
  eventType: string,
  location: string,
  daysAgo: number = 0,
  hoursAgo: number = 0,
  includeMedia: boolean = false
): Post {
  const templates = POST_TEMPLATES[eventType] || POST_TEMPLATES.other;
  const template = pickRandom(templates);
  const content = template.replace('{location}', location);

  return {
    id: generateId(),
    x_post_id: `${randomInt(1000000000000000000, 9999999999999999999)}`,
    author_id: generateId(),
    author_username: pickRandom(USERNAMES),
    author_followers: randomInt(1000, 500000),
    author_verified: Math.random() > 0.7,
    account_created_at: generateISODate(randomInt(365, 3650)),
    content,
    media_urls: includeMedia ? [pickRandom(PLACEHOLDER_IMAGES)] : null,
    likes: randomInt(10, 5000),
    retweets: randomInt(5, 2000),
    replies: randomInt(1, 500),
    posted_at: generateISODate(daysAgo, hoursAgo),
    embedding: null,
    quality_score: randomFloat(0.6, 0.95),
    quality_passed: true,
    ingested_at: generateISODate(daysAgo, Math.max(0, hoursAgo - 1)),
    batch_id: generateId(),
  };
}

export function createMockEventPosts(
  eventType: string,
  location: string,
  count: number = 5,
  daysAgo: number = 0
): EventPostWithDetails[] {
  return Array.from({ length: count }, (_, i) => ({
    event_id: generateId(),
    post_id: generateId(),
    similarity_score: randomFloat(0.75, 0.98),
    post: createMockPost(
      eventType,
      location,
      daysAgo,
      i * 2, // Spread posts over time
      i < 2 // First 2 posts have media
    ),
  }));
}

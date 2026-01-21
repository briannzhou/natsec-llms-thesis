import type { Post, EventPostWithDetails } from '@event-monitor/shared';
import { generateId, generateISODate, randomInt, randomFloat, pickRandom } from './generators';

// Realistic post content templates for different event types
const POST_TEMPLATES: Record<string, string[]> = {
  conflict: [
    'BREAKING: Heavy shelling reported in {location}. Multiple casualties feared. Residents urged to seek shelter.',
    'Update from {location}: Ceasefire negotiations have broken down. Fighting intensifies near city center.',
    'Eyewitness reports of explosions in {location} overnight. Emergency services overwhelmed.',
    'Situation in {location} deteriorating rapidly. Local sources report ongoing clashes in multiple neighborhoods.',
    'Air raid sirens sounding in {location}. Residents taking cover. More updates to follow.',
  ],
  military: [
    'Military convoy spotted moving towards {location}. Locals report increased troop presence.',
    'Defense ministry announces new deployment in {location} region. Security operations underway.',
    'Satellite imagery shows military buildup near {location}. Analysts monitoring situation closely.',
    'Reports of military exercises near {location}. Civilian access to area restricted.',
    'Troop movements observed along border near {location}. Regional tensions remain high.',
  ],
  humanitarian: [
    'URGENT: Humanitarian crisis deepens in {location}. Aid agencies report critical shortages of food and medicine.',
    'Thousands displaced from {location}. Refugee camps reaching capacity. International response needed.',
    'Water and electricity cut off in {location} for 5th consecutive day. Civilians suffering.',
    'Medical facilities in {location} overwhelmed. WHO calling for immediate humanitarian access.',
    'Food distribution point established in {location}. Long queues forming as supplies run low.',
  ],
  political: [
    'Mass protests erupt in {location} following controversial government decision. Police deployed.',
    'Opposition leaders arrested in {location}. International community condemns crackdown.',
    'Emergency parliament session called in {location}. Constitutional crisis looms.',
    'Government declares state of emergency in {location}. Civil liberties suspended.',
    'Political tensions rise in {location} as rival factions clash over disputed election results.',
  ],
  protest: [
    'Thousands gather in {location} demanding change. Peaceful demonstration ongoing.',
    'Day 3 of protests in {location}. Government yet to respond to demonstrators\' demands.',
    'Clashes reported between protesters and police in {location}. Several injured.',
    'Protest movement spreads to {location}. Organizers call for nationwide action.',
    'Students leading protests in {location}. Universities closed as demonstrations continue.',
  ],
  other: [
    'Developing situation in {location}. Details remain unclear. Following closely.',
    'Unconfirmed reports emerging from {location}. Awaiting official statements.',
    'Multiple sources reporting incident in {location}. Investigation underway.',
    'Breaking news from {location}. More information expected soon.',
    'Monitoring situation in {location}. Updates to follow as details emerge.',
  ],
};

// OSINT-style usernames
const USERNAMES = [
  'intikiha_',
  'WarMonitor',
  'ConflictNews',
  'HumanitarianAid',
  'MiddleEastEye',
  'AFP_Africa',
  'BBCWorld',
  'AlJazeera',
  'OSINTdefender',
  'IntelCrab',
  'AuroraIntel',
  'sentdefender',
  'GlobalAlert',
  'CrisisWatch',
  'BreakingNow24',
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

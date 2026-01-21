import type { EventWithPosts, EventHistory } from '@event-monitor/shared';
import {
  generateId,
  generateISODate,
  randomInt,
  randomFloat,
  H3_INDICES,
  type LocationKey,
} from './generators';
import { createMockEventPosts } from './posts';

interface MockEventConfig {
  title: string;
  summary: string;
  eventType: string;
  location: LocationKey | null;
  locationName: string | null;
  country: string | null;
  postCount: number;
  daysAgo: number;
  version: number;
}

// Pre-configured mock events with realistic data
const MOCK_EVENT_CONFIGS: MockEventConfig[] = [
  // Events WITH locations (will appear on map)
  {
    title: 'Heavy Fighting Reported in Eastern Ukraine',
    summary:
      'Multiple sources report intense artillery exchanges near Bakhmut. Civilian evacuation efforts underway as front lines shift. Local authorities urge residents to seek shelter.',
    eventType: 'conflict',
    location: 'ukraine',
    locationName: 'Bakhmut, Donetsk Oblast',
    country: 'Ukraine',
    postCount: 12,
    daysAgo: 0,
    version: 3,
  },
  {
    title: 'Humanitarian Crisis Deepens in Sudan',
    summary:
      'Aid agencies report critical shortages as fighting between rival factions continues. Over 2 million displaced since conflict began. International organizations call for immediate ceasefire.',
    eventType: 'humanitarian',
    location: 'sudan',
    locationName: 'Khartoum',
    country: 'Sudan',
    postCount: 8,
    daysAgo: 1,
    version: 2,
  },
  {
    title: 'Mass Protests in Caracas',
    summary:
      'Tens of thousands take to the streets demanding free elections. Security forces deployed to key government buildings. Opposition leaders call for peaceful demonstrations.',
    eventType: 'protest',
    location: 'venezuela',
    locationName: 'Caracas',
    country: 'Venezuela',
    postCount: 15,
    daysAgo: 0,
    version: 1,
  },
  {
    title: 'Military Buildup Near Syrian Border',
    summary:
      'Satellite imagery reveals significant troop movements in Idlib province. Regional tensions escalate as diplomatic efforts stall. Analysts warn of potential escalation.',
    eventType: 'military',
    location: 'syria',
    locationName: 'Idlib Province',
    country: 'Syria',
    postCount: 6,
    daysAgo: 2,
    version: 1,
  },
  {
    title: 'Political Crisis Unfolds in Myanmar',
    summary:
      'Opposition leaders call for international intervention as government crackdown intensifies. Internet blackouts reported across major cities. UN expresses grave concern.',
    eventType: 'political',
    location: 'myanmar',
    locationName: 'Yangon',
    country: 'Myanmar',
    postCount: 9,
    daysAgo: 1,
    version: 2,
  },
  // Events WITHOUT locations (will appear in sidebar)
  {
    title: 'Cyberattack Targets Government Infrastructure',
    summary:
      'Multiple government agencies report system outages. Attribution unclear but sophisticated attack methods observed. Cybersecurity teams working to restore services.',
    eventType: 'other',
    location: null,
    locationName: null,
    country: null,
    postCount: 7,
    daysAgo: 0,
    version: 1,
  },
  {
    title: 'Global Supply Chain Disruption Reported',
    summary:
      'Shipping delays impact multiple regions as port congestion worsens. Economic analysts warn of inflationary pressures. Major retailers report inventory shortages.',
    eventType: 'other',
    location: null,
    locationName: null,
    country: null,
    postCount: 4,
    daysAgo: 3,
    version: 1,
  },
  {
    title: 'Unverified Reports of Chemical Weapons Use',
    summary:
      'Social media posts allege chemical attack in contested territory. International monitors unable to confirm. Investigation pending as conflicting reports emerge.',
    eventType: 'conflict',
    location: null,
    locationName: null,
    country: null,
    postCount: 11,
    daysAgo: 1,
    version: 1,
  },
];

function createEventHistory(
  eventId: string,
  title: string,
  summary: string,
  version: number,
  daysAgo: number
): EventHistory[] {
  const history: EventHistory[] = [];

  for (let v = 1; v <= version; v++) {
    history.push({
      id: generateId(),
      event_id: eventId,
      version: v,
      title: v === 1 ? title : null,
      summary: v === 1 ? summary : null,
      post_count: randomInt(2, 5) * v,
      changed_at: generateISODate(daysAgo, (version - v) * 6),
      change_type: v === 1 ? 'created' : 'updated',
    });
  }

  return history;
}

function createMockEvent(config: MockEventConfig): EventWithPosts {
  const eventId = generateId();
  const hasLocation = config.location !== null;

  // Get H3 indices and coordinates if location exists
  let latitude: number | null = null;
  let longitude: number | null = null;
  let h3_index_res4: string | null = null;
  let h3_index_res6: string | null = null;
  let h3_index_res8: string | null = null;

  if (config.location && H3_INDICES[config.location]) {
    const locationData = H3_INDICES[config.location];
    [latitude, longitude] = locationData.coords;
    h3_index_res4 = locationData.res4;
    h3_index_res6 = locationData.res6;
    h3_index_res8 = locationData.res8;
  }

  return {
    id: eventId,
    version: config.version,
    parent_event_id: null,
    title: config.title,
    summary: config.summary,
    event_type: config.eventType,
    confidence_score: randomFloat(0.7, 0.95),
    post_count: config.postCount,
    centroid_embedding: null,
    has_location: hasLocation,
    location_name: config.locationName,
    country: config.country,
    latitude,
    longitude,
    h3_index_res4,
    h3_index_res6,
    h3_index_res8,
    earliest_post_at: generateISODate(config.daysAgo, 12),
    latest_post_at: generateISODate(config.daysAgo, 2),
    batch_id: generateId(),
    created_at: generateISODate(config.daysAgo, 6),
    expires_at: null,
    event_posts: createMockEventPosts(
      config.eventType,
      config.locationName ?? 'Unknown Location',
      Math.min(config.postCount, 8),
      config.daysAgo
    ),
    event_history: createEventHistory(
      eventId,
      config.title,
      config.summary,
      config.version,
      config.daysAgo
    ),
  };
}

// Generate all mock events (regenerated each time for fresh timestamps)
export const MOCK_EVENTS: EventWithPosts[] = MOCK_EVENT_CONFIGS.map(createMockEvent);

// Export function to get fresh events with updated timestamps
export function getMockEvents(): EventWithPosts[] {
  return MOCK_EVENT_CONFIGS.map(createMockEvent);
}

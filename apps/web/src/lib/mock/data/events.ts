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
  urgency: number; // 0-1 scale, higher = more urgent
}

// Pre-configured mock events with realistic data based on January 2026 news
const MOCK_EVENT_CONFIGS: MockEventConfig[] = [
  // ===== VENEZUELA EVENTS =====
  // US Military Intervention - Operation Absolute Resolve (Jan 3, 2026)
  {
    title: 'US Military Strikes Target Venezuelan Government Infrastructure',
    summary:
      'Operation Absolute Resolve begins around 2am local time with explosions across northern Venezuela. US Armed Forces bombing air defense infrastructure as Special Forces move on presidential compound in Caracas. Residents report heavy explosions and aircraft overhead.',
    eventType: 'conflict',
    location: 'caracas',
    locationName: 'Caracas',
    country: 'Venezuela',
    postCount: 24,
    daysAgo: 0,
    version: 4,
    urgency: 0.95,
  },
  {
    title: 'Maduro Captured by US Forces, Transported to New York',
    summary:
      'Venezuelan President Nicolás Maduro and wife Cilia Flores seized from compound in Caracas by US Special Forces. Both transported to New York City to face narcoterrorism charges. Maduro pleads not guilty in Manhattan federal court. International community divided on legality of operation.',
    eventType: 'political',
    location: 'caracas',
    locationName: 'Caracas',
    country: 'Venezuela',
    postCount: 18,
    daysAgo: 0,
    version: 3,
    urgency: 0.9,
  },
  {
    title: 'Delcy Rodríguez Sworn In as Venezuelan Interim President',
    summary:
      'Venezuelan Supreme Court appoints Vice President Delcy Rodríguez as interim leader following Maduro capture. Court declares absence "temporary" despite US custody. Constitution requires election within 30 days but timeline uncertain. Government insists operations continue normally.',
    eventType: 'political',
    location: 'caracas',
    locationName: 'Caracas',
    country: 'Venezuela',
    postCount: 12,
    daysAgo: 0,
    version: 2,
    urgency: 0.7,
  },
  {
    title: 'Celebrations Erupt Across Venezuela Following Maduro Removal',
    summary:
      'Venezuelans take to streets in Caracas, Valencia, and Maracaibo celebrating Maduro capture. Venezuelan diaspora celebrates in Miami, Madrid, and across Latin America. Flags waving, chants of "Libertad!" reported. Some pro-government counter-protests also occurring.',
    eventType: 'protest',
    location: 'valencia',
    locationName: 'Valencia',
    country: 'Venezuela',
    postCount: 15,
    daysAgo: 0,
    version: 2,
    urgency: 0.6,
  },
  {
    title: 'Pro-Maduro Demonstrations in Maracaibo',
    summary:
      'Supporters of detained President Maduro gathering in Maracaibo with portraits and PSUV party banners. Protesters condemn US intervention as violation of sovereignty. Security forces maintaining order as tensions rise between rival groups.',
    eventType: 'protest',
    location: 'maracaibo',
    locationName: 'Maracaibo',
    country: 'Venezuela',
    postCount: 10,
    daysAgo: 0,
    version: 1,
    urgency: 0.55,
  },
  {
    title: 'Political Prisoners Released from Venezuelan Detention',
    summary:
      'Reports of political prisoners being released from detention facilities across Venezuela. Human rights organizations confirm 154 releases so far out of estimated 800+ held. Emotional reunions as families gather outside facilities in Caracas and Barquisimeto.',
    eventType: 'political',
    location: 'barquisimeto',
    locationName: 'Barquisimeto',
    country: 'Venezuela',
    postCount: 8,
    daysAgo: 0,
    version: 1,
    urgency: 0.5,
  },

  // ===== UKRAINE EVENTS =====
  // Massive Drone/Missile Attack (Jan 25, 2026)
  {
    title: 'Massive Russian Drone and Missile Attack on Kyiv',
    summary:
      'Russia launches 375 drones and 21 missiles overnight including two rare Tsirkon hypersonic missiles. At least one killed, four wounded in Kyiv. 1.2 million properties left without power nationwide. Ukrainian air defense intercepts majority but some get through.',
    eventType: 'conflict',
    location: 'kyiv',
    locationName: 'Kyiv',
    country: 'Ukraine',
    postCount: 22,
    daysAgo: 0,
    version: 3,
    urgency: 0.92,
  },
  {
    title: 'Kharkiv Medical Facilities Hit in Drone Attack',
    summary:
      'At least 30 wounded including children as 25 drones strike multiple districts in Kharkiv. Maternity hospital and dormitory for displaced persons among targets hit. Rescue operations ongoing. Medical facilities overwhelmed with casualties.',
    eventType: 'humanitarian',
    location: 'kharkiv',
    locationName: 'Kharkiv',
    country: 'Ukraine',
    postCount: 16,
    daysAgo: 0,
    version: 2,
    urgency: 0.88,
  },
  {
    title: 'Russian Forces Advance Toward Zaporizhzhia Regional Capital',
    summary:
      'Russian military now just 7 kilometers from 670,000-population Zaporizhzhia city. Slow but steady advance through oblast continues. Ukrainian forces contesting every position. Civilians urged to evacuate. Regional administration preparing contingencies.',
    eventType: 'military',
    location: 'zaporizhzhia',
    locationName: 'Zaporizhzhia',
    country: 'Ukraine',
    postCount: 14,
    daysAgo: 1,
    version: 3,
    urgency: 0.85,
  },
  {
    title: 'Energy Infrastructure Crisis Worsens Across Ukraine',
    summary:
      'Ukraine generating capacity fallen from 33.7 GW to just 14 GW since invasion began. Blackouts lasting up to four days in some regions. December drone attacks triple previous year. Civilians facing heating crisis as temperatures drop below freezing.',
    eventType: 'humanitarian',
    location: 'kyiv',
    locationName: 'Kyiv',
    country: 'Ukraine',
    postCount: 11,
    daysAgo: 1,
    version: 2,
    urgency: 0.75,
  },
  {
    title: 'Heavy Fighting Continues Near Bakhmut',
    summary:
      'Intense artillery exchanges continue in Donetsk Oblast. Russian forces claim incremental gains while Ukrainian military contests reports. Front lines largely static but casualties mounting on both sides. Civilian evacuation efforts ongoing.',
    eventType: 'military',
    location: 'bakhmut',
    locationName: 'Bakhmut, Donetsk Oblast',
    country: 'Ukraine',
    postCount: 13,
    daysAgo: 0,
    version: 4,
    urgency: 0.8,
  },
  {
    title: 'France and UK Propose Peacekeeping Force Deployment',
    summary:
      'Zelensky, Macron, and Starmer sign agreement on potential multinational force deployment to Ukraine. France offers "several thousand" troops for post-ceasefire security. UK and France planning military hubs across Ukraine. Coalition of 24 nations backs robust security guarantees.',
    eventType: 'political',
    location: 'kyiv',
    locationName: 'Kyiv',
    country: 'Ukraine',
    postCount: 9,
    daysAgo: 2,
    version: 2,
    urgency: 0.45,
  },
  {
    title: 'Odesa Port Targeted in Overnight Strike',
    summary:
      'Russian drones target port infrastructure in Odesa. Air defense intercepts most incoming but some damage reported to grain storage facilities. Black Sea shipping routes remain contested. International monitoring of grain deal compliance ongoing.',
    eventType: 'conflict',
    location: 'odesa',
    locationName: 'Odesa',
    country: 'Ukraine',
    postCount: 10,
    daysAgo: 1,
    version: 1,
    urgency: 0.7,
  },

  // ===== EVENTS WITHOUT SPECIFIC LOCATIONS =====
  {
    title: 'UN Security Council Divided on Venezuela Intervention',
    summary:
      'Security Council members split on whether US capture of Maduro upholds accountability or undermines international order. Western nations largely supportive while Global South condemns action. Emergency session called as debate over sovereignty continues.',
    eventType: 'political',
    location: null,
    locationName: null,
    country: null,
    postCount: 7,
    daysAgo: 0,
    version: 1,
    urgency: 0.6,
  },
  {
    title: 'UNICEF Launches $350 Million Ukraine Humanitarian Appeal',
    summary:
      'UN agency launches major appeal to provide assistance to 4.3 million people including 725,000 children. Over 50,000 civilians killed or injured since February 2022 invasion. Actual toll likely higher. Winter conditions exacerbating humanitarian crisis.',
    eventType: 'humanitarian',
    location: null,
    locationName: null,
    country: null,
    postCount: 6,
    daysAgo: 1,
    version: 1,
    urgency: 0.65,
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
    model: 'Grok 4.1',
    parent_event_id: null,
    title: config.title,
    summary: config.summary,
    event_type: config.eventType,
    confidence_score: randomFloat(0.7, 0.95),
    urgency_score: config.urgency,
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

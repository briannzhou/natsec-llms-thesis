import type { EventFilters, EventWithPosts } from '@event-monitor/shared';
import { MOCK_EVENTS } from '../data/events';

// Simulate network delay for realistic behavior
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const simulateDelay = (ms: number = 300): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getMockEvents(filters: EventFilters): Promise<EventWithPosts[]> {
  await simulateDelay(randomInt(200, 500));

  let results = [...MOCK_EVENTS];

  // Apply search filter (matches title or summary)
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    results = results.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.summary.toLowerCase().includes(query)
    );
  }

  // Apply date range filter
  if (filters.dateRange?.start) {
    results = results.filter(
      (event) => new Date(event.created_at) >= filters.dateRange!.start
    );
  }

  if (filters.dateRange?.end) {
    results = results.filter(
      (event) => new Date(event.created_at) <= filters.dateRange!.end
    );
  }

  // Apply event type filter
  if (filters.eventTypes?.length) {
    results = results.filter((event) =>
      filters.eventTypes!.includes(event.event_type ?? 'other')
    );
  }

  // Apply location filter
  if (filters.hasLocation !== undefined) {
    results = results.filter((event) => event.has_location === filters.hasLocation);
  }

  // Sort by created_at descending (matching real query behavior)
  results.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return results;
}

export async function getMockEventById(eventId: string): Promise<EventWithPosts | null> {
  await simulateDelay(randomInt(100, 300));

  const event = MOCK_EVENTS.find((e) => e.id === eventId);
  return event ?? null;
}

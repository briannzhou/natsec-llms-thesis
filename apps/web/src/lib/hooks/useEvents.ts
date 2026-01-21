import useSWR from 'swr';
import { getEvents } from '../queries/events';
import type { EventFilters, EventWithPosts } from '@event-monitor/shared';

export function useEvents(filters: EventFilters) {
  const { data, error, isLoading, mutate } = useSWR<EventWithPosts[]>(
    ['events', filters],
    () => getEvents(filters),
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false,
    }
  );

  return {
    events: data,
    error,
    isLoading,
    mutate,
  };
}

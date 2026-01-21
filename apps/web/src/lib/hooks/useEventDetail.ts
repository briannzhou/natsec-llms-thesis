import useSWR from 'swr';
import { getEventById } from '../queries/events';
import type { EventWithPosts } from '@event-monitor/shared';

export function useEventDetail(eventId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EventWithPosts | null>(
    eventId ? ['event', eventId] : null,
    () => (eventId ? getEventById(eventId) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    event: data,
    error,
    isLoading,
    mutate,
  };
}

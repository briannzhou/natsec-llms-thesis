import { supabase } from '../supabase';
import { isMockMode } from '../mock';
import {
  getMockEvents as getMockEventsData,
  getMockEventById as getMockEventByIdData,
} from '../mock/queries/events';
import type { EventFilters, EventWithPosts } from '@event-monitor/shared';

export async function getEvents(filters: EventFilters): Promise<EventWithPosts[]> {
  // Use mock data if mock mode is enabled
  if (isMockMode()) {
    return getMockEventsData(filters);
  }

  let query = supabase
    .from('events')
    .select(`
      *,
      event_posts (
        similarity_score,
        post:posts (
          id,
          x_post_id,
          content,
          author_username,
          media_urls,
          posted_at,
          likes,
          retweets,
          replies
        )
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.searchQuery) {
    query = query.textSearch('title', filters.searchQuery, {
      type: 'websearch',
      config: 'english',
    });
  }

  if (filters.dateRange?.start) {
    query = query.gte('created_at', filters.dateRange.start.toISOString());
  }

  if (filters.dateRange?.end) {
    query = query.lte('created_at', filters.dateRange.end.toISOString());
  }

  if (filters.eventTypes?.length) {
    query = query.in('event_type', filters.eventTypes);
  }

  if (filters.hasLocation !== undefined) {
    query = query.eq('has_location', filters.hasLocation);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return (data ?? []) as EventWithPosts[];
}

export async function getEventById(eventId: string): Promise<EventWithPosts | null> {
  // Use mock data if mock mode is enabled
  if (isMockMode()) {
    return getMockEventByIdData(eventId);
  }

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_posts (
        similarity_score,
        post:posts (*)
      ),
      event_history (*)
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch event: ${error.message}`);
  }

  return data as EventWithPosts;
}

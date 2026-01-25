'use client';

import { Box, Typography } from '@mui/material';
import { List } from '@mui/icons-material';
import { EventCardCompact, EventCardCompactSkeleton } from './EventCardCompact';
import type { EventWithPosts } from '@event-monitor/shared';

interface EventListProps {
  events: EventWithPosts[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
  isLoading: boolean;
}

export function EventList({
  events,
  selectedEventId,
  onEventSelect,
  isLoading,
}: EventListProps) {
  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <List color="action" />
        <Typography variant="subtitle1" fontWeight={600}>
          Events
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {events.length}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {isLoading ? (
          <>
            <EventCardCompactSkeleton />
            <EventCardCompactSkeleton />
            <EventCardCompactSkeleton />
          </>
        ) : events.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', mt: 4 }}
          >
            No events found
          </Typography>
        ) : (
          events.map((event) => (
            <EventCardCompact
              key={event.id}
              event={event}
              isSelected={event.id === selectedEventId}
              onClick={() => onEventSelect(event.id)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

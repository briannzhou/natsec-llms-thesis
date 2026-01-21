'use client';

import { Box, Typography } from '@mui/material';
import { LocationOff } from '@mui/icons-material';
import { EventCard, EventCardSkeleton } from './EventCard';
import type { EventWithPosts } from '@event-monitor/shared';

interface NoLocationListProps {
  events: EventWithPosts[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
  isLoading: boolean;
}

export function NoLocationList({
  events,
  selectedEventId,
  onEventSelect,
  isLoading,
}: NoLocationListProps) {
  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LocationOff color="action" />
        <Typography variant="subtitle1" fontWeight={600}>
          Events Without Location
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
          gap: 1.5,
        }}
      >
        {isLoading ? (
          <>
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </>
        ) : events.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', mt: 4 }}
          >
            No events without location
          </Typography>
        ) : (
          events.map((event) => (
            <EventCard
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

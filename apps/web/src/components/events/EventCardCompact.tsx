'use client';

import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Skeleton,
} from '@mui/material';
import { LocationOff } from '@mui/icons-material';
import type { EventWithPosts } from '@event-monitor/shared';

interface EventCardCompactProps {
  event: EventWithPosts;
  isSelected: boolean;
  onClick: () => void;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  conflict: '#ef4444',
  military: '#f97316',
  humanitarian: '#eab308',
  political: '#3b82f6',
  protest: '#a855f7',
  other: '#6b7280',
};

function truncateTitle(title: string, maxLength: number = 50): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength) + '...';
}

export function EventCardCompact({ event, isSelected, onClick }: EventCardCompactProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.light',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={event.event_type ?? 'other'}
            size="small"
            sx={{
              bgcolor: EVENT_TYPE_COLORS[event.event_type ?? 'other'],
              color: 'white',
              fontSize: '0.7rem',
              height: 20,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {truncateTitle(event.title)}
          </Typography>
          {!event.has_location && (
            <LocationOff sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export function EventCardCompactSkeleton() {
  return (
    <Card sx={{ border: 1, borderColor: 'divider' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="rounded" width={60} height={20} />
          <Skeleton variant="text" sx={{ flex: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

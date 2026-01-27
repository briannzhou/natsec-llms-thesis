'use client';

import {
  Card,
  CardContent,
  Typography,
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

function truncateTitle(title: string, maxLength: number = 60): string {
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
        flexShrink: 0,
        '&:hover': {
          borderColor: 'primary.light',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
    <Card sx={{ border: 1, borderColor: 'divider', flexShrink: 0 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Skeleton variant="text" sx={{ width: '100%' }} />
      </CardContent>
    </Card>
  );
}

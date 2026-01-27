'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
} from '@mui/material';
import { LocationOff, AccessTime } from '@mui/icons-material';
import type { EventWithPosts } from '@event-monitor/shared';

interface EventCardProps {
  event: EventWithPosts;
  isSelected: boolean;
  onClick: () => void;
}

export function EventCard({ event, isSelected, onClick }: EventCardProps) {
  const timeAgo = getTimeAgo(new Date(event.created_at));

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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
            {event.title}
          </Typography>
          {!event.has_location && (
            <LocationOff sx={{ fontSize: 16, color: 'text.secondary' }} />
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.8rem',
          }}
        >
          {event.summary}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 1,
            color: 'text.secondary',
          }}
        >
          <AccessTime sx={{ fontSize: 14 }} />
          <Typography variant="caption">{timeAgo}</Typography>
          <Typography variant="caption" sx={{ ml: 'auto' }}>
            {event.post_count} posts
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export function EventCardSkeleton() {
  return (
    <Card sx={{ border: 1, borderColor: 'divider', flexShrink: 0 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="50%" sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

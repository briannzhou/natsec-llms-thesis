'use client';

import {
  Box,
  Typography,
  Chip,
  Divider,
  Skeleton,
  Grid,
  Link,
} from '@mui/material';
import {
  LocationOn,
  AccessTime,
  TrendingUp,
  Article,
} from '@mui/icons-material';
import { EventPosts } from './EventPosts';
import { MediaGallery } from './MediaGallery';
import { VersionHistory } from './VersionHistory';
import type { EventWithPosts } from '@event-monitor/shared';

interface EventDetailProps {
  event: EventWithPosts | undefined;
  isLoading: boolean;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  conflict: '#ef4444',
  military: '#f97316',
  humanitarian: '#eab308',
  political: '#3b82f6',
  protest: '#a855f7',
  other: '#6b7280',
};

export function EventDetail({ event, isLoading }: EventDetailProps) {
  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (!event) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body1">
          Select an event to view details
        </Typography>
      </Box>
    );
  }

  const allMediaUrls = event.event_posts
    ?.flatMap((ep) => ep.post?.media_urls ?? [])
    .filter(Boolean) ?? [];

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1 }}>
          <Chip
            label={event.event_type ?? 'other'}
            sx={{
              bgcolor: EVENT_TYPE_COLORS[event.event_type ?? 'other'],
              color: 'white',
            }}
          />
          <Chip
            label={`v${event.version}`}
            variant="outlined"
            size="small"
          />
          {event.model && (
            <Chip
              label={event.model}
              variant="outlined"
              size="small"
            />
          )}
          {event.confidence_score !== null && (
            <Chip
              icon={<TrendingUp sx={{ fontSize: 16 }} />}
              label={`${Math.round(event.confidence_score * 100)}% confidence`}
              variant="outlined"
              size="small"
            />
          )}
        </Box>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          {event.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {event.summary}
        </Typography>

        {/* Metadata */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {event.has_location && event.location_name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOn sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="body2">
                {event.location_name}
                {event.country && `, ${event.country}`}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {new Date(event.created_at).toLocaleString()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Article sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {event.post_count} source posts
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Source Posts */}
        <Grid item xs={12} md={allMediaUrls.length > 0 ? 6 : 8}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Source Posts
          </Typography>
          <EventPosts posts={event.event_posts ?? []} />
        </Grid>

        {/* Media Gallery */}
        {allMediaUrls.length > 0 && (
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Media
            </Typography>
            <MediaGallery urls={allMediaUrls} />
          </Grid>
        )}

        {/* Version History */}
        {event.event_history && event.event_history.length > 0 && (
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Version History
            </Typography>
            <VersionHistory history={event.event_history} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

function EventDetailSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={40} height={32} />
      </Box>
      <Skeleton variant="text" width="60%" height={40} />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Skeleton variant="text" width={150} />
        <Skeleton variant="text" width={150} />
      </Box>
    </Box>
  );
}

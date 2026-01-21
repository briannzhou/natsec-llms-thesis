'use client';

import { Box, Typography } from '@mui/material';
import type { EventHistory } from '@event-monitor/shared';

interface VersionHistoryProps {
  history: EventHistory[];
}

export function VersionHistory({ history }: VersionHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  const sortedHistory = [...history].sort((a, b) => b.version - a.version);

  return (
    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
      {sortedHistory.map((entry, index) => (
        <Box
          key={entry.id}
          sx={{
            display: 'flex',
            gap: 1,
            mb: 1,
            pb: 1,
            borderBottom: index < sortedHistory.length - 1 ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            v{entry.version}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {new Date(entry.changed_at).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {entry.change_type} • {entry.post_count} posts
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

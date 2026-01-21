'use client';

import { useState } from 'react';
import { Box, Container } from '@mui/material';
import { MapContainer } from '@/components/map/MapContainer';
import { NoLocationList } from '@/components/events/NoLocationList';
import { EventDetail } from '@/components/events/EventDetail';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { useEvents } from '@/lib/hooks/useEvents';
import type { EventFilters } from '@event-monitor/shared';

export default function DashboardPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});

  const { events, isLoading, error } = useEvents(filters);

  const eventsWithLocation = events?.filter((e) => e.has_location) ?? [];
  const eventsWithoutLocation = events?.filter((e) => !e.has_location) ?? [];

  const selectedEvent = events?.find((e) => e.id === selectedEventId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header with Search and Filters */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <SearchBar
          value={filters.searchQuery ?? ''}
          onChange={(searchQuery) =>
            setFilters((prev) => ({ ...prev, searchQuery }))
          }
        />
        <FilterPanel filters={filters} onChange={setFilters} />
      </Box>

      {/* Main Content: Map + No-Location List */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left Sidebar: No-Location Events */}
        <Box
          sx={{
            width: '20%',
            minWidth: 250,
            maxWidth: 350,
            borderRight: 1,
            borderColor: 'divider',
            overflow: 'auto',
          }}
        >
          <NoLocationList
            events={eventsWithoutLocation}
            selectedEventId={selectedEventId}
            onEventSelect={setSelectedEventId}
            isLoading={isLoading}
          />
        </Box>

        {/* Map */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <MapContainer
            events={eventsWithLocation}
            selectedEventId={selectedEventId}
            onEventSelect={setSelectedEventId}
          />
        </Box>
      </Box>

      {/* Bottom Panel: Event Detail */}
      <Box
        sx={{
          height: '35%',
          minHeight: 200,
          maxHeight: 400,
          borderTop: 1,
          borderColor: 'divider',
          overflow: 'auto',
        }}
      >
        <EventDetail event={selectedEvent} isLoading={isLoading && !!selectedEventId} />
      </Box>
    </Box>
  );
}

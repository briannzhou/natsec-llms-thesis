'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <CircularProgress /> }
);
import { EventList } from '@/components/events/EventList';
import { EventDetail } from '@/components/events/EventDetail';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { useEvents } from '@/lib/hooks/useEvents';
import type { EventFilters } from '@event-monitor/shared';

export default function DashboardPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { events, isLoading, error } = useEvents(filters);

  const eventsWithLocation = events?.filter((e) => e.has_location) ?? [];
  const allEvents = events ?? [];

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

      {/* Main Content: Map + Event List */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left Sidebar: All Events */}
        <Box
          sx={{
            width: '31%',
            minWidth: 300,
            maxWidth: 450,
            borderRight: 1,
            borderColor: 'divider',
            overflow: 'auto',
          }}
        >
          <EventList
            events={allEvents}
            selectedEventId={selectedEventId}
            onEventSelect={setSelectedEventId}
            isLoading={isLoading}
          />
        </Box>

        {/* Map */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {mounted && (
            <MapContainer
              events={eventsWithLocation}
              selectedEventId={selectedEventId}
              onEventSelect={setSelectedEventId}
            />
          )}
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { Settings, Close } from '@mui/icons-material';

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
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [cellEventIds, setCellEventIds] = useState<string[]>([]);
  const [visibleEventIds, setVisibleEventIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<EventFilters>({});
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeModel, setActiveModel] = useState('Grok 4.1');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const { events, isLoading, error } = useEvents(filters);

  const eventsWithLocation = events?.filter((e) => e.has_location) ?? [];
  const allEvents = events ?? [];

  // Filter events for sidebar based on selected cell OR visible on map
  const displayedEvents = selectedCellId
    ? allEvents.filter((e) => cellEventIds.includes(e.id))
    : allEvents.filter((e) => !e.has_location || visibleEventIds.includes(e.id));

  const handleVisibleEventsChange = useCallback((ids: string[]) => {
    setVisibleEventIds(ids);
  }, []);

  const selectedEvent = events?.find((e) => e.id === selectedEventId);

  const handleCellSelect = (cellId: string | null, eventIds: string[]) => {
    setSelectedCellId(cellId);
    setCellEventIds(eventIds);
    // Auto-select first event in cell if only one event
    if (eventIds.length === 1) {
      setSelectedEventId(eventIds[0]);
    } else {
      setSelectedEventId(null);
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
  };

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
        {/* Urgency Legend */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            ml: 'auto',
            px: 2,
            py: 0.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
          }}
        >
          <Box component="span" sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 500 }}>
            Minor
          </Box>
          <Box
            sx={{
              width: 100,
              height: 10,
              borderRadius: 0.5,
              background: 'linear-gradient(to right, #ffff00, #ffa500, #ff0000)',
            }}
          />
          <Box component="span" sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 500 }}>
            Urgent
          </Box>
        </Box>
        {/* Settings Button */}
        <IconButton
          onClick={() => setShowSettings(!showSettings)}
          sx={{
            bgcolor: showSettings ? 'common.white' : 'action.hover',
            color: showSettings ? 'common.black' : 'text.secondary',
            '&:hover': {
              bgcolor: showSettings ? 'grey.200' : 'action.selected',
            },
          }}
          size="small"
        >
          {showSettings ? <Close /> : <Settings />}
        </IconButton>
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
            events={displayedEvents}
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
            isLoading={isLoading}
            selectedCellId={selectedCellId}
            onClearCellFilter={() => handleCellSelect(null, [])}
          />
        </Box>

        {/* Map and Settings */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {/* Settings Panel (overlay) */}
          {showSettings && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'background.paper',
                p: 4,
                overflow: 'auto',
                zIndex: 10,
              }}
            >
              <Typography variant="h5" fontWeight={600} sx={{ mb: 4 }}>
                Settings
              </Typography>

              <Box sx={{ maxWidth: 625, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Active Model Setting */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                    Active Model
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Model used to perform analyses and summarizations.
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel id="active-model-label">Model</InputLabel>
                    <Select
                      labelId="active-model-label"
                      value={activeModel}
                      onChange={(e: SelectChangeEvent) => setActiveModel(e.target.value)}
                      label="Model"
                    >
                      <MenuItem value="Grok 4.1">Grok 4.1</MenuItem>
                      <MenuItem value="gpt-4o">GPT-4o</MenuItem>
                      <MenuItem value="gpt-4o-mini">GPT-4o Mini</MenuItem>
                      <MenuItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</MenuItem>
                      <MenuItem value="claude-3-5-haiku">Claude 3.5 Haiku</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Additional Instructions Setting */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                    Additional Instructions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Additional guidelines or behaviors for the model. These will be added to the system prompt on model calls.
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                    placeholder="Enter additional instructions for the model..."
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                  />
                </Box>
              </Box>
            </Box>
          )}
          {/* Map (always mounted to preserve state) */}
          {mounted && (
            <MapContainer
              events={eventsWithLocation}
              selectedEventId={selectedEventId}
              selectedCellId={selectedCellId}
              onCellSelect={handleCellSelect}
              onVisibleEventsChange={handleVisibleEventsChange}
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

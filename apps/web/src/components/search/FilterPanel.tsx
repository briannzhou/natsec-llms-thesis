'use client';

import { Box, FormControl, InputLabel, Select, MenuItem, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocationOn, LocationOff, Public } from '@mui/icons-material';
import type { EventFilters } from '@event-monitor/shared';

interface FilterPanelProps {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
}

const EVENT_TYPES = [
  'conflict',
  'military',
  'humanitarian',
  'political',
  'protest',
  'other',
];

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const handleEventTypeChange = (eventType: string) => {
    const currentTypes = filters.eventTypes ?? [];
    const newTypes = currentTypes.includes(eventType)
      ? currentTypes.filter((t) => t !== eventType)
      : [...currentTypes, eventType];

    onChange({
      ...filters,
      eventTypes: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleLocationFilter = (
    _: React.MouseEvent<HTMLElement>,
    value: 'all' | 'with' | 'without' | null
  ) => {
    if (value === null) return;

    onChange({
      ...filters,
      hasLocation: value === 'all' ? undefined : value === 'with',
    });
  };

  const locationValue = filters.hasLocation === undefined
    ? 'all'
    : filters.hasLocation
      ? 'with'
      : 'without';

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Event Type Multi-Select */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {EVENT_TYPES.map((type) => (
          <Chip
            key={type}
            label={type}
            size="small"
            variant={filters.eventTypes?.includes(type) ? 'filled' : 'outlined'}
            onClick={() => handleEventTypeChange(type)}
            sx={{ textTransform: 'capitalize' }}
          />
        ))}
      </Box>

      {/* Location Filter */}
      <ToggleButtonGroup
        value={locationValue}
        exclusive
        onChange={handleLocationFilter}
        size="small"
      >
        <ToggleButton value="all">
          <Public sx={{ fontSize: 18, mr: 0.5 }} />
          All
        </ToggleButton>
        <ToggleButton value="with">
          <LocationOn sx={{ fontSize: 18, mr: 0.5 }} />
          Located
        </ToggleButton>
        <ToggleButton value="without">
          <LocationOff sx={{ fontSize: 18, mr: 0.5 }} />
          No Location
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Clear Filters */}
      {(filters.searchQuery || filters.eventTypes?.length || filters.hasLocation !== undefined) && (
        <Chip
          label="Clear filters"
          onDelete={() => onChange({})}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
    </Box>
  );
}

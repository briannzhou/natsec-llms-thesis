'use client';

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
} from '@mui/material';
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

const LOCATION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'with', label: 'Known' },
  { value: 'without', label: 'Unknown' },
];

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const handleEventTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const newTypes = typeof value === 'string' ? value.split(',') : value;

    onChange({
      ...filters,
      eventTypes: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleLocationChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as 'all' | 'with' | 'without';

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
      {/* Classification Multi-Select Dropdown */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="classification-label">Classification</InputLabel>
        <Select
          labelId="classification-label"
          multiple
          value={filters.eventTypes ?? []}
          onChange={handleEventTypeChange}
          label="Classification"
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip
                  key={value}
                  label={value}
                  size="small"
                  sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          )}
        >
          {EVENT_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              <Checkbox checked={(filters.eventTypes ?? []).includes(type)} size="small" />
              <ListItemText primary={type} sx={{ textTransform: 'capitalize' }} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Location Single-Select Dropdown */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="location-label">Location</InputLabel>
        <Select
          labelId="location-label"
          value={locationValue}
          onChange={handleLocationChange}
          label="Location"
        >
          {LOCATION_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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

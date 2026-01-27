'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map, { NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DeckGL from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { WebMercatorViewport } from '@deck.gl/core';
import { useAdaptiveResolution, useH3IndexResolver, getH3IndexField } from './useAdaptiveH3';
import type { EventWithPosts } from '@event-monitor/shared';
import type { PickingInfo } from '@deck.gl/core';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

// Heat map color interpolation based on urgency (0-1 scale)
// Low urgency = yellow, high urgency = red
function getHeatMapColor(
  urgency: number,
  isSelected: boolean
): [number, number, number, number] {
  // Clamp urgency to 0-1
  const u = Math.max(0, Math.min(1, urgency));

  // Interpolate from yellow (low) to orange to red (high)
  let r: number, g: number, b: number;

  if (u < 0.5) {
    // Yellow to orange (0 - 0.5)
    const t = u * 2;
    r = 255;
    g = Math.round(255 - (255 - 165) * t); // 255 -> 165
    b = 0;
  } else {
    // Orange to red (0.5 - 1.0)
    const t = (u - 0.5) * 2;
    r = 255;
    g = Math.round(165 - 165 * t); // 165 -> 0
    b = 0;
  }

  const alpha = isSelected ? 255 : 180;

  if (isSelected) {
    // Lighten for selection
    r = Math.round(r + (255 - r) * 0.3);
    g = Math.round(g + (255 - g) * 0.3);
    b = Math.round(b + (255 - b) * 0.3);
  }

  return [r, g, b, alpha];
}

interface CellData {
  h3Index: string;
  events: EventWithPosts[];
  count: number;
  totalUrgency: number;
}

interface MapContainerProps {
  events: EventWithPosts[];
  selectedEventId: string | null;
  selectedCellId: string | null;
  onCellSelect: (cellId: string | null, eventIds: string[]) => void;
  onVisibleEventsChange?: (visibleEventIds: string[]) => void;
}

export function MapContainer({
  events,
  selectedEventId,
  selectedCellId,
  onCellSelect,
  onVisibleEventsChange,
}: MapContainerProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const resolution = useAdaptiveResolution(viewState.zoom);
  const resolveH3Index = useH3IndexResolver(resolution);

  // Track container size for viewport calculations
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Force initial render of DeckGL layers by triggering a view state update
  useEffect(() => {
    const timer = setTimeout(() => {
      setViewState((prev) => ({ ...prev }));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Track previous visible IDs to avoid unnecessary updates
  const prevVisibleIdsRef = useRef<string>('');

  // Calculate visible events based on viewport bounds
  useEffect(() => {
    if (!onVisibleEventsChange) return;

    const viewport = new WebMercatorViewport({
      ...viewState,
      width: containerSize.width,
      height: containerSize.height,
    });

    // Get the viewport bounds
    const topLeft = viewport.unproject([0, 0]);
    const bottomRight = viewport.unproject([containerSize.width, containerSize.height]);

    const [minLng, maxLat] = topLeft;
    const [maxLng, minLat] = bottomRight;

    // Filter events that are within the visible bounds
    const visibleIds = events
      .filter((event) => {
        if (!event.latitude || !event.longitude) return false;
        return (
          event.longitude >= minLng &&
          event.longitude <= maxLng &&
          event.latitude >= minLat &&
          event.latitude <= maxLat
        );
      })
      .map((e) => e.id);

    // Only update if the visible IDs have actually changed
    const visibleIdsKey = visibleIds.sort().join(',');
    if (visibleIdsKey !== prevVisibleIdsRef.current) {
      prevVisibleIdsRef.current = visibleIdsKey;
      onVisibleEventsChange(visibleIds);
    }
  }, [viewState, containerSize, events, onVisibleEventsChange]);

  // Aggregate events by H3 cell at current resolution
  const cellData = useMemo((): CellData[] => {
    const cellMap: Record<string, CellData> = {};
    const field = getH3IndexField() as keyof EventWithPosts;

    for (const event of events) {
      const h3Index = event[field] as string;
      const resolvedIndex = resolveH3Index(h3Index);
      if (!resolvedIndex) continue;

      const existing = cellMap[resolvedIndex];
      if (existing) {
        existing.events.push(event);
        existing.count++;
        existing.totalUrgency += event.urgency_score;
      } else {
        cellMap[resolvedIndex] = {
          h3Index: resolvedIndex,
          events: [event],
          count: 1,
          totalUrgency: event.urgency_score,
        };
      }
    }

    return Object.values(cellMap);
  }, [events, resolveH3Index]);

  // Pan to selected event when selection changes from sidebar
  useEffect(() => {
    if (selectedEventId) {
      const selectedEvent = events.find((e) => e.id === selectedEventId);
      if (selectedEvent?.latitude && selectedEvent?.longitude) {
        setViewState((prev) => ({
          ...prev,
          longitude: selectedEvent.longitude!,
          latitude: selectedEvent.latitude!,
          zoom: Math.max(prev.zoom, 6),
        }));
      }
    }
  }, [selectedEventId, events]);

  const getCellColor = useCallback(
    (cell: CellData): [number, number, number, number] => {
      // Highlight if this cell is selected or contains the selected event
      const isSelected = cell.h3Index === selectedCellId ||
        cell.events.some(e => e.id === selectedEventId);

      // Use total urgency for heat map coloring (capped at 1.0 for single events, can exceed for multiple)
      // Normalize: single event with max urgency = 1.0, multiple high-urgency events can exceed
      const normalizedUrgency = Math.min(cell.totalUrgency, 2) / 2; // Cap at 2 total urgency -> 1.0

      return getHeatMapColor(normalizedUrgency, isSelected);
    },
    [selectedEventId, selectedCellId]
  );

  const layers = useMemo(
    () => [
      new H3HexagonLayer<CellData>({
        id: 'events-h3',
        data: cellData,
        pickable: true,
        filled: true,
        extruded: false,
        getHexagon: (d: CellData) => d.h3Index,
        getFillColor: getCellColor,
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        onClick: (info: PickingInfo<CellData>) => {
          if (info.object) {
            const cell = info.object;
            const eventIds = cell.events.map(e => e.id);
            onCellSelect(cell.h3Index, eventIds);

            // Pan to cell location (use first event's coordinates)
            const firstEvent = cell.events[0];
            if (firstEvent?.latitude && firstEvent?.longitude) {
              setViewState((prev) => ({
                ...prev,
                longitude: firstEvent.longitude!,
                latitude: firstEvent.latitude!,
                zoom: Math.max(prev.zoom, 6),
              }));
            }
          }
        },
        updateTriggers: {
          getFillColor: [selectedEventId, selectedCellId],
          getHexagon: resolution,
        },
      }),
    ],
    [cellData, getCellColor, onCellSelect, selectedEventId, selectedCellId, resolution]
  );

  // Handle clicks outside of cells to deselect
  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (!info.object && (selectedCellId || selectedEventId)) {
        onCellSelect(null, []);
      }
    },
    [selectedCellId, selectedEventId, onCellSelect]
  );

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: '0' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: newViewState }) =>
          setViewState(newViewState as typeof INITIAL_VIEW_STATE)
        }
        layers={layers}
        controller
        onClick={handleClick}
        style={{ position: 'absolute', inset: '0' }}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          projection={{ name: 'mercator' }}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
        </Map>
      </DeckGL>
    </div>
  );
}

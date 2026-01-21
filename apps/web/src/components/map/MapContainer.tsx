'use client';

import { useState, useCallback } from 'react';
import Map, { NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DeckGL from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { useAdaptiveH3, getH3IndexField } from './useAdaptiveH3';
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

// Event type colors
const EVENT_COLORS: Record<string, [number, number, number, number]> = {
  conflict: [239, 68, 68, 200],    // Red
  military: [249, 115, 22, 200],   // Orange
  humanitarian: [234, 179, 8, 200], // Yellow
  political: [59, 130, 246, 200],  // Blue
  protest: [168, 85, 247, 200],    // Purple
  other: [107, 114, 128, 200],     // Gray
};

const SELECTED_COLOR: [number, number, number, number] = [255, 255, 255, 255];

interface MapContainerProps {
  events: EventWithPosts[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
}

export function MapContainer({
  events,
  selectedEventId,
  onEventSelect,
}: MapContainerProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const h3Resolution = useAdaptiveH3(viewState.zoom);

  const getEventColor = useCallback(
    (event: EventWithPosts): [number, number, number, number] => {
      if (event.id === selectedEventId) {
        return SELECTED_COLOR;
      }
      return EVENT_COLORS[event.event_type ?? 'other'] ?? EVENT_COLORS.other;
    },
    [selectedEventId]
  );

  const layers = [
    new H3HexagonLayer({
      id: 'events-h3',
      data: events,
      pickable: true,
      filled: true,
      extruded: false,
      elevationScale: 0,
      getHexagon: (d: EventWithPosts) => {
        const field = getH3IndexField(h3Resolution) as keyof EventWithPosts;
        return d[field] as string;
      },
      getFillColor: getEventColor,
      getLineColor: [255, 255, 255, 100],
      lineWidthMinPixels: 1,
      onClick: (info: PickingInfo<EventWithPosts>) => {
        if (info.object) {
          onEventSelect(info.object.id);
        }
      },
      updateTriggers: {
        getFillColor: selectedEventId,
        getHexagon: h3Resolution,
      },
    }),
  ];

  return (
    <DeckGL
      viewState={viewState}
      onViewStateChange={({ viewState: newViewState }) =>
        setViewState(newViewState as typeof INITIAL_VIEW_STATE)
      }
      layers={layers}
      controller
      style={{ position: 'absolute', inset: '0' }}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
      </Map>
    </DeckGL>
  );
}

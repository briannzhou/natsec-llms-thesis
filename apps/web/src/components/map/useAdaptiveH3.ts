import { useMemo } from 'react';

export type H3Resolution = 4 | 6 | 8;

/**
 * Returns the appropriate H3 resolution based on map zoom level
 * - Zoom < 4: Resolution 4 (country level, ~1000km hexagons)
 * - Zoom 4-6: Resolution 6 (region level, ~30km hexagons)
 * - Zoom >= 7: Resolution 8 (city level, ~1km hexagons)
 */
export function useAdaptiveH3(zoom: number): H3Resolution {
  return useMemo(() => {
    if (zoom < 4) return 4;
    if (zoom < 7) return 6;
    return 8;
  }, [zoom]);
}

export function getH3IndexField(resolution: H3Resolution): string {
  return `h3_index_res${resolution}`;
}

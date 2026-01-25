import { useMemo, useCallback } from 'react';
import { cellToParent } from 'h3-js';

export type H3Resolution = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Maps zoom levels to H3 resolutions.
 * Capped at resolution 5 to keep hexagons visible at high zoom levels.
 */
export function useAdaptiveResolution(zoom: number): H3Resolution {
  return useMemo(() => {
    if (zoom < 3) return 3;
    if (zoom < 5) return 4;
    if (zoom < 7) return 5;
    return 6;
  }, [zoom]);
}

/**
 * Returns a function that converts an H3 index to the appropriate resolution.
 * Uses cellToParent to compute parent hexagons, ensuring consistent positioning.
 */
export function useH3IndexResolver(targetResolution: H3Resolution) {
  return useCallback(
    (h3Index: string | null): string | null => {
      if (!h3Index) return null;
      // Our stored indices are res8 - compute parent if needed
      if (targetResolution >= 8) return h3Index;
      return cellToParent(h3Index, targetResolution);
    },
    [targetResolution]
  );
}

export function getH3IndexField(): string {
  return 'h3_index_res8';
}

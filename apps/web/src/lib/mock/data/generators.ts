// Helper functions for generating realistic mock data

import { latLngToCell } from 'h3-js';

// Location coordinates [latitude, longitude]
const LOCATION_COORDS = {
  // Ukraine locations
  kyiv: [50.450, 30.523] as [number, number],
  kharkiv: [49.993, 36.231] as [number, number],
  zaporizhzhia: [47.839, 35.139] as [number, number],
  bakhmut: [48.595, 37.999] as [number, number],
  odesa: [46.482, 30.723] as [number, number],
  // Venezuela locations
  caracas: [10.491, -66.902] as [number, number],
  maracaibo: [10.654, -71.636] as [number, number],
  valencia: [10.180, -67.996] as [number, number],
  barquisimeto: [10.064, -69.324] as [number, number],
} as const;

// Compute H3 indices dynamically from coordinates
function computeH3Indices(coords: [number, number]) {
  const [lat, lng] = coords;
  return {
    res4: latLngToCell(lat, lng, 4),
    res6: latLngToCell(lat, lng, 6),
    res8: latLngToCell(lat, lng, 8),
    coords,
  };
}

// Generate H3 indices for all locations
export const H3_INDICES = {
  // Ukraine
  kyiv: computeH3Indices(LOCATION_COORDS.kyiv),
  kharkiv: computeH3Indices(LOCATION_COORDS.kharkiv),
  zaporizhzhia: computeH3Indices(LOCATION_COORDS.zaporizhzhia),
  bakhmut: computeH3Indices(LOCATION_COORDS.bakhmut),
  odesa: computeH3Indices(LOCATION_COORDS.odesa),
  // Venezuela
  caracas: computeH3Indices(LOCATION_COORDS.caracas),
  maracaibo: computeH3Indices(LOCATION_COORDS.maracaibo),
  valencia: computeH3Indices(LOCATION_COORDS.valencia),
  barquisimeto: computeH3Indices(LOCATION_COORDS.barquisimeto),
};

export type LocationKey = keyof typeof H3_INDICES;

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateISODate(daysAgo: number = 0, hoursAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

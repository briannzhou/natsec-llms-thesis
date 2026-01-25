// Helper functions for generating realistic mock data

import { latLngToCell } from 'h3-js';

// Location coordinates [latitude, longitude]
const LOCATION_COORDS = {
  ukraine: [48.595, 37.999] as [number, number],   // Bakhmut region
  syria: [35.931, 36.634] as [number, number],     // Idlib region
  sudan: [15.588, 32.534] as [number, number],     // Khartoum
  venezuela: [10.491, -66.902] as [number, number], // Caracas
  myanmar: [16.866, 96.195] as [number, number],   // Yangon
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
  ukraine: computeH3Indices(LOCATION_COORDS.ukraine),
  syria: computeH3Indices(LOCATION_COORDS.syria),
  sudan: computeH3Indices(LOCATION_COORDS.sudan),
  venezuela: computeH3Indices(LOCATION_COORDS.venezuela),
  myanmar: computeH3Indices(LOCATION_COORDS.myanmar),
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

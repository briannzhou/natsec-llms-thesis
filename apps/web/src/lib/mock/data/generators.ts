// Helper functions for generating realistic mock data

// Pre-computed valid H3 indices at different resolutions for various global locations
// These were generated using h3-js to ensure correct hexagon rendering on maps
export const H3_INDICES = {
  // Ukraine - Bakhmut region
  ukraine: {
    res4: '842d5a7ffffffff',
    res6: '862d5a77fffffff',
    res8: '882d5a7699fffff',
    coords: [48.595, 37.999] as [number, number],
  },
  // Syria - Idlib region
  syria: {
    res4: '843269fffffffff',
    res6: '8632697ffffffff',
    res8: '883269767ffffff',
    coords: [35.931, 36.634] as [number, number],
  },
  // Sudan - Khartoum
  sudan: {
    res4: '8427ccbffffffff',
    res6: '8627ccbffffffff',
    res8: '8827ccb6dffffff',
    coords: [15.588, 32.534] as [number, number],
  },
  // Venezuela - Caracas
  venezuela: {
    res4: '844c9cbffffffff',
    res6: '864c9cb7fffffff',
    res8: '884c9cb65ffffff',
    coords: [10.491, -66.902] as [number, number],
  },
  // Myanmar - Yangon
  myanmar: {
    res4: '8430dd7ffffffff',
    res6: '8630dd77fffffff',
    res8: '8830dd7689fffff',
    coords: [16.866, 96.195] as [number, number],
  },
} as const;

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

import h3 from 'h3-js';
import { config } from '../config.js';
import type { GeocodedLocation } from '@event-monitor/shared';

/**
 * Geocode a location string using Mapbox Geocoding API
 */
export async function geocodeLocation(
  locationString: string
): Promise<GeocodedLocation | null> {
  if (!locationString || locationString.toLowerCase() === 'none') {
    return null;
  }

  const token = config.mapbox.geocodingToken;
  const encodedLocation = encodeURIComponent(locationString);

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${token}&limit=1&types=place,region,country`
  );

  if (!response.ok) {
    console.error(`Geocoding failed: ${response.status}`);
    return null;
  }

  const data = await response.json();

  if (!data.features?.length) {
    console.warn(`No geocoding results for: ${locationString}`);
    return null;
  }

  const feature = data.features[0];
  const [lng, lat] = feature.center;

  // Extract country from context
  const country = extractCountry(feature.context, feature.place_type);

  // Compute H3 indices at multiple resolutions
  return {
    locationName: feature.place_name,
    country,
    latitude: lat,
    longitude: lng,
    h3Indices: {
      res4: h3.latLngToCell(lat, lng, 4),
      res6: h3.latLngToCell(lat, lng, 6),
      res8: h3.latLngToCell(lat, lng, 8),
    },
  };
}

/**
 * Extract country from Mapbox geocoding context
 */
function extractCountry(
  context: any[] | undefined,
  placeType: string[] | undefined
): string | null {
  // If the result itself is a country
  if (placeType?.includes('country')) {
    return null; // The location name IS the country
  }

  // Look for country in context
  if (context) {
    for (const item of context) {
      if (item.id?.startsWith('country')) {
        return item.text;
      }
    }
  }

  return null;
}

/**
 * Batch geocode multiple locations
 */
export async function batchGeocodeLocations(
  locations: string[]
): Promise<Map<string, GeocodedLocation | null>> {
  const results = new Map<string, GeocodedLocation | null>();

  for (const location of locations) {
    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));

    const result = await geocodeLocation(location);
    results.set(location, result);
  }

  return results;
}

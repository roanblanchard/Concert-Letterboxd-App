import { Venue } from '../types';

interface PhotonFeatureProperties {
  osm_id: number;
  osm_type: string;
  name?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  street?: string;
  housenumber?: string;
  type?: string;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: PhotonFeatureProperties;
}

interface PhotonResponse {
  features: PhotonFeature[];
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    'addr:city'?: string;
    'addr:state'?: string;
    'addr:country'?: string;
    amenity?: string;
    leisure?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function searchPhotonVenues(
  query: string,
  limit = 8,
  coords?: Coordinates | null
): Promise<Venue[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      trimmed
    )}&limit=${limit}`;

    if (coords) {
      url += `&lat=${coords.latitude}&lon=${coords.longitude}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Photon search failed with status ${response.status}`);
      return [];
    }

    const data: PhotonResponse = await response.json();
    const features = data.features ?? [];

    const venues: Venue[] = [];
    const seen = new Set<string>();

    for (const item of features) {
      const props = item.properties;
      const venueName = props.name;
      if (!venueName) continue;

      const cityOrLocality = props.city || props.town || props.village || props.state || '';
      const stateOrCountry = props.state && props.city ? props.state : (props.country || '');
      
      const locationParts = [cityOrLocality, stateOrCountry].filter(Boolean);
      const city = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown location';

      const key = `${venueName}_${city}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      venues.push({
        id: `photon_${props.osm_type || 'p'}_${props.osm_id || Math.random()}`,
        name: venueName,
        city,
      });
    }

    return venues;
  } catch (error) {
    console.error('Error searching Photon venues:', error);
    return [];
  }
}

/**
 * Queries OpenStreetMap Overpass API for nearby music venues, theatres, concert halls, and arenas within ~25km radius.
 * Falls back to Photon location-biased query if Overpass times out.
 */
export async function fetchNearbyVenues(
  coords: Coordinates,
  radiusMeters = 25000,
  limit = 10
): Promise<Venue[]> {
  const { latitude, longitude } = coords;

  try {
    const overpassQuery = `
      [out:json][timeout:8];
      (
        node["amenity"="music_venue"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="music_venue"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="theatre"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="theatre"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="arts_centre"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="arts_centre"](around:${radiusMeters},${latitude},${longitude});
        node["leisure"="stadium"](around:${radiusMeters},${latitude},${longitude});
        way["leisure"="stadium"](around:${radiusMeters},${latitude},${longitude});
      );
      out center ${limit * 2};
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data: OverpassResponse = await response.json();
      const elements = data.elements ?? [];

      const venues: Venue[] = [];
      const seen = new Set<string>();

      for (const el of elements) {
        const name = el.tags?.name;
        if (!name) continue;

        const city =
          [el.tags?.['addr:city'], el.tags?.['addr:state']].filter(Boolean).join(', ') ||
          'Nearby';

        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        venues.push({
          id: `osm_${el.type}_${el.id}`,
          name,
          city,
        });

        if (venues.length >= limit) break;
      }

      if (venues.length > 0) {
        return venues;
      }
    }
  } catch (err) {
    console.warn('Overpass nearby query error / fallback to Photon:', err);
  }

  // Fallback: Use Photon location bias with common venue terms
  try {
    const fallbackVenues = await searchPhotonVenues('theatre', limit, coords);
    if (fallbackVenues.length > 0) return fallbackVenues;
  } catch {
    // Ignore and return empty
  }

  return [];
}

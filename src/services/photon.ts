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
 * Fetches nearby performance and music venues (theatres, arenas, music halls)
 * using fast location-biased Photon queries.
 */
export async function fetchNearbyVenues(
  coords: Coordinates,
  limit = 10
): Promise<Venue[]> {
  const categories = ['theater', 'amphitheatre', 'arena', 'music hall', 'ballroom', 'hall', 'venue'];

  try {
    const results = await Promise.all(
      categories.map((cat) => searchPhotonVenues(cat, 5, coords))
    );

    const merged: Venue[] = [];
    const seen = new Set<string>();

    for (const list of results) {
      for (const venue of list) {
        const key = venue.name.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(venue);
        }
        if (merged.length >= limit) break;
      }
      if (merged.length >= limit) break;
    }

    return merged;
  } catch (err) {
    console.warn('Error fetching nearby venues via Photon:', err);
    return [];
  }
}

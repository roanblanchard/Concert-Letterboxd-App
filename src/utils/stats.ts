import { Concert } from '../types';
import { getArtistName, getVenue } from '../store/ConcertsContext';

export interface ConcertStats {
  totalShows: number;
  artistCount: number;
  venueCount: number;
  cityCount: number;
  showsThisYear: number;
  topArtist: { name: string; count: number } | null;
  topVenue: { name: string; count: number } | null;
}

export function computeStats(concerts: Concert[]): ConcertStats {
  const currentYear = new Date().getFullYear();

  const artistCounts = new Map<string, number>();
  const venueCounts = new Map<string, number>();
  const cities = new Set<string>();
  let showsThisYear = 0;

  for (const concert of concerts) {
    if (new Date(concert.date).getFullYear() === currentYear) {
      showsThisYear += 1;
    }

    for (const artistId of concert.artistIds) {
      artistCounts.set(artistId, (artistCounts.get(artistId) ?? 0) + 1);
    }

    venueCounts.set(concert.venueId, (venueCounts.get(concert.venueId) ?? 0) + 1);

    const venue = getVenue(concert.venueId);
    if (venue) {
      cities.add(venue.city);
    }
  }

  const topArtistEntry = [...artistCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topVenueEntry = [...venueCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    totalShows: concerts.length,
    artistCount: artistCounts.size,
    venueCount: venueCounts.size,
    cityCount: cities.size,
    showsThisYear,
    topArtist: topArtistEntry
      ? { name: getArtistName(topArtistEntry[0]), count: topArtistEntry[1] }
      : null,
    topVenue: topVenueEntry
      ? { name: getVenue(topVenueEntry[0])?.name ?? 'Unknown Venue', count: topVenueEntry[1] }
      : null,
  };
}

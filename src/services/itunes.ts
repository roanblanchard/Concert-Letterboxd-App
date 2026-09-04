import { Artist } from '../types';

interface ITunesArtistResult {
  artistId: number;
  artistName: string;
  primaryGenreName?: string;
  artistLinkUrl?: string;
}

interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesArtistResult[];
}

export async function searchITunesArtists(query: string, limit = 10): Promise<Artist[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      trimmed
    )}&entity=musicArtist&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`iTunes search failed with status ${response.status}`);
      return [];
    }

    const data: ITunesSearchResponse = await response.json();
    const results = data.results ?? [];

    return results.map((item) => ({
      id: `itunes_${item.artistId}`,
      name: item.artistName,
      genre: item.primaryGenreName,
    }));
  } catch (error) {
    console.error('Error searching iTunes artists:', error);
    return [];
  }
}

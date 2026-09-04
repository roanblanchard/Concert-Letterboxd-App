import { Artist } from '../types';

const SPOTIFY_CLIENT_ID = 'b782944d00684d099c47513b00127386';
const SPOTIFY_CLIENT_SECRET = 'eda591fc6d52407cbd26368cbd786a47';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtistItem {
  id: string;
  name: string;
  genres: string[];
  images: SpotifyImage[];
}

interface SpotifySearchResponse {
  artists?: {
    items: SpotifyArtistItem[];
  };
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt) {
    return cachedAccessToken;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', SPOTIFY_CLIENT_ID);
  params.append('client_secret', SPOTIFY_CLIENT_SECRET);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Spotify access token: ${response.status} ${errorText}`);
  }

  const data: SpotifyTokenResponse = await response.json();
  cachedAccessToken = data.access_token;
  // Expire 60 seconds earlier as a safety buffer
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return cachedAccessToken;
}

function capitalizeGenre(genre: string): string {
  return genre
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function searchSpotifyArtists(query: string, limit = 10): Promise<Artist[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const token = await getAccessToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      trimmed
    )}&type=artist&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn(`Spotify search failed with status ${response.status}`);
      return [];
    }

    const data: SpotifySearchResponse = await response.json();
    const items = data.artists?.items ?? [];

    return items.map((item) => {
      const topGenre = item.genres?.[0] ? capitalizeGenre(item.genres[0]) : undefined;
      const smallestImage = item.images?.[item.images.length - 1]?.url || item.images?.[0]?.url;

      return {
        id: item.id,
        name: item.name,
        genre: topGenre,
        imageUrl: smallestImage,
      };
    });
  } catch (error) {
    console.error('Error searching Spotify artists:', error);
    return [];
  }
}

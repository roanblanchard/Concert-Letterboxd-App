export interface Artist {
  id: string;
  name: string;
  genre?: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
}

export interface Friend {
  id: string;
  name: string;
}

export interface Concert {
  id: string;
  artistIds: string[];
  venueId: string;
  date: string; // ISO date string, e.g. "2026-04-12"
  rating: number; // 1-5
  friendIds: string[];
  notes?: string;
}

export interface FriendConcertPost {
  id: string;
  friendId: string;
  artistIds: string[];
  venueId: string;
  date: string;
  rating: number;
}

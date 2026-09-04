import { Artist, Venue, Friend, Concert, FriendConcertPost } from '../types';

export const mockArtists: Artist[] = [
  { id: 'a1', name: 'The National', genre: 'Indie Rock' },
  { id: 'a2', name: 'Radiohead', genre: 'Alternative' },
  { id: 'a3', name: 'LCD Soundsystem', genre: 'Dance Punk' },
  { id: 'a4', name: 'Phoebe Bridgers', genre: 'Indie Folk' },
  { id: 'a5', name: 'Tame Impala', genre: 'Psychedelic' },
  { id: 'a6', name: 'Fleet Foxes', genre: 'Folk' },
  { id: 'a7', name: 'Vampire Weekend', genre: 'Indie Pop' },
  { id: 'a8', name: 'Arctic Monkeys', genre: 'Rock' },
  { id: 'a9', name: 'Bon Iver', genre: 'Indie Folk' },
  { id: 'a10', name: 'The Strokes', genre: 'Rock' },
];

export const mockVenues: Venue[] = [
  { id: 'v1', name: 'Madison Square Garden', city: 'New York, NY' },
  { id: 'v2', name: 'Brooklyn Steel', city: 'Brooklyn, NY' },
  { id: 'v3', name: 'Beacon Theatre', city: 'New York, NY' },
  { id: 'v4', name: 'The Fillmore', city: 'San Francisco, CA' },
  { id: 'v5', name: 'Red Rocks Amphitheatre', city: 'Morrison, CO' },
  { id: 'v6', name: 'The Anthem', city: 'Washington, DC' },
];

export const mockFriends: Friend[] = [
  { id: 'f1', name: 'Sam Rivera' },
  { id: 'f2', name: 'Jordan Lee' },
  { id: 'f3', name: 'Casey Morgan' },
  { id: 'f4', name: 'Alex Chen' },
];

// The current signed-in user's own concert history (in-memory, editable via Log Concert screen)
export const initialConcerts: Concert[] = [
  {
    id: 'c1',
    artistIds: ['a1'],
    venueId: 'v1',
    date: '2026-01-18',
    rating: 5,
    friendIds: ['f1', 'f2'],
    notes: 'Incredible encore.',
  },
  {
    id: 'c2',
    artistIds: ['a4'],
    venueId: 'v3',
    date: '2025-11-02',
    rating: 4,
    friendIds: ['f3'],
  },
  {
    id: 'c3',
    artistIds: ['a1'],
    venueId: 'v2',
    date: '2025-09-14',
    rating: 5,
    friendIds: [],
  },
  {
    id: 'c4',
    artistIds: ['a8'],
    venueId: 'v5',
    date: '2025-07-20',
    rating: 4,
    friendIds: ['f2', 'f4'],
  },
];

// Static feed of friends' recent concerts, shown on the Home screen
export const friendConcertFeed: FriendConcertPost[] = [
  {
    id: 'fc1',
    friendId: 'f1',
    artistIds: ['a3'],
    venueId: 'v2',
    date: '2026-02-10',
    rating: 5,
  },
  {
    id: 'fc2',
    friendId: 'f2',
    artistIds: ['a7'],
    venueId: 'v6',
    date: '2026-02-05',
    rating: 4,
  },
  {
    id: 'fc3',
    friendId: 'f3',
    artistIds: ['a9'],
    venueId: 'v4',
    date: '2026-01-28',
    rating: 5,
  },
  {
    id: 'fc4',
    friendId: 'f4',
    artistIds: ['a10', 'a6'],
    venueId: 'v1',
    date: '2026-01-15',
    rating: 3,
  },
];

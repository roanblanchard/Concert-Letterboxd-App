import React, { createContext, useContext, useMemo, useState } from 'react';
import { Concert, Artist, Venue } from '../types';
import { initialConcerts, mockArtists, mockVenues } from '../data/mockData';

interface ConcertsContextValue {
  concerts: Concert[];
  artists: Record<string, Artist>;
  venues: Record<string, Venue>;
  addConcert: (concert: Concert, newArtists?: Artist[], newVenue?: Venue) => void;
  registerArtists: (artists: Artist[]) => void;
  registerVenue: (venue: Venue) => void;
  getArtist: (id: string) => Artist | undefined;
  getArtistName: (id: string) => string;
  getVenue: (id: string) => Venue | undefined;
}

const initialArtistMap: Record<string, Artist> = Object.fromEntries(
  mockArtists.map((a) => [a.id, a])
);

const initialVenueMap: Record<string, Venue> = Object.fromEntries(
  mockVenues.map((v) => [v.id, v])
);

// Global fallback registries so synchronous standalone helpers still work
const globalArtistRegistry = new Map<string, Artist>(
  mockArtists.map((a) => [a.id, a])
);

const globalVenueRegistry = new Map<string, Venue>(
  mockVenues.map((v) => [v.id, v])
);

const ConcertsContext = createContext<ConcertsContextValue | undefined>(undefined);

export function ConcertsProvider({ children }: { children: React.ReactNode }) {
  const [concerts, setConcerts] = useState<Concert[]>(initialConcerts);
  const [artists, setArtists] = useState<Record<string, Artist>>(initialArtistMap);
  const [venues, setVenues] = useState<Record<string, Venue>>(initialVenueMap);

  const registerArtists = (newArtists: Artist[]) => {
    newArtists.forEach((a) => globalArtistRegistry.set(a.id, a));
    setArtists((prev) => {
      const next = { ...prev };
      newArtists.forEach((a) => {
        next[a.id] = a;
      });
      return next;
    });
  };

  const registerVenue = (newVenue: Venue) => {
    globalVenueRegistry.set(newVenue.id, newVenue);
    setVenues((prev) => ({
      ...prev,
      [newVenue.id]: newVenue,
    }));
  };

  const addConcert = (concert: Concert, newArtists?: Artist[], newVenue?: Venue) => {
    if (newArtists && newArtists.length > 0) {
      registerArtists(newArtists);
    }
    if (newVenue) {
      registerVenue(newVenue);
    }
    setConcerts((prev) => [concert, ...prev]);
  };

  const getArtist = (id: string): Artist | undefined => {
    return artists[id] ?? globalArtistRegistry.get(id);
  };

  const getArtistName = (id: string): string => {
    return getArtist(id)?.name ?? 'Unknown Artist';
  };

  const getVenueFromStore = (id: string): Venue | undefined => {
    return venues[id] ?? globalVenueRegistry.get(id);
  };

  const value = useMemo(
    () => ({
      concerts,
      artists,
      venues,
      addConcert,
      registerArtists,
      registerVenue,
      getArtist,
      getArtistName,
      getVenue: getVenueFromStore,
    }),
    [concerts, artists, venues]
  );

  return <ConcertsContext.Provider value={value}>{children}</ConcertsContext.Provider>;
}

export function useConcerts() {
  const ctx = useContext(ConcertsContext);
  if (!ctx) {
    throw new Error('useConcerts must be used within a ConcertsProvider');
  }
  return ctx;
}

export function getArtistName(id: string): string {
  return globalArtistRegistry.get(id)?.name ?? 'Unknown Artist';
}

export function getVenue(id: string): Venue | undefined {
  return globalVenueRegistry.get(id);
}

import React, { createContext, useContext, useMemo, useState } from 'react';
import { Concert, Artist } from '../types';
import { initialConcerts, mockArtists, mockVenues } from '../data/mockData';

interface ConcertsContextValue {
  concerts: Concert[];
  artists: Record<string, Artist>;
  addConcert: (concert: Concert, newArtists?: Artist[]) => void;
  registerArtists: (artists: Artist[]) => void;
  getArtist: (id: string) => Artist | undefined;
  getArtistName: (id: string) => string;
}

const initialArtistMap: Record<string, Artist> = Object.fromEntries(
  mockArtists.map((a) => [a.id, a])
);

// Global fallback registry so synchronous standalone helpers still work
const globalArtistRegistry = new Map<string, Artist>(
  mockArtists.map((a) => [a.id, a])
);

const ConcertsContext = createContext<ConcertsContextValue | undefined>(undefined);

export function ConcertsProvider({ children }: { children: React.ReactNode }) {
  const [concerts, setConcerts] = useState<Concert[]>(initialConcerts);
  const [artists, setArtists] = useState<Record<string, Artist>>(initialArtistMap);

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

  const addConcert = (concert: Concert, newArtists?: Artist[]) => {
    if (newArtists && newArtists.length > 0) {
      registerArtists(newArtists);
    }
    setConcerts((prev) => [concert, ...prev]);
  };

  const getArtist = (id: string): Artist | undefined => {
    return artists[id] ?? globalArtistRegistry.get(id);
  };

  const getArtistName = (id: string): string => {
    return getArtist(id)?.name ?? 'Unknown Artist';
  };

  const value = useMemo(
    () => ({
      concerts,
      artists,
      addConcert,
      registerArtists,
      getArtist,
      getArtistName,
    }),
    [concerts, artists]
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

export function getVenue(id: string) {
  return mockVenues.find((v) => v.id === id);
}

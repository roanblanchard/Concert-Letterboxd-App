import React, { createContext, useContext, useMemo, useState } from 'react';
import { Concert } from '../types';
import { initialConcerts, mockArtists, mockVenues } from '../data/mockData';

interface ConcertsContextValue {
  concerts: Concert[];
  addConcert: (concert: Concert) => void;
}

const ConcertsContext = createContext<ConcertsContextValue | undefined>(undefined);

export function ConcertsProvider({ children }: { children: React.ReactNode }) {
  const [concerts, setConcerts] = useState<Concert[]>(initialConcerts);

  const addConcert = (concert: Concert) => {
    setConcerts((prev) => [concert, ...prev]);
  };

  const value = useMemo(() => ({ concerts, addConcert }), [concerts]);

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
  return mockArtists.find((a) => a.id === id)?.name ?? 'Unknown Artist';
}

export function getVenue(id: string) {
  return mockVenues.find((v) => v.id === id);
}

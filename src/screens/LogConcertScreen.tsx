import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { mockArtists, mockVenues, mockFriends } from '../data/mockData';
import { useConcerts } from '../store/ConcertsContext';
import { searchITunesArtists } from '../services/itunes';
import { searchPhotonVenues, fetchNearbyVenues, Coordinates } from '../services/photon';
import { Artist, Venue, Concert } from '../types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LogConcertScreen() {
  const { addConcert } = useConcerts();

  // Artist search state
  const [artistQuery, setArtistQuery] = useState('');
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [artistSearchResults, setArtistSearchResults] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);

  // Venue location & search state
  const [venueQuery, setVenueQuery] = useState('');
  const [isSearchingVenues, setIsSearchingVenues] = useState(false);
  const [venueSearchResults, setVenueSearchResults] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [nearbyVenues, setNearbyVenues] = useState<Venue[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  // Concert details state
  const [date, setDate] = useState(todayIso());
  const [rating, setRating] = useState(0);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Request location & fetch nearby music venues on mount
  useEffect(() => {
    let isMounted = true;

    async function loadNearbyVenues() {
      try {
        setIsLoadingNearby(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setIsLoadingNearby(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords: Coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        if (isMounted) {
          setUserCoords(coords);
        }

        const venues = await fetchNearbyVenues(coords);
        if (isMounted) {
          if (venues.length > 0) {
            setNearbyVenues(venues);
          }
          setIsLoadingNearby(false);
        }
      } catch (err) {
        console.warn('Unable to get user location for nearby venues:', err);
        if (isMounted) {
          setIsLoadingNearby(false);
        }
      }
    }

    loadNearbyVenues();

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced iTunes live artist search
  useEffect(() => {
    const trimmed = artistQuery.trim();
    if (!trimmed) {
      setArtistSearchResults([]);
      setIsSearchingArtists(false);
      return;
    }

    setIsSearchingArtists(true);
    const timeoutId = setTimeout(async () => {
      const results = await searchITunesArtists(trimmed);
      setArtistSearchResults(results);
      setIsSearchingArtists(false);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [artistQuery]);

  // Debounced Photon live venue search with location biasing
  useEffect(() => {
    const trimmed = venueQuery.trim();
    if (!trimmed) {
      setVenueSearchResults([]);
      setIsSearchingVenues(false);
      return;
    }

    setIsSearchingVenues(true);
    const timeoutId = setTimeout(async () => {
      const results = await searchPhotonVenues(trimmed, 8, userCoords);
      setVenueSearchResults(results);
      setIsSearchingVenues(false);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [venueQuery, userCoords]);

  const displayedArtists = useMemo(() => {
    if (artistQuery.trim().length > 0) {
      return artistSearchResults;
    }
    return mockArtists;
  }, [artistQuery, artistSearchResults]);

  const displayedVenues = useMemo(() => {
    if (venueQuery.trim().length > 0) {
      return venueSearchResults;
    }
    if (nearbyVenues.length > 0) {
      return nearbyVenues;
    }
    return mockVenues;
  }, [venueQuery, venueSearchResults, nearbyVenues]);

  function toggleArtist(artist: Artist) {
    setSelectedArtists((prev) => {
      const exists = prev.some((a) => a.id === artist.id);
      if (exists) {
        return prev.filter((a) => a.id !== artist.id);
      }
      return [...prev, artist];
    });
  }

  function selectVenue(venue: Venue) {
    setSelectedVenue((prev) => (prev?.id === venue.id ? null : venue));
  }

  function toggleFriend(id: string) {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function resetForm() {
    setArtistQuery('');
    setArtistSearchResults([]);
    setSelectedArtists([]);
    setVenueQuery('');
    setVenueSearchResults([]);
    setSelectedVenue(null);
    setDate(todayIso());
    setRating(0);
    setSelectedFriendIds([]);
    setNotes('');
  }

  function handleSubmit() {
    if (selectedArtists.length === 0) {
      Alert.alert('Missing artist', 'Please select at least one artist.');
      return;
    }
    if (!selectedVenue) {
      Alert.alert('Missing venue', 'Please select a venue.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Missing rating', 'Please rate the show.');
      return;
    }

    const newConcert: Concert = {
      id: `c${Date.now()}`,
      artistIds: selectedArtists.map((a) => a.id),
      venueId: selectedVenue.id,
      date,
      rating,
      friendIds: selectedFriendIds,
      notes: notes.trim() || undefined,
    };

    addConcert(newConcert, selectedArtists, selectedVenue);
    Alert.alert('Concert logged!', 'Your show has been added to your history.');
    resetForm();
  }

  const selectedArtistIds = selectedArtists.map((a) => a.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Log a Concert</Text>

      {/* Artists Section */}
      <Text style={styles.label}>Artist(s)</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.input, styles.searchInput]}
          placeholder="Search artists..."
          value={artistQuery}
          onChangeText={setArtistQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearchingArtists && (
          <ActivityIndicator size="small" color="#222" style={styles.searchSpinner} />
        )}
      </View>

      {/* Selected artists pill list */}
      {selectedArtists.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedLabel}>Selected ({selectedArtists.length}):</Text>
          <View style={styles.selectedWrap}>
            {selectedArtists.map((artist) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.selectedChip}
                onPress={() => toggleArtist(artist)}
              >
                <Text style={styles.selectedChipText}>{artist.name} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Artist search results / suggestions */}
      <FlatList
        data={displayedArtists}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        ListEmptyComponent={
          !isSearchingArtists && artistQuery.trim() ? (
            <Text style={styles.emptyText}>No artists found.</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const isSelected = selectedArtistIds.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.artistCard, isSelected && styles.artistCardSelected]}
              onPress={() => toggleArtist(item)}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.artistImage} />
              ) : (
                <View style={styles.artistImagePlaceholder}>
                  <Text style={styles.artistInitial}>{item.name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.artistInfo}>
                <Text
                  style={[styles.artistName, isSelected && styles.artistNameSelected]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {item.genre && (
                  <Text
                    style={[styles.artistGenre, isSelected && styles.artistGenreSelected]}
                    numberOfLines={1}
                  >
                    {item.genre}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Venue Section */}
      <View style={styles.venueHeaderRow}>
        <Text style={styles.label}>Venue</Text>
        {!venueQuery.trim() && (
          <Text style={styles.subLabel}>
            {isLoadingNearby
              ? 'Finding nearby venues...'
              : nearbyVenues.length > 0
              ? '📍 Nearby music venues'
              : 'Popular venues'}
          </Text>
        )}
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.input, styles.searchInput]}
          placeholder="Search venues or cities..."
          value={venueQuery}
          onChangeText={setVenueQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearchingVenues && (
          <ActivityIndicator size="small" color="#222" style={styles.searchSpinner} />
        )}
      </View>

      {/* Selected venue preview */}
      {selectedVenue && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedLabel}>Selected Venue:</Text>
          <View style={styles.selectedWrap}>
            <TouchableOpacity
              style={styles.selectedVenueChip}
              onPress={() => setSelectedVenue(null)}
            >
              <Text style={styles.selectedVenueChipText}>
                📍 {selectedVenue.name} ({selectedVenue.city}) ✕
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Venue search results / suggestions */}
      <FlatList
        data={displayedVenues}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        ListEmptyComponent={
          !isSearchingVenues && venueQuery.trim() ? (
            <Text style={styles.emptyText}>No venues found.</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const isSelected = selectedVenue?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.venueCard, isSelected && styles.venueCardSelected]}
              onPress={() => selectVenue(item)}
            >
              <Text style={[styles.venueName, isSelected && styles.venueNameSelected]}>
                {item.name}
              </Text>
              <Text style={[styles.venueCity, isSelected && styles.venueCitySelected]}>
                {item.city}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
      />

      <Text style={styles.label}>Rating</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)}>
            <Text style={styles.star}>{n <= rating ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Who you went with</Text>
      <FlatList
        data={mockFriends}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selectedFriendIds.includes(item.id) && styles.chipSelected]}
            onPress={() => toggleFriend(item.id)}
          >
            <Text
              style={[
                styles.chipText,
                selectedFriendIds.includes(item.id) && styles.chipTextSelected,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.label}>Notes / Setlist</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Optional notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Log Concert</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 6 },
  venueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 6,
  },
  subLabel: { fontSize: 12, color: '#777', fontWeight: '500' },
  searchContainer: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchInput: { paddingRight: 36 },
  searchSpinner: { position: 'absolute', right: 12 },
  selectedSection: { marginTop: 10 },
  selectedLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 4 },
  selectedWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedChip: {
    backgroundColor: '#222',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  selectedChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  selectedVenueChip: {
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  selectedVenueChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  chipRow: { marginTop: 8 },
  venueCard: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    maxWidth: 220,
    justifyContent: 'center',
  },
  venueCardSelected: {
    backgroundColor: '#222',
    borderColor: '#222',
  },
  venueName: { fontSize: 13, fontWeight: '600', color: '#222' },
  venueNameSelected: { color: '#fff' },
  venueCity: { fontSize: 11, color: '#777', marginTop: 2 },
  venueCitySelected: { color: '#ccc' },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    maxWidth: 220,
  },
  artistCardSelected: {
    backgroundColor: '#222',
    borderColor: '#222',
  },
  artistImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  artistImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInitial: { fontSize: 14, fontWeight: '700', color: '#555' },
  artistInfo: { flexShrink: 1 },
  artistName: { fontSize: 13, fontWeight: '600', color: '#222' },
  artistNameSelected: { color: '#fff' },
  artistGenre: { fontSize: 11, color: '#777', marginTop: 1 },
  artistGenreSelected: { color: '#ccc' },
  emptyText: { fontSize: 13, color: '#888', fontStyle: 'italic', paddingVertical: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipSelected: { backgroundColor: '#222', borderColor: '#222' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextSelected: { color: '#fff' },
  starsRow: { flexDirection: 'row' },
  star: { fontSize: 30, marginRight: 6 },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

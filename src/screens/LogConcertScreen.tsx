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
import { mockArtists, mockVenues, mockFriends } from '../data/mockData';
import { useConcerts } from '../store/ConcertsContext';
import { searchITunesArtists } from '../services/itunes';
import { Artist, Concert } from '../types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LogConcertScreen() {
  const { addConcert } = useConcerts();

  const [artistQuery, setArtistQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);

  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [date, setDate] = useState(todayIso());
  const [rating, setRating] = useState(0);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Debounced iTunes live search
  useEffect(() => {
    const trimmed = artistQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      const results = await searchITunesArtists(trimmed);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [artistQuery]);

  const displayedArtists = useMemo(() => {
    if (artistQuery.trim().length > 0) {
      return searchResults;
    }
    return mockArtists;
  }, [artistQuery, searchResults]);

  function toggleArtist(artist: Artist) {
    setSelectedArtists((prev) => {
      const exists = prev.some((a) => a.id === artist.id);
      if (exists) {
        return prev.filter((a) => a.id !== artist.id);
      }
      return [...prev, artist];
    });
  }

  function toggleFriend(id: string) {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function resetForm() {
    setArtistQuery('');
    setSearchResults([]);
    setSelectedArtists([]);
    setSelectedVenueId(null);
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
    if (!selectedVenueId) {
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
      venueId: selectedVenueId,
      date,
      rating,
      friendIds: selectedFriendIds,
      notes: notes.trim() || undefined,
    };

    addConcert(newConcert, selectedArtists);
    Alert.alert('Concert logged!', 'Your show has been added to your history.');
    resetForm();
  }

  const selectedArtistIds = selectedArtists.map((a) => a.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Log a Concert</Text>

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
        {isSearching && (
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
          !isSearching && artistQuery.trim() ? (
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

      <Text style={styles.label}>Venue</Text>
      <FlatList
        data={mockVenues}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selectedVenueId === item.id && styles.chipSelected]}
            onPress={() => setSelectedVenueId(item.id)}
          >
            <Text
              style={[styles.chipText, selectedVenueId === item.id && styles.chipTextSelected]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: '#1DB954',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  selectedChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  chipRow: { marginTop: 8 },
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

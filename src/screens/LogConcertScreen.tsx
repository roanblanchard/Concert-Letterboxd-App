import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { mockArtists, mockVenues, mockFriends } from '../data/mockData';
import { useConcerts } from '../store/ConcertsContext';
import { Concert } from '../types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LogConcertScreen() {
  const { addConcert } = useConcerts();

  const [artistQuery, setArtistQuery] = useState('');
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [date, setDate] = useState(todayIso());
  const [rating, setRating] = useState(0);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const filteredArtists = useMemo(() => {
    if (!artistQuery.trim()) return mockArtists;
    return mockArtists.filter((a) =>
      a.name.toLowerCase().includes(artistQuery.trim().toLowerCase())
    );
  }, [artistQuery]);

  function toggleArtist(id: string) {
    setSelectedArtistIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function toggleFriend(id: string) {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function resetForm() {
    setArtistQuery('');
    setSelectedArtistIds([]);
    setSelectedVenueId(null);
    setDate(todayIso());
    setRating(0);
    setSelectedFriendIds([]);
    setNotes('');
  }

  function handleSubmit() {
    if (selectedArtistIds.length === 0) {
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
      artistIds: selectedArtistIds,
      venueId: selectedVenueId,
      date,
      rating,
      friendIds: selectedFriendIds,
      notes: notes.trim() || undefined,
    };

    addConcert(newConcert);
    Alert.alert('Concert logged!', 'Your show has been added to your history.');
    resetForm();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Log a Concert</Text>

      <Text style={styles.label}>Artist(s)</Text>
      <TextInput
        style={styles.input}
        placeholder="Search artists..."
        value={artistQuery}
        onChangeText={setArtistQuery}
      />
      <FlatList
        data={filteredArtists}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selectedArtistIds.includes(item.id) && styles.chipSelected]}
            onPress={() => toggleArtist(item.id)}
          >
            <Text
              style={[
                styles.chipText,
                selectedArtistIds.includes(item.id) && styles.chipTextSelected,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  chipRow: { marginTop: 4 },
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
  submitButton: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

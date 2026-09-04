import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { friendConcertFeed, mockFriends } from '../data/mockData';
import { getArtistName, getVenue } from '../store/ConcertsContext';
import { FriendConcertPost } from '../types';

function FeedItem({ item }: { item: FriendConcertPost }) {
  const friendName = mockFriends.find((f) => f.id === item.friendId)?.name ?? 'Someone';
  const venue = getVenue(item.venueId);
  const artistNames = item.artistIds.map(getArtistName).join(', ');
  const stars = '⭐'.repeat(item.rating);

  return (
    <View style={styles.card}>
      <Text style={styles.friendName}>{friendName}</Text>
      <Text style={styles.artist}>{artistNames}</Text>
      <Text style={styles.venue}>
        {venue ? `${venue.name} — ${venue.city}` : 'Unknown venue'}
      </Text>
      <Text style={styles.meta}>
        {item.date} {stars}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Friends' Concerts</Text>
      <FlatList
        data={friendConcertFeed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedItem item={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { fontSize: 24, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  friendName: { fontSize: 14, fontWeight: '600', color: '#555' },
  artist: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  venue: { fontSize: 14, color: '#333', marginTop: 2 },
  meta: { fontSize: 13, color: '#777', marginTop: 6 },
});

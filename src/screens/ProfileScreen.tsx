import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useConcerts } from '../store/ConcertsContext';
import { computeStats } from '../utils/stats';

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { concerts } = useConcerts();
  const stats = useMemo(() => computeStats(concerts), [concerts]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Your Profile</Text>
      <Text style={styles.subheader}>🎵 LIVE MUSIC</Text>

      <View style={styles.statsGrid}>
        <StatBox label="Shows" value={stats.totalShows} />
        <StatBox label="Artists" value={stats.artistCount} />
        <StatBox label="Venues" value={stats.venueCount} />
        <StatBox label="Cities" value={stats.cityCount} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{new Date().getFullYear()}</Text>
        <Text style={styles.sectionValue}>{stats.showsThisYear} concerts</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Artist</Text>
        {stats.topArtist ? (
          <Text style={styles.sectionValue}>
            {stats.topArtist.name} — {stats.topArtist.count} show
            {stats.topArtist.count === 1 ? '' : 's'}
          </Text>
        ) : (
          <Text style={styles.sectionEmpty}>No concerts logged yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Venue</Text>
        {stats.topVenue ? (
          <Text style={styles.sectionValue}>
            {stats.topVenue.name} — {stats.topVenue.count} show
            {stats.topVenue.count === 1 ? '' : 's'}
          </Text>
        ) : (
          <Text style={styles.sectionEmpty}>No concerts logged yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: '700' },
  subheader: { fontSize: 14, fontWeight: '600', color: '#777', marginTop: 4, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBox: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase' },
  sectionValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  sectionEmpty: { fontSize: 15, color: '#999', marginTop: 4 },
});

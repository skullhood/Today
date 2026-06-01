import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { TaskCard } from '@/components/TaskCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useStore, type TodayTask } from '@/store';
import { scheduleAlarmsForPendingTasks } from '@/utils/alarm';
import { useTheme } from '@/hooks/use-theme';
import dayjs from 'dayjs';

type Tab = 'pending' | 'completed';

export default function TodayScreen() {
  const router = useRouter();
  const todayTasks = useStore(s => s.todayTasks);
  const completedTodayTasks = useStore(s => s.completedTodayTasks);
  const colors = useTheme();
  const dateLabel = dayjs().format('dddd, MMMM D');
  const [tab, setTab] = useState<Tab>('pending');
  const [query, setQuery] = useState('');

  const tasks = useMemo(() => {
    const base = tab === 'pending' ? todayTasks : completedTodayTasks;
    if (!query.trim()) return base;
    return base.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
  }, [tab, todayTasks, completedTodayTasks, query]);

  const renderItem = useCallback(
    ({ item }: { item: TodayTask }) => (
      <TaskCard
        task={item}
        completed={tab === 'completed'}
        onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
      />
    ),
    [router, tab]
  );

  useEffect(() => {
    scheduleAlarmsForPendingTasks(todayTasks);
  }, [todayTasks]);

  const emptyText = query.trim()
    ? 'No results.'
    : tab === 'pending' ? 'Nothing left to do today.' : 'Nothing completed yet.';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.heading}>Today</ThemedText>
            <ThemedText style={styles.date}>{dateLabel}</ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.backgroundElement }]}
            onPress={() => router.push('/new-task')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.segmented, { backgroundColor: colors.backgroundElement }]}>
          {(['pending', 'completed'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.segment, tab === t && { backgroundColor: colors.background }]}
              onPress={() => { setTab(t); setQuery(''); }}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.segmentText, tab !== t && { opacity: 0.45 }]}>
                {t === 'pending' ? 'Pending' : 'Completed'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'completed' && (
          <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement }]}>
            <MaterialIcons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search completed..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <MaterialIcons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText style={styles.emptyText}>{emptyText}</ThemedText>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 16,
  },
  heading: { fontSize: 34, fontWeight: '700', lineHeight: 44 },
  date: { fontSize: 14, opacity: 0.5, fontWeight: '500' },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  segmentText: { fontSize: 14, fontWeight: '600' },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700', includeFontPadding: false, lineHeight: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  list: { paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 17, opacity: 0.4 },
});

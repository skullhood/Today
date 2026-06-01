import { useMemo, useState, useCallback } from 'react';
import { FlatList, SectionList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { contrastText } from '@/constants/palette';
import { getAllCompletionEntries } from '@/db/completions';
import { exportData } from '@/db/export';
import { useStore } from '@/store';
import { t } from '@/i18n';
import type { CompletionEntry, Task } from '@/db/types';

type LogTab = 'tasks' | 'history';

// ─── Tasks view ──────────────────────────────────────────────────────────────

function TaskRow({ task, onPress, colors }: { task: Task; onPress: () => void; colors: ReturnType<typeof useTheme> }) {
  const text = contrastText(task.color);
  return (
    <TouchableOpacity style={[styles.taskRow, { backgroundColor: task.color }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.taskRowIcon, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
        <MaterialIcons name={task.icon as any} size={22} color={text} />
      </View>
      <ThemedText style={[styles.taskRowName, { color: text }]} numberOfLines={1}>{task.name}</ThemedText>
      {task.retired_at && (
        <View style={[styles.retiredBadge, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
          <ThemedText style={[styles.retiredBadgeText, { color: text }]}>{t.common.retired}</ThemedText>
        </View>
      )}
      <MaterialIcons name="chevron-right" size={18} color={text} style={{ opacity: 0.4 }} />
    </TouchableOpacity>
  );
}

// ─── History (completion log) view ───────────────────────────────────────────

type Section = { title: string; data: CompletionEntry[] };

function dateLabel(iso: string): string {
  const d = dayjs(iso);
  const today = dayjs().startOf('day');
  if (d.isSame(today, 'day')) return t.log.dateLabels.today;
  if (d.isSame(today.subtract(1, 'day'), 'day')) return t.log.dateLabels.yesterday;
  if (d.isAfter(today.subtract(7, 'day'))) return d.format('dddd');
  return d.format('MMMM D, YYYY');
}

function groupByDay(entries: CompletionEntry[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const entry of entries) {
    const label = dateLabel(entry.completed_at);
    if (!current || current.title !== label) { current = { title: label, data: [] }; sections.push(current); }
    current.data.push(entry);
  }
  return sections;
}

function CompletionRow({ entry, onPress }: { entry: CompletionEntry; onPress: () => void }) {
  const text = contrastText(entry.task_color);
  return (
    <TouchableOpacity style={[styles.completionRow, { backgroundColor: entry.task_color }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.completionIcon, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
        <MaterialIcons name={entry.task_icon as any} size={20} color={text} />
      </View>
      <ThemedText style={[styles.completionName, { color: text }]} numberOfLines={1}>{entry.task_name}</ThemedText>
      <ThemedText style={[styles.completionTime, { color: text }]}>{dayjs(entry.completed_at).format('h:mm A')}</ThemedText>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LogScreen() {
  const router = useRouter();
  const colors = useTheme();
  const tasks = useStore(s => s.tasks);

  const [logTab, setLogTab] = useState<LogTab>('tasks');
  const [query, setQuery] = useState('');
  const [completions, setCompletions] = useState<CompletionEntry[]>([]);

  useFocusEffect(useCallback(() => {
    setCompletions(getAllCompletionEntries());
  }, []));

  // Tasks view data — active first, retired after
  const filteredTasks = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? tasks.filter(t => t.name.toLowerCase().includes(q)) : tasks;
  }, [tasks, query]);

  // History view data
  const sections = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = q ? completions.filter(e => e.task_name.toLowerCase().includes(q)) : completions;
    return groupByDay(filtered);
  }, [completions, query]);

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

        <View style={styles.header}>
          <ThemedText style={styles.heading}>{t.log.heading}</ThemedText>
          <TouchableOpacity onPress={exportData} hitSlop={12} style={[styles.exportBtn, { backgroundColor: colors.backgroundElement }]}>
            <MaterialIcons name="ios-share" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Segment */}
        <View style={[styles.segmented, { backgroundColor: colors.backgroundElement }]}>
          {(['tasks', 'history'] as LogTab[]).map(key => (
            <TouchableOpacity
              key={key}
              style={[styles.segment, logTab === key && { backgroundColor: colors.background }]}
              onPress={() => { setLogTab(key); setQuery(''); }}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.segmentText, logTab !== key && { opacity: 0.45 }]}>
                {key === 'tasks' ? t.log.tabs.tasks : t.log.tabs.history}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement }]}>
          <MaterialIcons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={logTab === 'tasks' ? t.log.searchTasks : t.log.searchHistory}
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

        {logTab === 'tasks' ? (
          filteredTasks.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText style={styles.emptyText}>{query ? t.common.noResults : t.log.emptyTasks}</ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredTasks}
              keyExtractor={t => t.id}
              renderItem={({ item }) => (
                <TaskRow
                  task={item}
                  colors={colors}
                  onPress={() => router.push({ pathname: '/history/[id]', params: { id: item.id } })}
                />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : (
          sections.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText style={styles.emptyText}>{query ? t.common.noResults : t.log.emptyHistory}</ThemedText>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={item => item.completion_id}
              renderSectionHeader={({ section }) => (
                <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                  <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                </View>
              )}
              renderItem={({ item }) => (
                <CompletionRow
                  entry={item}
                  onPress={() => router.push({ pathname: '/history/[id]', params: { id: item.task_id } })}
                />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled
            />
          )
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16 },
  header: { paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 34, fontWeight: '700', lineHeight: 44 },
  exportBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', borderRadius: 12, padding: 3, marginBottom: 8 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  segmentText: { fontSize: 14, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  taskRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, gap: 12, marginBottom: 8 },
  taskRowIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskRowName: { flex: 1, fontSize: 15, fontWeight: '600' },
  retiredBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  retiredBadgeText: { fontSize: 11, fontWeight: '700', opacity: 0.7 },
  sectionHeader: { paddingVertical: 8, paddingTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', opacity: 0.4, letterSpacing: 0.5 },
  completionRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, gap: 12, marginBottom: 8 },
  completionIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  completionName: { flex: 1, fontSize: 15, fontWeight: '600' },
  completionTime: { fontSize: 13, opacity: 0.7, flexShrink: 0 },
  list: { paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 17, opacity: 0.4 },
});

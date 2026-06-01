import { useState, useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { ThemedText } from '@/components/themed-text';
import { computeStats, getMonthCompletionMap, isActiveDay } from '@/db/stats';
import { contrastText } from '@/constants/palette';
import { t } from '@/i18n';
import type { HistoryScreenProps } from '../registry';
import type { Task } from '@/db/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 32 - 12) / 7);
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function CalendarMonth({
  task,
  completionMap,
  month,
  accentColor,
  textColor,
}: {
  task: Task;
  completionMap: Record<string, number>;
  month: dayjs.Dayjs;
  accentColor: string;
  textColor: string;
}) {
  const today = dayjs().format('YYYY-MM-DD');
  const startOffset = month.startOf('month').day();
  const daysInMonth = month.daysInMonth();
  const createdDate = dayjs(task.created_at).format('YYYY-MM-DD');

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={calStyles.grid}>
      {DAY_LABELS.map(d => (
        <View key={d} style={calStyles.cell}>
          <ThemedText style={[calStyles.dayLabel, { color: textColor, opacity: 0.5 }]}>{d}</ThemedText>
        </View>
      ))}
      {cells.map((day, i) => {
        if (day === null) return <View key={`empty-${i}`} style={calStyles.cell} />;

        const dateStr = month.date(day).format('YYYY-MM-DD');
        const isFuture = dateStr > today;
        const isBeforeCreated = dateStr < createdDate;
        const active = isActiveDay(task.schedule, month.date(day));
        const count = completionMap[dateStr] ?? 0;
        const done = count >= task.required_count;
        const isToday = dateStr === today;

        return (
          <View key={dateStr} style={calStyles.cell}>
            {isToday && <View style={[calStyles.todayRing, { borderColor: accentColor }]} />}
            <ThemedText
              style={[
                calStyles.dayNum,
                { color: textColor },
                (!active || isBeforeCreated || isFuture) && { opacity: 0.3 },
              ]}
            >
              {day}
            </ThemedText>
            {active && !isBeforeCreated && !isFuture && (
              <View
                style={[
                  calStyles.dot,
                  done
                    ? { backgroundColor: accentColor }
                    : { borderWidth: 1.5, borderColor: textColor, opacity: 0.25 },
                ]}
              >
                {done && <MaterialIcons name="check" size={10} color={contrastText(accentColor)} />}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function StatCard({
  label,
  value,
  textColor,
  bgColor,
}: {
  label: string;
  value: string;
  textColor: string;
  bgColor: string;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: bgColor }]}>
      <ThemedText style={[statStyles.value, { color: textColor }]}>{value}</ThemedText>
      <ThemedText style={[statStyles.label, { color: textColor, opacity: 0.55 }]}>{label}</ThemedText>
    </View>
  );
}

export function SimpleCheckoffHistory({ task, completions, onRetire, onReactivate, onDelete }: HistoryScreenProps) {
  const [month, setMonth] = useState(() => dayjs().startOf('month'));

  const stats = useMemo(() => computeStats(task, completions), [task, completions]);
  const completionMap = useMemo(
    () => getMonthCompletionMap(task, completions, month),
    [task, completions, month]
  );

  const bg = task.color;
  const text = contrastText(bg);
  const cardBg = 'rgba(0,0,0,0.12)';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          <View style={styles.taskHeader}>
            <View style={[styles.iconWrap, { backgroundColor: cardBg }]}>
              <MaterialIcons name={task.icon as any} size={30} color={text} />
            </View>
            <View style={styles.taskNameRow}>
              <ThemedText style={[styles.taskName, { color: text }]}>{task.name}</ThemedText>
              {task.retired_at && (
                <View style={[styles.retiredBadge, { backgroundColor: cardBg }]}>
                  <ThemedText style={[styles.retiredBadgeText, { color: text }]}>{t.common.retired}</ThemedText>
                </View>
              )}
            </View>
            {task.retired_at ? (
              <>
                <TouchableOpacity onPress={onReactivate} hitSlop={12} style={[styles.headerBtn, { backgroundColor: cardBg }]}>
                  <MaterialIcons name="undo" size={20} color={text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} hitSlop={12} style={[styles.headerBtn, { backgroundColor: cardBg }]}>
                  <MaterialIcons name="delete-outline" size={20} color={text} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={onRetire} hitSlop={12} style={[styles.headerBtn, { backgroundColor: cardBg }]}>
                <MaterialIcons name="archive" size={20} color={text} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => setMonth(m => m.subtract(1, 'month'))} hitSlop={12}>
              <MaterialIcons name="chevron-left" size={28} color={text} />
            </TouchableOpacity>
            <ThemedText style={[styles.monthLabel, { color: text }]}>
              {month.format('MMMM YYYY')}
            </ThemedText>
            <TouchableOpacity
              onPress={() => setMonth(m => m.add(1, 'month'))}
              disabled={month.isSame(dayjs().startOf('month'))}
              hitSlop={12}
            >
              <MaterialIcons
                name="chevron-right"
                size={28}
                color={text}
                style={{ opacity: month.isSame(dayjs().startOf('month')) ? 0.3 : 1 }}
              />
            </TouchableOpacity>
          </View>

          <CalendarMonth
            task={task}
            completionMap={completionMap}
            month={month}
            accentColor={text}
            textColor={text}
          />

          <View style={styles.statsGrid}>
            {task.schedule.kind === 'persistent' ? (
              <>
                <StatCard label={t.taskHistory.stats.created} value={dayjs(task.created_at).format('MMM D, YYYY')} textColor={text} bgColor={cardBg} />
                <StatCard
                  label={t.taskHistory.stats.completed}
                  value={completions[0] ? dayjs(completions[0].completed_at).format('MMM D, YYYY') : t.taskHistory.stats.pending}
                  textColor={text} bgColor={cardBg}
                />
                {completions[0] && (
                  <StatCard label={t.taskHistory.stats.time} value={dayjs(completions[0].completed_at).format('h:mm A')} textColor={text} bgColor={cardBg} />
                )}
              </>
            ) : (
              <>
                <StatCard label={t.taskHistory.stats.created} value={dayjs(task.created_at).format('MMM D, YYYY')} textColor={text} bgColor={cardBg} />
                <StatCard label={t.taskHistory.stats.currentStreak} value={`${stats.currentStreak} ${t.taskHistory.daysUnit(stats.currentStreak)}`} textColor={text} bgColor={cardBg} />
                <StatCard label={t.taskHistory.stats.longestStreak} value={`${stats.longestStreak} ${t.taskHistory.daysUnit(stats.longestStreak)}`} textColor={text} bgColor={cardBg} />
                <StatCard label={t.taskHistory.stats.total} value={String(stats.totalCompletions)} textColor={text} bgColor={cardBg} />
                <StatCard label={t.taskHistory.stats.avgPerWeek} value={stats.avgPerWeek.toFixed(1)} textColor={text} bgColor={cardBg} />
                {stats.earliestTime && <StatCard label={t.taskHistory.stats.earliest} value={stats.earliestTime} textColor={text} bgColor={cardBg} />}
                {stats.latestTime && <StatCard label={t.taskHistory.stats.latest} value={stats.latestTime} textColor={text} bgColor={cardBg} />}
                {stats.avgTime && <StatCard label={t.taskHistory.stats.avgTime} value={stats.avgTime} textColor={text} bgColor={cardBg} />}
              </>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28, marginTop: 8 },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  taskNameRow: { flex: 1, gap: 4 },
  taskName: { fontSize: 22, fontWeight: '700' },
  retiredBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  retiredBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, opacity: 0.7 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthLabel: { fontSize: 17, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
});

const calStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dayLabel: { fontSize: 11, fontWeight: '600' },
  dayNum: { fontSize: 14, fontWeight: '500' },
  todayRing: { position: 'absolute', width: CELL_SIZE - 6, height: CELL_SIZE - 6, borderRadius: (CELL_SIZE - 6) / 2, borderWidth: 1.5 },
  dot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 3 },
});

const statStyles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, minWidth: '45%', flex: 1 },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});

import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useStore } from '@/store';
import { CARD_COLORS, TASK_ICONS, randomColor, contrastText, type TaskIcon } from '@/constants/palette';
import { getAllTaskTypes } from '@/task-types/registry';
import { t } from '@/i18n';
import type { Schedule, AlarmConfig } from '@/db/types';

const WEEKDAY_LABELS = t.newTask.weekdays;
type ScheduleKind = 'daily' | 'weekdays' | 'persistent' | 'interval';

// ─── Time helpers ────────────────────────────────────────────────────────────
function to12(h: number) { const v = h % 12; return v === 0 ? 12 : v; }
function isPM(h: number) { return h >= 12; }
function toH24(h12: number, pm: boolean) { return pm ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12); }
function pad(n: number) { return String(n).padStart(2, '0'); }
function totalMin(h: number, m: number) { return h * 60 + m; }

// ─── TimePicker ───────────────────────────────────────────────────────────────
// Minute +/- steps in 5-minute increments.
type TimePickerProps = {
  hour: number;   // 0–23
  minute: number; // 0–59
  minTotalMin?: number; // if set, decrement is blocked at this floor
  onChange: (h: number, m: number) => void;
  inputBg: string;
  inputColor: string;
  accentBg: string;
  accentText: string;
};

function TimePicker({ hour, minute, minTotalMin, onChange, inputBg, inputColor, accentBg, accentText }: TimePickerProps) {
  const h12 = to12(hour);
  const pm = isPM(hour);
  const STEP = 5;

  function changeHour(delta: number) {
    const newH = (hour + delta + 24) % 24;
    onChange(newH, minute);
  }
  function changeMinute(delta: number) {
    let newM = (minute + delta + 60) % 60;
    let newH = hour;
    if (delta < 0 && newM > minute) newH = (hour - 1 + 24) % 24; // wrapped below zero
    if (delta > 0 && newM < minute) newH = (hour + 1) % 24;      // wrapped past 59
    const newTotal = totalMin(newH, newM);
    if (minTotalMin !== undefined && newTotal <= minTotalMin) return;
    onChange(newH, newM);
  }
  function toggleAMPM() {
    const newH = toH24(h12, !pm);
    if (minTotalMin !== undefined && totalMin(newH, minute) <= minTotalMin) return;
    onChange(newH, minute);
  }

  const canDecrHour = minTotalMin === undefined || totalMin((hour - 1 + 24) % 24, minute) > minTotalMin;
  const canDecrMin  = minTotalMin === undefined || totalMin(hour, (minute - STEP + 60) % 60) > minTotalMin;

  return (
    <View style={pickerStyles.row}>
      {/* Hours */}
      <View style={pickerStyles.unit}>
        <TouchableOpacity style={pickerStyles.chevron} onPress={() => changeHour(1)}>
          <MaterialIcons name="expand-less" size={30} color={inputColor} />
        </TouchableOpacity>
        <ThemedText style={pickerStyles.val}>{h12}</ThemedText>
        <TouchableOpacity style={[pickerStyles.chevron, !canDecrHour && pickerStyles.chevronDisabled]} onPress={() => canDecrHour && changeHour(-1)}>
          <MaterialIcons name="expand-more" size={30} color={inputColor} />
        </TouchableOpacity>
      </View>

      <ThemedText style={pickerStyles.sep}>:</ThemedText>

      {/* Minutes */}
      <View style={pickerStyles.unit}>
        <TouchableOpacity style={pickerStyles.chevron} onPress={() => changeMinute(STEP)}>
          <MaterialIcons name="expand-less" size={30} color={inputColor} />
        </TouchableOpacity>
        <ThemedText style={pickerStyles.val}>{pad(minute)}</ThemedText>
        <TouchableOpacity style={[pickerStyles.chevron, !canDecrMin && pickerStyles.chevronDisabled]} onPress={() => canDecrMin && changeMinute(-STEP)}>
          <MaterialIcons name="expand-more" size={30} color={inputColor} />
        </TouchableOpacity>
      </View>

      {/* AM / PM */}
      <TouchableOpacity style={[pickerStyles.ampm, { backgroundColor: accentBg }]} onPress={toggleAMPM}>
        <ThemedText style={[pickerStyles.ampmText, { color: accentText }]}>{pm ? 'PM' : 'AM'}</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  unit: { flexDirection: 'column', alignItems: 'center', gap: 0 },
  chevron: { padding: 2 },
  chevronDisabled: { opacity: 0.25 },
  val: { fontSize: 26, fontWeight: '700', minWidth: 36, textAlign: 'center' },
  sep: { fontSize: 26, fontWeight: '700', marginTop: 28 },
  ampm: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 28 },
  ampmText: { fontSize: 14, fontWeight: '700' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NewTaskScreen() {
  const router = useRouter();
  const addTask = useStore(s => s.addTask);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(randomColor);
  const [icon, setIcon] = useState<TaskIcon>('star');
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [intervalValue, setIntervalValue] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState<'hours' | 'minutes'>('hours');
  const [resetHour, setResetHour] = useState(0);
  const [resetMinute, setResetMinute] = useState(0);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmType, setAlarmType] = useState<'deadline' | 'on_reset'>('deadline');
  const [deadlineHour, setDeadlineHour] = useState(8);
  const [deadlineMinute, setDeadlineMinute] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const taskTypes = getAllTaskTypes();
  const [taskType] = useState(taskTypes[0]?.key ?? 'simple-checkoff');

  const inputBg = isDark ? '#1c1c1e' : '#f2f2f7';
  const inputColor = isDark ? '#fff' : '#000';
  const sectionLabel = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const previewText = contrastText(color);

  const showResetTime = scheduleKind === 'daily' || scheduleKind === 'weekdays';
  const showAlarm = scheduleKind !== 'persistent';
  const canDeadline = scheduleKind === 'daily' || scheduleKind === 'weekdays';
  const showAdvancedSection = showResetTime || showAlarm;

  // Reset time floor for deadline picker (must stay > reset time)
  const resetTotalMin = totalMin(resetHour, resetMinute);

  function handleResetChange(h: number, m: number) {
    setResetHour(h);
    setResetMinute(m);
    // Push deadline up if it would fall at or below the new reset time
    if (totalMin(deadlineHour, deadlineMinute) <= totalMin(h, m)) {
      const bumped = totalMin(h, m) + 60; // 1 hour buffer
      setDeadlineHour(Math.floor(bumped / 60) % 24);
      setDeadlineMinute(bumped % 60);
    }
  }

  function buildSchedule(): Schedule {
    switch (scheduleKind) {
      case 'daily':    return { kind: 'daily' };
      case 'weekdays': return { kind: 'weekdays', days: weekdays.length ? weekdays : [1, 2, 3, 4, 5] };
      case 'persistent': return { kind: 'persistent' };
      case 'interval': return { kind: 'interval', value: intervalValue, unit: intervalUnit };
    }
  }

  function buildAlarm(): AlarmConfig | null {
    if (!alarmEnabled) return null;
    if (alarmType === 'on_reset') return { type: 'on_reset' };
    return { type: 'deadline', deadline_hour: deadlineHour, deadline_minute: deadlineMinute };
  }

  function toggleWeekday(day: number) {
    setWeekdays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  function handleCreate() {
    if (!name.trim()) return;
    addTask({
      name: name.trim(),
      description: description.trim() || null,
      color, icon,
      schedule: buildSchedule(),
      required_count: 1,
      reset_hour: showResetTime ? resetHour : 0,
      reset_minute: showResetTime ? resetMinute : 0,
      alarm_settings: showAlarm ? buildAlarm() : null,
      type: taskType,
      retired_at: null,
    });
    router.back();
  }

  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.preview, { backgroundColor: color }]}>
          <View style={[styles.previewIcon, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
            <MaterialIcons name={icon as any} size={28} color={previewText} />
          </View>
          <ThemedText style={[styles.previewName, { color: previewText }]} numberOfLines={1}>
            {name || t.newTask.placeholders.taskName}
          </ThemedText>
        </View>

        <ThemedText style={[styles.label, { color: sectionLabel }]}>{t.newTask.labels.name}</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: inputColor }]}
          placeholder={t.newTask.placeholders.name}
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
          value={name} onChangeText={setName} returnKeyType="next" autoFocus
        />

        <ThemedText style={[styles.label, { color: sectionLabel }]}>{t.newTask.labels.description}</ThemedText>
        <TextInput
          style={[styles.input, styles.descriptionInput, { backgroundColor: inputBg, color: inputColor }]}
          placeholder={t.newTask.placeholders.description}
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
          value={description} onChangeText={setDescription} multiline blurOnSubmit
        />

        <ThemedText style={[styles.label, { color: sectionLabel }]}>{t.newTask.labels.color}</ThemedText>
        <View style={styles.colorGrid}>
          {CARD_COLORS.map(c => (
            <TouchableOpacity key={c} style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSelected]} onPress={() => setColor(c)} />
          ))}
        </View>

        <ThemedText style={[styles.label, { color: sectionLabel }]}>{t.newTask.labels.icon}</ThemedText>
        <View style={styles.iconGrid}>
          {TASK_ICONS.map(ic => (
            <TouchableOpacity key={ic} style={[styles.iconOption, { backgroundColor: inputBg }, icon === ic && { backgroundColor: color }]} onPress={() => setIcon(ic)}>
              <MaterialIcons name={ic as any} size={22} color={icon === ic ? previewText : inputColor} />
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={[styles.label, { color: sectionLabel }]}>{t.newTask.labels.schedule}</ThemedText>
        <View style={styles.scheduleGrid}>
          {(['daily', 'weekdays', 'persistent', 'interval'] as ScheduleKind[]).map(kind => (
            <TouchableOpacity
              key={kind}
              style={[styles.scheduleOption, { backgroundColor: inputBg }, scheduleKind === kind && { backgroundColor: color }]}
              onPress={() => setScheduleKind(kind)}
            >
              <ThemedText style={[styles.scheduleOptionText, { color: scheduleKind === kind ? previewText : inputColor }]}>
                {kind === 'daily' ? t.newTask.schedule.daily : kind === 'weekdays' ? t.newTask.schedule.days : kind === 'persistent' ? t.newTask.schedule.oneTime : t.newTask.schedule.interval}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {scheduleKind === 'weekdays' && (
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label, i) => (
              <TouchableOpacity key={i} style={[styles.weekdayBtn, { backgroundColor: inputBg }, weekdays.includes(i) && { backgroundColor: color }]} onPress={() => toggleWeekday(i)}>
                <ThemedText style={[styles.weekdayLabel, { color: weekdays.includes(i) ? previewText : inputColor }]}>{label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {scheduleKind === 'persistent' && (
          <ThemedText style={[styles.hint, { color: sectionLabel }]}>
            {t.newTask.hints.persistent}
          </ThemedText>
        )}

        {scheduleKind === 'interval' && (
          <View style={styles.intervalRow}>
            <View style={styles.intervalCounter}>
              <TouchableOpacity style={[styles.counterBtn, { backgroundColor: inputBg }]} onPress={() => setIntervalValue(v => Math.max(1, v - 1))}>
                <MaterialIcons name="remove" size={16} color={inputColor} />
              </TouchableOpacity>
              <ThemedText style={styles.counterVal}>{intervalValue}</ThemedText>
              <TouchableOpacity style={[styles.counterBtn, { backgroundColor: inputBg }]} onPress={() => setIntervalValue(v => v + 1)}>
                <MaterialIcons name="add" size={16} color={inputColor} />
              </TouchableOpacity>
            </View>
            <View style={[styles.unitToggle, { backgroundColor: inputBg }]}>
              {(['hours', 'minutes'] as const).map(unit => (
                <TouchableOpacity key={unit} style={[styles.unitOption, intervalUnit === unit && { backgroundColor: color }]} onPress={() => setIntervalUnit(unit)}>
                  <ThemedText style={[styles.unitText, { color: intervalUnit === unit ? previewText : inputColor }]}>
                    {unit === 'hours' ? t.newTask.interval.hrs : t.newTask.interval.min}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Advanced Time Settings */}
        {showAdvancedSection && (
          <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvanced(v => !v)} activeOpacity={0.7}>
            <ThemedText style={[styles.advancedLabel, { color: sectionLabel }]}>{t.newTask.labels.advancedTime}</ThemedText>
            <MaterialIcons name={showAdvanced ? 'expand-less' : 'expand-more'} size={18} color={sectionLabel} />
          </TouchableOpacity>
        )}

        {showAdvancedSection && showAdvanced && (
          <>
            {showResetTime && (
              <>
                <ThemedText style={[styles.label, { color: sectionLabel }]}>{t.newTask.labels.resetTime}</ThemedText>
                <TimePicker
                  hour={resetHour} minute={resetMinute}
                  onChange={handleResetChange}
                  inputBg={inputBg} inputColor={inputColor}
                  accentBg={color} accentText={previewText}
                />
                <ThemedText style={[styles.hint, { color: sectionLabel }]}>
                  {t.newTask.hints.resetTime}
                </ThemedText>
              </>
            )}

            <View style={styles.alarmHeader}>
              <ThemedText style={[styles.label, { color: sectionLabel, marginTop: 16 }]}>{t.newTask.labels.alarm}</ThemedText>
              <TouchableOpacity
                style={[styles.alarmToggle, { backgroundColor: alarmEnabled ? color : inputBg }]}
                onPress={() => setAlarmEnabled(v => !v)}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.alarmToggleText, { color: alarmEnabled ? previewText : inputColor }]}>
                  {alarmEnabled ? t.newTask.alarm.on : t.newTask.alarm.off}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {alarmEnabled && (
              <>
                {canDeadline && (
                  <View style={[styles.segmented, { backgroundColor: inputBg }]}>
                    {(['deadline', 'on_reset'] as const).map(aType => (
                      <TouchableOpacity key={aType} style={[styles.segment, alarmType === aType && { backgroundColor: color }]} onPress={() => setAlarmType(aType)}>
                        <ThemedText style={[styles.segmentText, { color: alarmType === aType ? previewText : inputColor }]}>
                          {aType === 'deadline' ? t.newTask.alarm.deadline : t.newTask.alarm.onReset}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {(alarmType === 'on_reset' || !canDeadline) && (
                  <ThemedText style={[styles.hint, { color: sectionLabel }]}>
                    {scheduleKind === 'interval'
                      ? t.newTask.hints.intervalOnReset
                      : t.newTask.hints.onResetAlarm}
                  </ThemedText>
                )}

                {alarmType === 'deadline' && canDeadline && (
                  <>
                    <ThemedText style={[styles.label, { color: sectionLabel }]}>{t.newTask.labels.deadlineTime}</ThemedText>
                    <TimePicker
                      hour={deadlineHour} minute={deadlineMinute}
                      minTotalMin={resetTotalMin}
                      onChange={(h, m) => { setDeadlineHour(h); setDeadlineMinute(m); }}
                      inputBg={inputBg} inputColor={inputColor}
                      accentBg={color} accentText={previewText}
                    />
                    <ThemedText style={[styles.hint, { color: sectionLabel }]}>
                      {t.newTask.hints.deadlineTime}
                    </ThemedText>
                  </>
                )}
              </>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: color, opacity: name.trim() ? 1 : 0.4 }]}
          onPress={handleCreate}
          disabled={!name.trim()}
          activeOpacity={0.85}
        >
          <ThemedText style={[styles.createText, { color: previewText }]}>{t.newTask.createButton}</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48, gap: 8 },
  preview: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, gap: 14, marginBottom: 16 },
  previewIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 17, fontWeight: '600', flex: 1 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 12, marginBottom: 6 },
  input: { borderRadius: 12, padding: 14, fontSize: 17 },
  descriptionInput: { minHeight: 80, textAlignVertical: 'top' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 38, height: 38, borderRadius: 19 },
  colorSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.1 }] },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scheduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scheduleOption: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  scheduleOptionText: { fontSize: 14, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  weekdayBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  weekdayLabel: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  intervalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  intervalCounter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 22, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  unitToggle: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 3 },
  unitOption: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 7 },
  unitText: { fontSize: 14, fontWeight: '600' },
  advancedToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingVertical: 4 },
  advancedLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  alarmHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alarmToggle: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  alarmToggleText: { fontSize: 14, fontWeight: '600' },
  segmented: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentText: { fontSize: 13, fontWeight: '600' },
  createBtn: { borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 24 },
  createText: { fontSize: 17, fontWeight: '700' },
});

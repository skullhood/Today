import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import type { Task } from '@/db/types';

const ACTION_SET_ALARM = 'android.intent.action.SET_ALARM';
const EXTRA_HOUR      = 'android.intent.extra.alarm.HOUR';
const EXTRA_MINUTES   = 'android.intent.extra.alarm.MINUTES';
const EXTRA_MESSAGE   = 'android.intent.extra.alarm.MESSAGE';
const EXTRA_SKIP_UI   = 'android.intent.extra.alarm.SKIP_UI';
const EXTRA_VIBRATE   = 'android.intent.extra.alarm.VIBRATE';

// Tracks which calendar-task alarms have been scheduled today.
// Key: `${taskId}-${YYYY-MM-DD}`
const scheduled = new Set<string>();

async function fireIntent(hour: number, minute: number, label: string): Promise<void> {
  const extra = {
    [EXTRA_HOUR]:    hour,
    [EXTRA_MINUTES]: minute,
    [EXTRA_MESSAGE]: label,
    [EXTRA_VIBRATE]: true,
  };
  try {
    await IntentLauncher.startActivityAsync(ACTION_SET_ALARM, {
      extra: { ...extra, [EXTRA_SKIP_UI]: true },
    });
  } catch {
    await IntentLauncher.startActivityAsync(ACTION_SET_ALARM, { extra });
  }
}

// Called when pending tasks load — schedules deadline/on-reset alarms for calendar tasks.
// Interval tasks are intentionally excluded; their alarm is set on completion instead.
export async function scheduleAlarmsForPendingTasks(tasks: Task[]): Promise<void> {
  if (Platform.OS !== 'android') return;

  for (const task of tasks) {
    if (!task.alarm_settings) continue;
    if (task.schedule.kind === 'interval') continue; // handled in scheduleIntervalAlarm

    const key = `${task.id}-${new Date().toISOString().slice(0, 10)}`;
    if (scheduled.has(key)) continue;
    scheduled.add(key);

    const { type, deadline_hour, deadline_minute } = task.alarm_settings;
    const hour   = type === 'deadline' ? (deadline_hour   ?? 8) : task.reset_hour;
    const minute = type === 'deadline' ? (deadline_minute ?? 0) : (task.reset_minute ?? 0);

    try {
      await fireIntent(hour, minute, task.name);
    } catch {
      scheduled.delete(key);
    }
  }
}

// Called on interval task completion — sets alarm for now + interval.
export async function scheduleIntervalAlarm(task: Task): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!task.alarm_settings || task.alarm_settings.type !== 'on_reset') return;
  if (task.schedule.kind !== 'interval') return;

  const { value, unit } = task.schedule;
  const ms = unit === 'hours' ? value * 3_600_000 : value * 60_000;
  const trigger = new Date(Date.now() + ms);

  try {
    await fireIntent(trigger.getHours(), trigger.getMinutes(), task.name);
  } catch { /* silent */ }
}

export function clearAlarmTracking(taskId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  scheduled.delete(`${taskId}-${today}`);
}

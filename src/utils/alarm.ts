import { Platform, ToastAndroid } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import type { Task } from '@/db/types';

const ACTION_SET_ALARM = 'android.intent.action.SET_ALARM';
const EXTRA_HOUR      = 'android.intent.extra.alarm.HOUR';
const EXTRA_MINUTES   = 'android.intent.extra.alarm.MINUTES';
const EXTRA_MESSAGE   = 'android.intent.extra.alarm.MESSAGE';
const EXTRA_SKIP_UI   = 'android.intent.extra.alarm.SKIP_UI';
const EXTRA_VIBRATE   = 'android.intent.extra.alarm.VIBRATE';

// Tracks deadline alarms already scheduled today. Key: `${taskId}-${YYYY-MM-DD}`
const scheduledDeadlines = new Set<string>();

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

// Calculates when this task will next be available after completion.
function getNextResetDate(task: Task): Date | null {
  const now = new Date();

  if (task.schedule.kind === 'interval') {
    const { value, unit } = task.schedule;
    return new Date(now.getTime() + (unit === 'hours' ? value * 3_600_000 : value * 60_000));
  }

  if (task.schedule.kind === 'daily') {
    const d = new Date();
    d.setHours(task.reset_hour, task.reset_minute ?? 0, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  }

  if (task.schedule.kind === 'weekdays') {
    const { days } = task.schedule;
    for (let i = 0; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(task.reset_hour, task.reset_minute ?? 0, 0, 0);
      if (i === 0 && d <= now) continue;
      if (days.includes(d.getDay())) return d;
    }
  }

  return null;
}

// Called via setTimeout after router.back() on task completion.
// Handles all on_reset alarm types — fires when the task will next be available.
export async function scheduleOnResetAlarm(task: Task): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!task.alarm_settings || task.alarm_settings.type !== 'on_reset') return;
  if (task.schedule.kind === 'persistent') return;

  const next = getNextResetDate(task);
  if (!next) return;

  try {
    await fireIntent(next.getHours(), next.getMinutes(), task.name);
    ToastAndroid.show(
      `Alarm set for ${next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      ToastAndroid.SHORT
    );
  } catch {
    ToastAndroid.show('Could not set alarm', ToastAndroid.SHORT);
  }
}

// Called from useEffect when pending tasks load — deadline alarms only.
// On-reset alarms are handled at completion time via scheduleOnResetAlarm.
export async function scheduleAlarmsForPendingTasks(tasks: Task[]): Promise<void> {
  if (Platform.OS !== 'android') return;

  for (const task of tasks) {
    if (!task.alarm_settings || task.alarm_settings.type !== 'deadline') continue;

    const key = `${task.id}-${new Date().toISOString().slice(0, 10)}`;
    if (scheduledDeadlines.has(key)) continue;
    scheduledDeadlines.add(key);

    try {
      await fireIntent(
        task.alarm_settings.deadline_hour ?? 8,
        task.alarm_settings.deadline_minute ?? 0,
        task.name
      );
    } catch {
      scheduledDeadlines.delete(key);
    }
  }
}

export function clearAlarmTracking(taskId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  scheduledDeadlines.delete(`${taskId}-${today}`);
}

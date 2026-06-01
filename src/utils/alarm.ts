import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import type { Task } from '@/db/types';

const ACTION_SET_ALARM = 'android.intent.action.SET_ALARM';
const EXTRA_HOUR      = 'android.intent.extra.alarm.HOUR';
const EXTRA_MINUTES   = 'android.intent.extra.alarm.MINUTES';
const EXTRA_MESSAGE   = 'android.intent.extra.alarm.MESSAGE';
const EXTRA_SKIP_UI   = 'android.intent.extra.alarm.SKIP_UI';
const EXTRA_VIBRATE   = 'android.intent.extra.alarm.VIBRATE';

// Tracks which alarms have been scheduled this app session to avoid duplicates.
// Key format: `${taskId}-${YYYY-MM-DD}` for calendar tasks, `${taskId}-interval` for interval tasks.
const scheduled = new Set<string>();

function alarmKey(task: Task): string {
  if (task.schedule.kind === 'interval') return `${task.id}-interval`;
  return `${task.id}-${new Date().toISOString().slice(0, 10)}`;
}

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
    // SKIP_UI unsupported — open Clock UI as fallback
    await IntentLauncher.startActivityAsync(ACTION_SET_ALARM, { extra });
  }
}

export async function scheduleAlarmsForPendingTasks(tasks: Task[]): Promise<void> {
  if (Platform.OS !== 'android') return;

  for (const task of tasks) {
    if (!task.alarm_settings) continue;

    const key = alarmKey(task);
    if (scheduled.has(key)) continue;
    scheduled.add(key);

    const { type, deadline_hour, deadline_minute } = task.alarm_settings;
    const hour   = type === 'deadline' ? (deadline_hour   ?? 8) : task.reset_hour;
    const minute = type === 'deadline' ? (deadline_minute ?? 0) : (task.reset_minute ?? 0);

    try {
      await fireIntent(hour, minute, task.name);
    } catch {
      scheduled.delete(key); // allow retry on next refresh
    }
  }
}

// Call when an interval task is completed so its alarm re-schedules next time it appears.
export function clearAlarmTracking(taskId: string): void {
  scheduled.delete(`${taskId}-interval`);
}

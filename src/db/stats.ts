import dayjs from 'dayjs';
import type { Task, Completion, Schedule } from './types';

export type TaskStats = {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  avgPerWeek: number;
  earliestTime: string | null;
  latestTime: string | null;
  avgTime: string | null;
};

function isActiveDay(schedule: Schedule, date: dayjs.Dayjs): boolean {
  switch (schedule.kind) {
    case 'daily': return true;
    case 'persistent': return true;
    case 'interval': return true;
    case 'weekdays': return schedule.days.includes(date.day());
  }
}

function completionsOnDay(
  completions: Completion[],
  date: dayjs.Dayjs,
  resetHour: number
): number {
  const start = date.startOf('day').add(resetHour, 'hour');
  const end = start.add(1, 'day');
  return completions.filter(c => {
    const t = dayjs(c.completed_at);
    return !t.isBefore(start) && t.isBefore(end);
  }).length;
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = Math.round(totalMinutes % 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function computeStats(task: Task, completions: Completion[]): TaskStats {
  const totalCompletions = completions.length;

  // Time-of-day stats
  const minutesOfDay = completions.map(c => {
    const t = dayjs(c.completed_at);
    return t.hour() * 60 + t.minute();
  });

  const earliestTime = minutesOfDay.length
    ? formatMinutes(Math.min(...minutesOfDay))
    : null;
  const latestTime = minutesOfDay.length
    ? formatMinutes(Math.max(...minutesOfDay))
    : null;
  const avgTime = minutesOfDay.length
    ? formatMinutes(minutesOfDay.reduce((a, b) => a + b, 0) / minutesOfDay.length)
    : null;

  // Streak calculation — walk backwards from today
  const today = dayjs().startOf('day');
  const createdAt = dayjs(task.created_at).startOf('day');

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  // Walk every day from created_at to today
  const totalDays = today.diff(createdAt, 'day') + 1;
  let hitToday = false;

  for (let i = 0; i < totalDays; i++) {
    const day = createdAt.add(i, 'day');
    if (!isActiveDay(task.schedule, day)) continue;

    const count = completionsOnDay(completions, day, task.reset_hour);
    const done = count >= task.required_count;

    if (done) {
      runningStreak++;
      if (runningStreak > longestStreak) longestStreak = runningStreak;
    } else {
      // Only break current streak if the day is in the past (not today)
      if (day.isBefore(today)) {
        runningStreak = 0;
      }
    }

    if (day.isSame(today)) hitToday = true;
  }

  currentStreak = runningStreak;

  // Avg per week: total completions / weeks since created
  const weeksSinceCreated = Math.max(1, today.diff(createdAt, 'day') / 7);
  const avgPerWeek = totalCompletions / weeksSinceCreated;

  return {
    totalCompletions,
    currentStreak,
    longestStreak,
    avgPerWeek,
    earliestTime,
    latestTime,
    avgTime,
  };
}

export function getMonthCompletionMap(
  task: Task,
  completions: Completion[],
  month: dayjs.Dayjs
): Record<string, number> {
  const map: Record<string, number> = {};
  const daysInMonth = month.daysInMonth();
  for (let d = 1; d <= daysInMonth; d++) {
    const day = month.date(d);
    const key = day.format('YYYY-MM-DD');
    map[key] = completionsOnDay(completions, day, task.reset_hour);
  }
  return map;
}

export { isActiveDay };

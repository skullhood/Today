import { create } from 'zustand';
import dayjs from 'dayjs';
import { getAllTasks, createTask, deleteTask, retireTask, reactivateTask, type TaskCreate } from '@/db/tasks';
import { getCompletionCountSince, getCompletionsForTask, getLastCompletion, addCompletion, deleteLastCompletion } from '@/db/completions';
import { clearAlarmTracking } from '@/utils/alarm';
import type { Task, Completion, Schedule } from '@/db/types';

export type TodayTask = Task & { completionsToday: number };

const EPOCH = '1970-01-01T00:00:00.000Z';

type Store = {
  tasks: Task[];
  todayTasks: TodayTask[];
  completedTodayTasks: TodayTask[];
  initialized: boolean;
  init: () => void;
  refresh: () => void;
  addTask: (input: TaskCreate) => void;
  removeTask: (id: string) => void;
  retireTask: (id: string) => void;
  reactivateTask: (id: string) => void;
  completeTask: (taskId: string, data?: Record<string, unknown>) => void;
  uncompleteTask: (taskId: string) => void;
  getTaskCompletions: (taskId: string) => Completion[];
};

function getPeriodStart(resetHour: number, resetMinute = 0): string {
  const now = dayjs();
  let start = now.startOf('day').add(resetHour, 'hour').add(resetMinute, 'minute');
  if (now.isBefore(start)) start = start.subtract(1, 'day');
  return start.toISOString();
}

function intervalMs(schedule: Extract<Schedule, { kind: 'interval' }>): number {
  return schedule.unit === 'hours'
    ? schedule.value * 3_600_000
    : schedule.value * 60_000;
}

function isActiveToday(schedule: Schedule): boolean {
  if (schedule.kind === 'weekdays') return schedule.days.includes(dayjs().day());
  return true;
}

function computeTodayBuckets(tasks: Task[]): {
  todayTasks: TodayTask[];
  completedTodayTasks: TodayTask[];
} {
  const todayTasks: TodayTask[] = [];
  const completedTodayTasks: TodayTask[] = [];

  for (const task of tasks) {
    if (task.retired_at) continue;

    if (task.schedule.kind === 'interval') {
      const ms = intervalMs(task.schedule);
      const last = getLastCompletion(task.id);
      if (!last) {
        todayTasks.push({ ...task, completionsToday: 0 });
      } else {
        const elapsed = Date.now() - new Date(last.completed_at).getTime();
        if (elapsed >= ms) {
          todayTasks.push({ ...task, completionsToday: 0 });
        } else {
          completedTodayTasks.push({ ...task, completionsToday: 1 });
        }
      }
      continue;
    }

    if (task.schedule.kind === 'persistent') {
      const totalEver = getCompletionCountSince(task.id, EPOCH);
      if (totalEver < task.required_count) {
        todayTasks.push({ ...task, completionsToday: 0 });
      } else {
        // Completed — only surface in completedToday on the day it was done
        const since = getPeriodStart(task.reset_hour, task.reset_minute);
        const completedInPeriod = getCompletionCountSince(task.id, since);
        if (completedInPeriod > 0) {
          completedTodayTasks.push({ ...task, completionsToday: totalEver });
        }
        // Before today: gone from Today entirely, lives only in History
      }
      continue;
    }

    if (!isActiveToday(task.schedule)) continue;

    const since = getPeriodStart(task.reset_hour, task.reset_minute);
    const completionsToday = getCompletionCountSince(task.id, since);

    if (completionsToday >= task.required_count) {
      completedTodayTasks.push({ ...task, completionsToday });
    } else {
      todayTasks.push({ ...task, completionsToday });
    }
  }

  return { todayTasks, completedTodayTasks };
}

export const useStore = create<Store>((set, get) => ({
  tasks: [],
  todayTasks: [],
  completedTodayTasks: [],
  initialized: false,

  init() {
    const tasks = getAllTasks();
    set({ tasks, ...computeTodayBuckets(tasks), initialized: true });
  },

  refresh() {
    const tasks = getAllTasks();
    set({ tasks, ...computeTodayBuckets(tasks) });
  },

  addTask(input) {
    const task = createTask(input);
    const tasks = [...get().tasks, task];
    set({ tasks, ...computeTodayBuckets(tasks) });
  },

  removeTask(id) {
    deleteTask(id);
    const tasks = get().tasks.filter(t => t.id !== id);
    set({ tasks, ...computeTodayBuckets(tasks) });
  },

  retireTask(id) {
    retireTask(id);
    const tasks = get().tasks.map(t =>
      t.id === id ? { ...t, retired_at: new Date().toISOString() } : t
    );
    set({ tasks, ...computeTodayBuckets(tasks) });
  },

  reactivateTask(id) {
    reactivateTask(id);
    const tasks = get().tasks.map(t =>
      t.id === id ? { ...t, retired_at: null } : t
    );
    set({ tasks, ...computeTodayBuckets(tasks) });
  },

  completeTask(taskId, data) {
    addCompletion(taskId, data);
    clearAlarmTracking(taskId);
    get().refresh();
  },

  uncompleteTask(taskId) {
    const task = get().tasks.find(t => t.id === taskId);
    const since = getPeriodStart(task?.reset_hour ?? 0, task?.reset_minute ?? 0);
    deleteLastCompletion(taskId, since);
    get().refresh();
  },

  getTaskCompletions(taskId) {
    return getCompletionsForTask(taskId);
  },
}));

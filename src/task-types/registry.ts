import type React from 'react';
import type { Task, Completion } from '@/db/types';

export type DetailScreenProps = {
  task: Task;
  completions: Completion[];
  completionsToday: number;
  onComplete: (data?: Record<string, unknown>) => void;
  onUncomplete: () => void;
  onRetire: () => void;
};

export type HistoryScreenProps = {
  task: Task;
  completions: Completion[];
  onRetire: () => void;
  onReactivate: () => void;
  onDelete: () => void;
};

export type TaskTypeDefinition = {
  key: string;
  label: string;
  DetailScreen: React.ComponentType<DetailScreenProps>;
  HistoryScreen: React.ComponentType<HistoryScreenProps>;
};

const registry = new Map<string, TaskTypeDefinition>();

export function registerTaskType(def: TaskTypeDefinition) {
  registry.set(def.key, def);
}

export function getTaskType(key: string): TaskTypeDefinition | undefined {
  return registry.get(key);
}

export function getAllTaskTypes(): TaskTypeDefinition[] {
  return Array.from(registry.values());
}

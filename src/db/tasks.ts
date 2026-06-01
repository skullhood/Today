import { db } from './index';
import type { Task, TaskRow } from './types';

function rowToTask(row: TaskRow): Task {
  return {
    ...row,
    schedule: JSON.parse(row.schedule),
    reset_minute: row.reset_minute ?? 0,
    alarm_settings: row.alarm_settings ? JSON.parse(row.alarm_settings) : null,
  };
}

export function getAllTasks(): Task[] {
  return db.getAllSync<TaskRow>('SELECT * FROM tasks ORDER BY created_at ASC').map(rowToTask);
}

export function getTaskById(id: string): Task | null {
  const row = db.getFirstSync<TaskRow>('SELECT * FROM tasks WHERE id = ?', [id]);
  return row ? rowToTask(row) : null;
}

export type TaskCreate = Omit<Task, 'id' | 'created_at'>;

export function createTask(input: TaskCreate): Task {
  const id = generateId();
  const created_at = new Date().toISOString();
  db.runSync(
    `INSERT INTO tasks
       (id, name, color, icon, description, schedule, required_count,
        reset_hour, reset_minute, alarm_settings, type, created_at, retired_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, input.name, input.color, input.icon, input.description ?? null,
      JSON.stringify(input.schedule), input.required_count,
      input.reset_hour, input.reset_minute ?? 0,
      input.alarm_settings ? JSON.stringify(input.alarm_settings) : null,
      input.type, created_at, input.retired_at ?? null,
    ]
  );
  return { ...input, id, created_at };
}

export function deleteTask(id: string) {
  db.runSync('DELETE FROM tasks WHERE id = ?', [id]);
}

export function retireTask(id: string) {
  db.runSync('UPDATE tasks SET retired_at = ? WHERE id = ?', [new Date().toISOString(), id]);
}

export function reactivateTask(id: string) {
  db.runSync('UPDATE tasks SET retired_at = NULL WHERE id = ?', [id]);
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

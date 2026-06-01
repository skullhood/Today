import { db } from './index';
import type { Completion, CompletionEntry } from './types';

export function getLastCompletion(taskId: string): Completion | null {
  return db.getFirstSync<Completion>(
    'SELECT * FROM completions WHERE task_id = ? ORDER BY completed_at DESC LIMIT 1',
    [taskId]
  ) ?? null;
}

export function getCompletionsForTask(taskId: string): Completion[] {
  return db.getAllSync<Completion>(
    'SELECT * FROM completions WHERE task_id = ? ORDER BY completed_at DESC',
    [taskId]
  );
}

export function getCompletionCountSince(taskId: string, since: string): number {
  const result = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM completions WHERE task_id = ? AND completed_at >= ?',
    [taskId, since]
  );
  return result?.count ?? 0;
}

export function getAllCompletionEntries(): CompletionEntry[] {
  return db.getAllSync<CompletionEntry>(`
    SELECT
      c.id        AS completion_id,
      c.completed_at,
      t.id        AS task_id,
      t.name      AS task_name,
      t.color     AS task_color,
      t.icon      AS task_icon,
      t.type      AS task_type
    FROM completions c
    JOIN tasks t ON c.task_id = t.id
    ORDER BY c.completed_at DESC
  `);
}

export function addCompletion(taskId: string, data?: Record<string, unknown>): Completion {
  const id = generateId();
  const completed_at = new Date().toISOString();
  const dataStr = data ? JSON.stringify(data) : null;
  db.runSync(
    'INSERT INTO completions (id, task_id, completed_at, data) VALUES (?, ?, ?, ?)',
    [id, taskId, completed_at, dataStr]
  );
  return { id, task_id: taskId, completed_at, data: dataStr };
}

export function deleteLastCompletion(taskId: string, since: string) {
  db.runSync(
    `DELETE FROM completions WHERE id = (
      SELECT id FROM completions WHERE task_id = ? AND completed_at >= ?
      ORDER BY completed_at DESC LIMIT 1
    )`,
    [taskId, since]
  );
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

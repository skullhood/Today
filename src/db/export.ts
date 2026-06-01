import { writeAsStringAsync, cacheDirectory, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { db } from './index';
import type { TaskRow, Completion } from './types';

export async function exportData() {
  const taskRows = db.getAllSync<TaskRow>('SELECT * FROM tasks ORDER BY created_at ASC');
  const completionRows = db.getAllSync<Completion>('SELECT * FROM completions ORDER BY completed_at ASC');

  const completionsByTask = new Map<string, Completion[]>();
  for (const c of completionRows) {
    const arr = completionsByTask.get(c.task_id) ?? [];
    arr.push(c);
    completionsByTask.set(c.task_id, arr);
  }

  const payload = {
    exported_at: new Date().toISOString(),
    tasks: taskRows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      description: row.description,
      schedule: JSON.parse(row.schedule),
      required_count: row.required_count,
      reset_hour: row.reset_hour,
      type: row.type,
      created_at: row.created_at,
      completions: (completionsByTask.get(row.id) ?? []).map(c => ({
        id: c.id,
        completed_at: c.completed_at,
        data: c.data ? JSON.parse(c.data) : null,
      })),
    })),
  };

  const path = `${cacheDirectory}today-export.json`;
  await writeAsStringAsync(path, JSON.stringify(payload, null, 2), { encoding: EncodingType.UTF8 });
  await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export Today data' });
}

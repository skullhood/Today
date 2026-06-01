export type Schedule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] }                           // 0=Sun..6=Sat
  | { kind: 'persistent' }                                         // stays until ever completed
  | { kind: 'interval'; value: number; unit: 'hours' | 'minutes' }; // repeats every N hours/minutes

export type AlarmConfig = {
  type: 'deadline' | 'on_reset';
  deadline_hour?: number;
  deadline_minute?: number;
};

export type Task = {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  schedule: Schedule;
  required_count: number;
  reset_hour: number;
  reset_minute: number;
  alarm_settings: AlarmConfig | null;
  type: string;
  created_at: string;
  retired_at: string | null;
};

export type TaskRow = Omit<Task, 'schedule' | 'alarm_settings'> & {
  schedule: string;
  alarm_settings: string | null;
};

export type Completion = {
  id: string;
  task_id: string;
  completed_at: string;
  data: string | null;
};

export type CompletionEntry = {
  completion_id: string;
  completed_at: string;
  task_id: string;
  task_name: string;
  task_color: string;
  task_icon: string;
  task_type: string;
};

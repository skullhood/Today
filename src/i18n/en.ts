export const en = {
  common: {
    retired: 'Retired',
    noResults: 'No results.',
    taskNotFound: 'Task not found.',
    cancel: 'Cancel',
    delete: 'Delete',
    retire: 'Retire',
    unknownType: (type: string) => `Unknown task type: ${type}`,
  },

  today: {
    heading: 'Today',
    pending: 'Pending',
    completed: 'Completed',
    emptyPending: 'Nothing left to do today.',
    emptyCompleted: 'Nothing completed yet.',
    searchPlaceholder: 'Search completed...',
  },

  log: {
    heading: 'Log',
    tabs: { tasks: 'Tasks', history: 'History' },
    searchTasks: 'Search tasks...',
    searchHistory: 'Search history...',
    emptyTasks: 'No tasks yet.',
    emptyHistory: 'No completions yet.',
    dateLabels: { today: 'Today', yesterday: 'Yesterday' },
  },

  newTask: {
    labels: {
      name: 'NAME',
      description: 'DESCRIPTION (OPTIONAL)',
      color: 'COLOR',
      icon: 'ICON',
      schedule: 'SCHEDULE',
      advancedTime: 'ADVANCED TIME SETTINGS',
      resetTime: 'RESET TIME',
      alarm: 'ALARM',
      deadlineTime: 'DEADLINE TIME',
    },
    placeholders: {
      name: 'What do you need to do?',
      description: 'Add notes or details...',
      taskName: 'Task name',
    },
    schedule: {
      daily: 'Daily',
      days: 'Days',
      oneTime: 'One-time',
      interval: 'Interval',
    },
    interval: { hrs: 'hrs', min: 'min' },
    alarm: {
      on: 'On',
      off: 'Off',
      deadline: 'Deadline Alarm',
      onReset: 'On Reset',
    },
    hints: {
      persistent: 'Stays on your list until completed once, then moves to the Log.',
      intervalOnReset: 'Alarm fires each time the interval elapses.',
      onResetAlarm: 'Alarm fires when the task resets and appears on your list.',
      resetTime: 'Task reappears on your list at this time each day.',
      deadlineTime: "Alert fires at this time if the task isn't completed yet.",
    },
    warnings: {
      deadlineBeforeReset: 'Deadline must be after the reset time.',
    },
    createButton: 'Create Task',
    weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  },

  taskDetail: {
    status: {
      notCompleted: 'Not yet completed',
      doneToday: 'Done for today',
      done: 'Done',
    },
    actions: {
      markComplete: 'Mark Complete',
      undo: 'Undo',
      retire: 'Retire',
    },
    confirm: {
      retireTitle: 'Retire Task',
      retireMessage: 'Remove this task from your list? Your history is kept.',
    },
  },

  taskHistory: {
    stats: {
      currentStreak: 'Current Streak',
      longestStreak: 'Longest Streak',
      total: 'Total',
      avgPerWeek: 'Avg / Week',
      earliest: 'Earliest',
      latest: 'Latest',
      avgTime: 'Avg Time',
      created: 'Created',
      completed: 'Completed',
      time: 'Time',
      pending: 'Pending',
    },
    daysUnit: (n: number): string => n === 1 ? 'day' : 'days',
    ampm: { am: 'AM', pm: 'PM' },
  },

  historyDetail: {
    confirm: {
      retireTitle: 'Retire Task',
      retireMessage: (name: string) =>
        `Retire "${name}"? It will no longer appear in your list but your history is kept.`,
      deleteTitle: 'Delete Task',
      deleteMessage: (name: string) =>
        `Delete "${name}" and all its history? This cannot be undone.`,
    },
  },
};

export type Translations = typeof en;

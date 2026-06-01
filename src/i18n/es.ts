import type { Translations } from './en';

export const es: Translations = {
  common: {
    retired: 'Retirada',
    noResults: 'Sin resultados.',
    taskNotFound: 'Tarea no encontrada.',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    retire: 'Retirar',
    unknownType: (type: string) => `Tipo de tarea desconocido: ${type}`,
  },

  today: {
    heading: 'Hoy',
    pending: 'Pendiente',
    completed: 'Completado',
    emptyPending: 'Nada pendiente por hoy.',
    emptyCompleted: 'Nada completado aún.',
    searchPlaceholder: 'Buscar completadas...',
  },

  log: {
    heading: 'Registro',
    tabs: { tasks: 'Tareas', history: 'Historial' },
    searchTasks: 'Buscar tareas...',
    searchHistory: 'Buscar historial...',
    emptyTasks: 'Sin tareas aún.',
    emptyHistory: 'Sin completaciones aún.',
    dateLabels: { today: 'Hoy', yesterday: 'Ayer' },
  },

  newTask: {
    labels: {
      name: 'NOMBRE',
      description: 'DESCRIPCIÓN (OPCIONAL)',
      color: 'COLOR',
      icon: 'ÍCONO',
      schedule: 'HORARIO',
      advancedTime: 'CONFIGURACIÓN AVANZADA',
      resetTime: 'HORA DE REINICIO',
      alarm: 'ALARMA',
      deadlineTime: 'HORA LÍMITE',
    },
    placeholders: {
      name: '¿Qué necesitas hacer?',
      description: 'Agregar notas o detalles...',
      taskName: 'Nombre de la tarea',
    },
    schedule: {
      daily: 'Diario',
      days: 'Días',
      oneTime: 'Una vez',
      interval: 'Intervalo',
    },
    interval: { hrs: 'hrs', min: 'min' },
    alarm: {
      on: 'Activada',
      off: 'Desactivada',
      deadline: 'Alarma límite',
      onReset: 'Al reiniciar',
    },
    hints: {
      persistent: 'Permanece en tu lista hasta completarse una vez, luego pasa al Registro.',
      intervalOnReset: 'La alarma suena cada vez que el intervalo termina.',
      onResetAlarm: 'La alarma suena cuando la tarea se reinicia y aparece en tu lista.',
      resetTime: 'La tarea reaparece en tu lista a esta hora cada día.',
      deadlineTime: 'La alerta suena a esta hora si la tarea no ha sido completada.',
    },
    warnings: {
      deadlineBeforeReset: 'La hora límite debe ser posterior a la hora de reinicio.',
    },
    createButton: 'Crear tarea',
    weekdays: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  },

  taskDetail: {
    status: {
      notCompleted: 'Aún no completado',
      doneToday: 'Listo por hoy',
      done: 'Listo',
    },
    actions: {
      markComplete: 'Completar',
      undo: 'Deshacer',
      retire: 'Retirar',
    },
    confirm: {
      retireTitle: 'Retirar tarea',
      retireMessage: '¿Retirar esta tarea de tu lista? Tu historial se conserva.',
    },
  },

  taskHistory: {
    stats: {
      currentStreak: 'Racha actual',
      longestStreak: 'Racha más larga',
      total: 'Total',
      avgPerWeek: 'Prom. / Semana',
      earliest: 'Más temprano',
      latest: 'Más tarde',
      avgTime: 'Hora prom.',
      created: 'Creada',
      completed: 'Completada',
      time: 'Hora',
      pending: 'Pendiente',
    },
    daysUnit: (n: number) => n === 1 ? 'día' : 'días',
    ampm: { am: 'a.m.', pm: 'p.m.' },
  },

  historyDetail: {
    confirm: {
      retireTitle: 'Retirar tarea',
      retireMessage: (name: string) =>
        `¿Retirar "${name}"? Ya no aparecerá en tu lista, pero tu historial se conserva.`,
      deleteTitle: 'Eliminar tarea',
      deleteMessage: (name: string) =>
        `¿Eliminar "${name}" y todo su historial? Esto no se puede deshacer.`,
    },
  },
};

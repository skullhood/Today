# Today

<img src="assets/images/icon.png" width="120" alt="Today icon" />

> **Note:** This is a personal hobby project, primarily built with AI assistance (Claude), for my own day-to-day use. Development is driven entirely by what I personally find useful — features get added when I want them, in the order I want them. Issues and PRs are welcome but this will never be a community-roadmapped project.

A minimal daily task app for Android (and eventually iOS). Open it, see exactly what you need to do, do it, close it.

No dashboards. No onboarding. No clutter.

---

## Features

- **Instant task list** — opens straight to today's pending tasks, no extra taps
- **Pending / Completed tabs** — surface completed tasks to undo them if needed
- **Four schedule types:**
  - **Daily** — resets every day at a configurable time
  - **Days** — repeats on specific days of the week
  - **One-time** — stays on the list until completed once, then lives in the log
  - **Interval** — reappears every N hours or minutes since last completion
- **Task descriptions** — optional notes shown on the task detail screen
- **Retire** — remove a task from your list permanently while keeping its history
- **Log tab** — browse all tasks and a full completion history log with search
- **Per-task history** — calendar view of completions with stats (streak, avg/week, time of day)
- **Alarm support (Android)** — deadline alarms and on-reset alarms set automatically via the system Clock app
- **Data export** — share a full JSON dump of all tasks and completions
- **Offline-first** — everything stored on device via SQLite, no account required

---

## Tech stack

| | |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 56 / React Native 0.85 |
| Routing | [Expo Router](https://expo.github.io/router) v3 (file-based) |
| Storage | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Dates | [Day.js](https://day.js.org/) |
| Language | TypeScript (strict) |

---

## Getting started

**Prerequisites:** Node 18+, Android device or emulator.

```bash
git clone <repo>
cd Today
npm install
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your Android device.

> **Note:** Alarm functionality requires a development build due to the `com.android.alarm.permission.SET_ALARM` permission. Run `npx expo run:android` to build locally.

---

## Project structure

```
src/
  app/                  # Expo Router file-based routes
    (tabs)/             # Bottom tab screens (Today, Log)
    task/[id].tsx       # Task detail (from Today tab)
    history/[id].tsx    # Task history detail (from Log tab)
    new-task.tsx        # New task modal
  db/                   # SQLite layer
    index.ts            # Schema + migrations
    tasks.ts            # Task CRUD
    completions.ts      # Completion queries
    stats.ts            # Streak and stat computation
    export.ts           # JSON export
  store/                # Zustand store
  task-types/           # Task type registry
    registry.ts         # Type definitions and registry API
    simple-checkoff/    # First task type (yes/no completion)
  components/           # Shared UI components
  constants/            # Theme, color palette, icon set
  utils/                # Alarm scheduling
```

---

## Task type system

Every task renders as the same card on the list screen — `{ name, color, icon }` — regardless of type. Task types own exactly two things:

- **Detail screen** — the UI shown when you tap a card
- **History screen** — the UI shown in the Log tab for that task's record

Adding a new task type means creating a folder under `src/task-types/`, implementing both screens, and registering it in `src/task-types/index.ts`. The list screen never changes.

---

## Data model

```sql
tasks       (id, name, color, icon, description, schedule JSON, required_count,
             reset_hour, reset_minute, alarm_settings JSON, type, created_at, retired_at)

completions (id, task_id, completed_at, data JSON)
```

All history is inferred from completion records. Missed days are never written — the absence of a record for a past active day implies a miss. Streaks, averages, and calendar views are computed on read.

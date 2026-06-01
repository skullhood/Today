import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AppState as RNAppState, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { initDb } from '@/db';
import { useStore } from '@/store';
import '@/task-types';
import '@/i18n'; // initialise locale + dayjs language

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const init = useStore(s => s.init);
  const refresh = useStore(s => s.refresh);

  useEffect(() => {
    initDb();
    init();

    const sub = RNAppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });

    const ticker = setInterval(refresh, 30_000);

    return () => {
      sub.remove();
      clearInterval(ticker);
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/[id]"
          options={{ headerTransparent: true, title: '', headerBackTitle: 'Today' }}
        />
        <Stack.Screen
          name="history/[id]"
          options={{ headerTransparent: true, title: '', headerBackTitle: 'Log' }}
        />
        <Stack.Screen
          name="new-task"
          options={{ presentation: 'modal', title: 'New Task' }}
        />
      </Stack>
    </ThemeProvider>
  );
}

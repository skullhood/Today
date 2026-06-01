import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useStore } from '@/store';
import { getTaskType } from '@/task-types/registry';
import { ThemedText } from '@/components/themed-text';
import { t } from '@/i18n';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const task = useStore(s => s.tasks.find(t => t.id === id));
  const todayTask = useStore(s => s.todayTasks.find(t => t.id === id));
  const completeTask = useStore(s => s.completeTask);
  const uncompleteTask = useStore(s => s.uncompleteTask);
  const retireTask = useStore(s => s.retireTask);
  const getTaskCompletions = useStore(s => s.getTaskCompletions);

  if (!task) {
    return (
      <View style={styles.center}>
        <ThemedText>{t.common.taskNotFound}</ThemedText>
      </View>
    );
  }

  const taskType = getTaskType(task.type);
  if (!taskType) {
    return (
      <View style={styles.center}>
        <ThemedText>{t.common.unknownType(task.type)}</ThemedText>
      </View>
    );
  }

  const { DetailScreen } = taskType;

  return (
    <DetailScreen
      task={task}
      completions={getTaskCompletions(task.id)}
      completionsToday={todayTask?.completionsToday ?? task.required_count}
      onComplete={data => {
        completeTask(task.id, data);
        router.back();
      }}
      onUncomplete={() => {
        uncompleteTask(task.id);
        router.back();
      }}
      onRetire={() => {
        retireTask(task.id);
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

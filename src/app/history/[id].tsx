import { Alert } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/store';
import { getTaskType } from '@/task-types/registry';
import { ThemedText } from '@/components/themed-text';

export default function TaskHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const task = useStore(s => s.tasks.find(t => t.id === id));
  const getTaskCompletions = useStore(s => s.getTaskCompletions);
  const removeTask = useStore(s => s.removeTask);
  const retireTask = useStore(s => s.retireTask);
  const reactivateTask = useStore(s => s.reactivateTask);

  if (!task) {
    return (
      <View style={styles.center}>
        <ThemedText>Task not found.</ThemedText>
      </View>
    );
  }

  const taskType = getTaskType(task.type);
  if (!taskType) {
    return (
      <View style={styles.center}>
        <ThemedText>Unknown task type: {task.type}</ThemedText>
      </View>
    );
  }

  function handleDelete() {
    Alert.alert(
      'Delete Task',
      `Delete "${task!.name}" and all its history? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeTask(id);
            router.back();
          },
        },
      ]
    );
  }

  function handleRetire() {
    Alert.alert(
      'Retire Task',
      `Retire "${task!.name}"? It will no longer appear in your list but your history is kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retire', onPress: () => { retireTask(id); router.back(); } },
      ]
    );
  }

  const { HistoryScreen } = taskType;

  return (
    <HistoryScreen
      task={task}
      completions={getTaskCompletions(task.id)}
      onRetire={handleRetire}
      onReactivate={() => { reactivateTask(id); router.back(); }}
      onDelete={handleDelete}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

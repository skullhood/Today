import { Alert } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/store';
import { getTaskType } from '@/task-types/registry';
import { ThemedText } from '@/components/themed-text';
import { t as i18n } from '@/i18n';

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
        <ThemedText>{i18n.common.taskNotFound}</ThemedText>
      </View>
    );
  }

  const taskType = getTaskType(task.type);
  if (!taskType) {
    return (
      <View style={styles.center}>
        <ThemedText>{i18n.common.unknownType(task.type)}</ThemedText>
      </View>
    );
  }

  function handleDelete() {
    Alert.alert(
      i18n.historyDetail.confirm.deleteTitle,
      i18n.historyDetail.confirm.deleteMessage(task!.name),
      [
        { text: i18n.common.cancel, style: 'cancel' },
        { text: i18n.common.delete, style: 'destructive', onPress: () => { removeTask(id); router.back(); } },
      ]
    );
  }

  function handleRetire() {
    Alert.alert(
      i18n.historyDetail.confirm.retireTitle,
      i18n.historyDetail.confirm.retireMessage(task!.name),
      [
        { text: i18n.common.cancel, style: 'cancel' },
        { text: i18n.common.retire, onPress: () => { retireTask(id); router.back(); } },
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

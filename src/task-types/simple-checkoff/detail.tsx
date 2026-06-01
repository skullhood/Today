import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { contrastText } from '@/constants/palette';
import type { DetailScreenProps } from '../registry';

export function SimpleCheckoffDetail({
  task,
  completionsToday,
  onComplete,
  onUncomplete,
  onRetire,
}: DetailScreenProps) {
  const isDone = completionsToday >= task.required_count;
  const textColor = contrastText(task.color);
  const isPersistent = task.schedule.kind === 'persistent';
  const overlayColor = 'rgba(0,0,0,0.12)';

  function confirmRetire() {
    Alert.alert(
      'Retire Task',
      'Remove this task from your list? Your history is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retire', onPress: onRetire },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: task.color }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {task.description ? (
          <ThemedText style={[styles.description, { color: textColor }]}>
            {task.description}
          </ThemedText>
        ) : null}

        {task.required_count > 1 && (
          <ThemedText style={[styles.count, { color: textColor }]}>
            {completionsToday} / {task.required_count}
          </ThemedText>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <ThemedText style={[styles.statusLabel, { color: textColor }]}>
          {isDone
            ? isPersistent ? 'Done' : 'Done for today'
            : 'Not yet completed'}
        </ThemedText>

        {isDone ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: overlayColor }]}
            onPress={onUncomplete}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.primaryBtnText, { color: textColor }]}>Undo</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { borderWidth: 2, borderColor: textColor }]}
            onPress={() => onComplete()}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.primaryBtnText, { color: textColor }]}>
              Mark Complete
            </ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: overlayColor }]}
          onPress={confirmRetire}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.secondaryBtnText, { color: textColor }]}>Retire</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  description: {
    fontSize: 20,
    lineHeight: 28,
    opacity: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  count: {
    fontSize: 48,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  actions: {
    gap: 10,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

});

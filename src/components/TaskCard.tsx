import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { contrastText } from '@/constants/palette';
import type { TodayTask } from '@/store';

type Props = {
  task: TodayTask;
  completed?: boolean;
  onPress: () => void;
};

export function TaskCard({ task, completed, onPress }: Props) {
  const text = contrastText(task.color);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: task.color }, completed && styles.cardCompleted]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
        <MaterialIcons name={task.icon as any} size={26} color={text} />
      </View>

      <ThemedText style={[styles.name, { color: text }]} numberOfLines={2}>
        {task.name}
      </ThemedText>

      {task.required_count > 1 && !completed && (
        <View style={styles.countBadge}>
          <ThemedText style={[styles.countText, { color: text }]}>
            {task.completionsToday}/{task.required_count}
          </ThemedText>
        </View>
      )}
      {completed && (
        <View style={[styles.checkWrap, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
          <MaterialIcons name="check" size={18} color={text} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  cardCompleted: {
    opacity: 0.6,
  },
  countBadge: {
    flexShrink: 0,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  checkWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

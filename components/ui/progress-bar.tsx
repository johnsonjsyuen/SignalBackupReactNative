import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ProgressBarProps {
  progress: number; // 0 to 1
}

const ANIMATION_DURATION_MS = 300;

export function ProgressBar({ progress }: ProgressBarProps) {
  const trackColor = useThemeColor({}, 'surfaceVariant');
  const barColor = useThemeColor({}, 'primary');

  const clampedProgress = Math.min(1, Math.max(0, progress));

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clampedProgress * 100}%`, {
      duration: ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.ease),
    }),
  }));

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <Animated.View
        style={[styles.bar, { backgroundColor: barColor }, animatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});

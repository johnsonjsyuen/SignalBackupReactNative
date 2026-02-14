import { useState } from 'react';
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

interface TimePickerModalProps {
  visible: boolean;
  hour: number;
  minute: number;
  onConfirm: (hour: number, minute: number) => void;
  onCancel: () => void;
}

/**
 * Build a Date object from hour and minute values.
 * The date portion is irrelevant; only the time fields are used by the picker.
 */
function buildDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function TimePickerModal({
  visible,
  hour,
  minute,
  onConfirm,
  onCancel,
}: TimePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState(() =>
    buildDate(hour, minute)
  );

  const backgroundColor = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');

  // Keep local state in sync when props change while the modal is shown.
  // This is intentionally simple: the parent controls hour/minute and
  // we only maintain local state for in-progress selection.
  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      // On Android the picker fires once and dismisses itself.
      if (_event.type === 'dismissed') {
        onCancel();
        return;
      }
      if (date) {
        onConfirm(date.getHours(), date.getMinutes());
      }
      return;
    }

    // iOS: update local state; user confirms via the Done button.
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleDone = () => {
    onConfirm(selectedDate.getHours(), selectedDate.getMinutes());
  };

  // ---------------------------------------------------------------
  // Android: render the native picker directly (it is its own modal)
  // ---------------------------------------------------------------
  if (Platform.OS === 'android') {
    if (!visible) return null;

    return (
      <DateTimePicker
        value={buildDate(hour, minute)}
        mode="time"
        is24Hour={false}
        display="default"
        onChange={handleChange}
      />
    );
  }

  // ---------------------------------------------------------------
  // iOS: wrap in a custom Modal with Done / Cancel buttons
  // ---------------------------------------------------------------
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor }]}>
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
              <ThemedText style={[styles.toolbarButton, { color: secondaryColor }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDone} activeOpacity={0.7}>
              <ThemedText style={[styles.toolbarButton, { color: primaryColor }]}>
                Done
              </ThemedText>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={selectedDate}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={handleChange}
            style={styles.picker}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toolbarButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  picker: {
    width: '100%',
  },
});

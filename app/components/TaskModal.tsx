import {
  StyleProp,
  ViewStyle,
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  TextStyle,
} from "react-native";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useAppTheme } from "@/utils/useAppTheme";
import type { ThemedStyle, Theme } from "@/theme";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";

export interface TaskModalProps {
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Controls the visibility of the modal
   */
  visible: boolean;
  /**
   * Called when the modal should be closed
   */
  onClose: () => void;
  /**
   * Called when the user saves a task
   */
  onSave: (task: {
    title: string;
    description: string;
    datetime: Date;
    period: "morning" | "afternoon" | "evening";
    reminder: boolean;
  }) => void;
}

/**
 * A modal component for creating and editing tasks with date/time selection,
 * period selection, and reminder settings.
 */
export const TaskModal: FC<TaskModalProps> = observer(function TaskModal(
  props
) {
  const { style, visible, onClose, onSave } = props;
  const { themed, theme } = useAppTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "morning" | "afternoon" | "evening"
  >("morning");
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const periods = [
    { key: "morning", label: "🌅 Morning", time: "6:00 AM - 12:00 PM" },
    { key: "afternoon", label: "☀️ Afternoon", time: "12:00 PM - 6:00 PM" },
    { key: "evening", label: "🌙 Evening", time: "6:00 PM - 12:00 AM" },
  ];

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }

    const taskDateTime = new Date(selectedDate);
    taskDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());

    onSave({
      title: title.trim(),
      description: description.trim(),
      datetime: taskDateTime,
      period: selectedPeriod,
      reminder: reminderEnabled,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setSelectedDate(new Date());
    setSelectedTime(new Date());
    setSelectedPeriod("morning");
    setReminderEnabled(true);
    onClose();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={$modalOverlay}>
        <View style={themed($modalContainer)}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={themed($modalHeader)}>
              <Text preset="heading" style={themed($modalTitle)}>
                Add New Task
              </Text>
              <TouchableOpacity onPress={onClose} style={themed($closeButton)}>
                <Text style={themed($closeButtonText)}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Task Title */}
            <View style={themed($inputSection)}>
              <Text preset="formLabel" style={themed($label)}>
                Task Title *
              </Text>
              <TextField
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
                style={themed($textInput)}
              />
            </View>

            {/* Task Description */}
            <View style={themed($inputSection)}>
              <Text preset="formLabel" style={themed($label)}>
                Description
              </Text>
              <TextField
                value={description}
                onChangeText={setDescription}
                placeholder="Enter task description (optional)"
                multiline
                numberOfLines={3}
                style={themed($textAreaInput)}
              />
            </View>

            {/* Date Selection */}
            <View style={themed($inputSection)}>
              <Text preset="formLabel" style={themed($label)}>
                Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={themed($dateTimeButton)}
              >
                <Text style={themed($dateTimeButtonText)}>
                  📅 {formatDate(selectedDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Selection */}
            <View style={themed($inputSection)}>
              <Text preset="formLabel" style={themed($label)}>
                Time
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={themed($dateTimeButton)}
              >
                <Text style={themed($dateTimeButtonText)}>
                  🕐 {formatTime(selectedTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Period Selection */}
            <View style={themed($inputSection)}>
              <Text preset="formLabel" style={themed($label)}>
                Period
              </Text>
              <View style={themed($periodContainer)}>
                {periods.map((period) => (
                  <TouchableOpacity
                    key={period.key}
                    onPress={() => setSelectedPeriod(period.key as any)}
                    style={themed([
                      $periodButton,
                      selectedPeriod === period.key && $periodButtonActive,
                    ])}
                  >
                    <Text
                      style={themed([
                        $periodButtonText,
                        selectedPeriod === period.key &&
                          $periodButtonTextActive,
                      ])}
                    >
                      {period.label}
                    </Text>
                    <Text
                      style={themed([
                        $periodTimeText,
                        selectedPeriod === period.key && $periodTimeTextActive,
                      ])}
                    >
                      {period.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reminder Toggle */}
            <View style={themed($inputSection)}>
              <TouchableOpacity
                onPress={() => setReminderEnabled(!reminderEnabled)}
                style={themed($reminderToggle)}
              >
                <View style={themed($reminderToggleLeft)}>
                  <Text style={themed($reminderToggleIcon)}>🔔</Text>
                  <View>
                    <Text preset="formLabel" style={themed($reminderLabel)}>
                      Set Reminder
                    </Text>
                    <Text style={themed($reminderDescription)}>
                      Get notified when it's time for your task
                    </Text>
                  </View>
                </View>
                <View
                  style={themed([$switch, reminderEnabled && $switchActive])}
                >
                  <View
                    style={themed([
                      $switchThumb,
                      reminderEnabled && $switchThumbActive,
                    ])}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={themed($buttonContainer)}>
              <Button
                text="Cancel"
                preset="reversed"
                onPress={onClose}
                style={themed($cancelButton)}
              />
              <Button
                text="Save Task"
                onPress={handleSave}
                style={themed($saveButton)}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </Modal>
  );
});

// Styles
const $modalOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
};

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  width: Dimensions.get("window").width * 0.9,
  maxHeight: Dimensions.get("window").height * 0.8,
  padding: spacing.lg,
});

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.lg,
});

const $modalTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 20,
});

const $closeButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.separator,
  justifyContent: "center",
  alignItems: "center",
});

const $closeButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "bold",
});

const $inputSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
});

const $label: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  marginBottom: spacing.xs,
  fontWeight: "600",
});

const $textInput: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.separator,
  borderRadius: 8,
  padding: spacing.sm,
  backgroundColor: colors.background,
});

const $textAreaInput: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.separator,
  borderRadius: 8,
  padding: spacing.sm,
  backgroundColor: colors.background,
  minHeight: 80,
});

const $dateTimeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.separator,
  borderRadius: 8,
  padding: spacing.md,
  backgroundColor: colors.background,
});

const $dateTimeButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
});

const $periodContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
});

const $periodButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.separator,
  borderRadius: 8,
  padding: spacing.md,
  backgroundColor: colors.background,
});

const $periodButtonActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  borderColor: colors.tint,
});

const $periodButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "600",
});

const $periodButtonTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
});

const $periodTimeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginTop: 2,
});

const $periodTimeTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
});

const $reminderToggle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.separator,
  borderRadius: 8,
  backgroundColor: colors.background,
});

const $reminderToggleLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
});

const $reminderToggleIcon: ThemedStyle<TextStyle> = () => ({
  fontSize: 20,
});

const $reminderLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "600",
});

const $reminderDescription: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
});

const $switch: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 48,
  height: 28,
  borderRadius: 14,
  backgroundColor: colors.separator,
  padding: 2,
  justifyContent: "center",
});

const $switchActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
});

const $switchThumb: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: colors.background,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
});

const $switchThumbActive: ThemedStyle<ViewStyle> = () => ({
  transform: [{ translateX: 20 }],
});

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginTop: spacing.lg,
});

const $cancelButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

const $saveButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

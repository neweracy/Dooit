// TaskModal.tsx - Enhanced version with start date, due date, and improved date navigation
import React, { FC, useState } from "react";
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
  Platform,
} from "react-native";
import { observer } from "mobx-react-lite";

import { useAppTheme } from "@/utils/useAppTheme";
import type { ThemedStyle, Theme } from "@/theme";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import DateTimePicker from "@react-native-community/datetimepicker";

export interface TaskModalProps {
  style?: StyleProp<ViewStyle>;
  visible: boolean;
  onClose: () => void;
  onSave: (task: {
    title: string;
    description: string;
    startDate: Date;
    dueDate: Date;
    taskTime: Date;
    period: "morning" | "afternoon" | "evening";
    reminder: boolean;
  }) => void;
}

export const TaskModal: FC<TaskModalProps> = observer(function TaskModal(
  props
) {
  const { style, visible, onClose, onSave } = props;
  const { themed, theme } = useAppTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<"start" | "due">(
    "start"
  );
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

    // Add date validation
    if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) {
      Alert.alert("Error", "Please select valid dates");
      return;
    }

    if (startDate > dueDate) {
      Alert.alert("Error", "Start date cannot be after due date");
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      taskTime: selectedTime,
      startDate: startDate,
      dueDate: dueDate,
      period: selectedPeriod,
      reminder: reminderEnabled,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setDueDate(new Date());
    setSelectedPeriod("morning");
    setReminderEnabled(true);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDatePicker = (type: "start" | "due") => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  // Fixed Time Picker Component
  const SimpleTimePicker = () => {
    const [selectedHour, setSelectedHour] = useState(selectedTime.getHours());
    const [selectedMinute, setSelectedMinute] = useState(
      selectedTime.getMinutes()
    );

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const handleConfirm = () => {
      const newTime = new Date(selectedTime);
      newTime.setHours(selectedHour, selectedMinute, 0, 0);
      setSelectedTime(newTime);
      setShowTimePicker(false);
    };

    return (
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={$modalOverlay}>
          <View style={themed($pickerModal)}>
            <View style={themed($pickerHeader)}>
              <Text preset="heading" style={themed($pickerTitle)}>
                Select Time
              </Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={themed($closeButtonText)}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={themed($timePickerContainer)}>
              {/* Hour Picker */}
              <View style={themed($timePickerColumn)}>
                <Text style={themed($timePickerLabel)}>Hour</Text>
                <ScrollView
                  style={themed($timePickerScroll)}
                  showsVerticalScrollIndicator={false}
                >
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={themed([
                        $timePickerItem,
                        selectedHour === hour && $timePickerItemSelected,
                      ])}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text
                        style={themed([
                          $timePickerItemText,
                          selectedHour === hour && $timePickerItemTextSelected,
                        ])}
                      >
                        {hour.toString().padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Separator */}
              <View style={themed($timePickerSeparator)}>
                <Text style={themed($timePickerSeparatorText)}>:</Text>
              </View>

              {/* Minute Picker */}
              <View style={themed($timePickerColumn)}>
                <Text style={themed($timePickerLabel)}>Minute</Text>
                <ScrollView
                  style={themed($timePickerScroll)}
                  showsVerticalScrollIndicator={false}
                >
                  {minutes
                    .filter((m) => m % 5 === 0)
                    .map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={themed([
                          $timePickerItem,
                          selectedMinute === minute && $timePickerItemSelected,
                        ])}
                        onPress={() => setSelectedMinute(minute)}
                      >
                        <Text
                          style={themed([
                            $timePickerItemText,
                            selectedMinute === minute &&
                              $timePickerItemTextSelected,
                          ])}
                        >
                          {minute.toString().padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            </View>

            {/* Quick Time Buttons */}
            <View style={themed($quickTimeButtons)}>
              <TouchableOpacity
                style={themed($quickTimeButton)}
                onPress={() => {
                  setSelectedHour(9);
                  setSelectedMinute(0);
                }}
              >
                <Text style={themed($quickTimeButtonText)}>9:00 AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={themed($quickTimeButton)}
                onPress={() => {
                  setSelectedHour(13);
                  setSelectedMinute(0);
                }}
              >
                <Text style={themed($quickTimeButtonText)}>1:00 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={themed($quickTimeButton)}
                onPress={() => {
                  setSelectedHour(18);
                  setSelectedMinute(0);
                }}
              >
                <Text style={themed($quickTimeButtonText)}>6:00 PM</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={themed($timePickerActions)}>
              <Button
                text="Cancel"
                preset="reversed"
                onPress={() => setShowTimePicker(false)}
                style={themed($timePickerCancelButton)}
              />
              <Button
                text="Confirm"
                onPress={handleConfirm}
                style={themed($timePickerConfirmButton)}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Enhanced date picker with month/year navigation
  const EnhancedDatePicker = ({
    onDateSelect,
  }: {
    onDateSelect: (date: Date) => void;
  }) => {
    const currentDate = datePickerType === "start" ? startDate : dueDate;
    const [viewDate, setViewDate] = useState(new Date(currentDate));
    const [showYearPicker, setShowYearPicker] = useState(false);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];

      // Add empty cells for days before the month starts
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }

      return days;
    };

    const navigateMonth = (direction: "prev" | "next") => {
      const newDate = new Date(viewDate);
      newDate.setMonth(viewDate.getMonth() + (direction === "next" ? 1 : -1));
      setViewDate(newDate);
    };

    const navigateYear = (direction: "prev" | "next") => {
      const newDate = new Date(viewDate);
      newDate.setFullYear(
        viewDate.getFullYear() + (direction === "next" ? 1 : -1)
      );
      setViewDate(newDate);
    };

    const selectYear = (year: number) => {
      const newDate = new Date(viewDate);
      newDate.setFullYear(year);
      setViewDate(newDate);
      setShowYearPicker(false);
    };

    const isToday = (date: Date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
      return date.toDateString() === currentDate.toDateString();
    };

    const yearRange = Array.from(
      { length: 20 },
      (_, i) => new Date().getFullYear() - 10 + i
    );

    if (showYearPicker) {
      return (
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={$modalOverlay}>
            <View style={themed($pickerModal)}>
              <View style={themed($pickerHeader)}>
                <Text preset="heading" style={themed($pickerTitle)}>
                  Select Year
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={themed($closeButtonText)}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={themed($yearPickerList)}>
                {yearRange.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={themed([
                      $yearPickerItem,
                      year === viewDate.getFullYear() && $yearPickerItemActive,
                    ])}
                    onPress={() => selectYear(year)}
                  >
                    <Text
                      style={themed([
                        $yearPickerItemText,
                        year === viewDate.getFullYear() &&
                          $yearPickerItemTextActive,
                      ])}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      );
    }

    return (
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={$modalOverlay}>
          <View style={themed($pickerModal)}>
            <View style={themed($pickerHeader)}>
              <Text preset="heading" style={themed($pickerTitle)}>
                Select {datePickerType === "start" ? "Start" : "Due"} Date
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={themed($closeButtonText)}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Month/Year Navigation */}
            <View style={themed($dateNavigation)}>
              <TouchableOpacity
                onPress={() => navigateMonth("prev")}
                style={themed($navButton)}
              >
                <Text style={themed($navButtonText)}>‹</Text>
              </TouchableOpacity>

              <View style={themed($monthYearContainer)}>
                <TouchableOpacity
                  onPress={() => setShowYearPicker(true)}
                  style={themed($monthYearButton)}
                >
                  <Text style={themed($monthYearText)}>
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigateMonth("next")}
                style={themed($navButton)}
              >
                <Text style={themed($navButtonText)}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={themed($weekdayHeader)}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <Text key={day} style={themed($weekdayText)}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={themed($calendarGrid)}>
              {getDaysInMonth(viewDate).map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={themed([
                    $calendarDay,
                    !day && $calendarDayEmpty,
                    day && isToday(day) && $calendarDayToday,
                    day && isSelected(day) && $calendarDaySelected,
                  ])}
                  onPress={() => {
                    if (day) {
                      onDateSelect(day);
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={!day}
                >
                  <Text
                    style={themed([
                      $calendarDayText,
                      day && isToday(day) && $calendarDayTextToday,
                      day && isSelected(day) && $calendarDayTextSelected,
                    ])}
                  >
                    {day?.getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={themed($quickActions)}>
              <TouchableOpacity
                style={themed($quickActionButton)}
                onPress={() => {
                  onDateSelect(new Date());
                  setShowDatePicker(false);
                }}
              >
                <Text style={themed($quickActionText)}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={themed($quickActionButton)}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  onDateSelect(tomorrow);
                  setShowDatePicker(false);
                }}
              >
                <Text style={themed($quickActionText)}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={themed($quickActionButton)}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  onDateSelect(nextWeek);
                  setShowDatePicker(false);
                }}
              >
                <Text style={themed($quickActionText)}>Next Week</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
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

            {/* Date Range Section */}
            <View style={themed($dateRangeSection)}>
              {/* Start Date */}
              <View style={themed($dateInputContainer)}>
                <Text preset="formLabel" style={themed($label)}>
                  Start Date
                </Text>
                <TouchableOpacity
                  onPress={() => openDatePicker("start")}
                  style={themed($dateTimeButton)}
                >
                  <Text style={themed($dateTimeButtonText)}>
                    🗓️ {formatDate(startDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Due Date */}
              <View style={themed($dateInputContainer)}>
                <Text preset="formLabel" style={themed($label)}>
                  Due Date
                </Text>
                <TouchableOpacity
                  onPress={() => openDatePicker("due")}
                  style={themed($dateTimeButton)}
                >
                  <Text style={themed($dateTimeButtonText)}>
                    📅 {formatDate(dueDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Duration Display */}
            <View style={themed($durationDisplay)}>
              <Text style={themed($durationText)}>
                Duration:{" "}
                {Math.ceil(
                  (dueDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </Text>
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

      {/* Enhanced Date Picker */}
      <EnhancedDatePicker
        onDateSelect={(date) => {
          if (datePickerType === "start") {
            setStartDate(date);
            // Auto-adjust due date if it's before start date
            if (date > dueDate) {
              setDueDate(date);
            }
          } else {
            setDueDate(date);
            // Auto-adjust start date if it's after due date
            if (date < startDate) {
              setStartDate(date);
            }
          }
        }}
      />

      {/* Custom Time Picker */}
      <SimpleTimePicker />
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
  maxHeight: Dimensions.get("window").height * 0.85,
  padding: spacing.lg,
});

const $pickerModal: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  width: Dimensions.get("window").width * 0.9,
  maxHeight: Dimensions.get("window").height * 0.7,
  padding: spacing.lg,
});

const $pickerHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.md,
});

const $pickerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 18,
  fontWeight: "600",
});

const $dateNavigation: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.md,
});

const $navButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.tint,
  justifyContent: "center",
  alignItems: "center",
});

const $navButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 20,
  fontWeight: "bold",
});

const $monthYearContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
});

const $monthYearButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderRadius: 8,
  backgroundColor: colors.separator,
});

const $monthYearText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "600",
});

const $weekdayHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  marginBottom: spacing.sm,
});

const $weekdayText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  fontWeight: "600",
  width: 40,
  textAlign: "center",
});

const $calendarGrid: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-around",
});

const $calendarDay: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 40,
  height: 40,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.xs,
});

const $calendarDayEmpty: ThemedStyle<ViewStyle> = () => ({
  backgroundColor: "transparent",
});

const $calendarDayToday: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.separator,
  borderRadius: 20,
});

const $calendarDaySelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  borderRadius: 20,
});

const $calendarDayText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
});

const $calendarDayTextToday: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "bold",
});

const $calendarDayTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontWeight: "bold",
});

const $quickActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  marginTop: spacing.md,
});

const $quickActionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: 8,
  backgroundColor: colors.separator,
});

const $quickActionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
});

const $yearPickerList: ThemedStyle<ViewStyle> = () => ({
  maxHeight: 300,
});

const $yearPickerItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  alignItems: "center",
});

const $yearPickerItemActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
});

const $yearPickerItemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
});

const $yearPickerItemTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontWeight: "bold",
});

const $dateRangeSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
  marginBottom: spacing.lg,
});

const $dateInputContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

const $durationDisplay: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.separator,
  padding: spacing.sm,
  borderRadius: 8,
  alignItems: "center",
  marginBottom: spacing.lg,
});

const $durationText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
  fontWeight: "600",
});

// Existing styles remain the same...
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
  borderColor: colors.separator,
  padding: spacing.sm,
  backgroundColor: colors.background,
});

const $textAreaInput: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderColor: colors.separator,
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

const $pickerList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  maxHeight: 300,
});

const $pickerItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
});

const $pickerItemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
});

// Time Picker Styles
const $timePickerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: spacing.lg,
});

const $timePickerColumn: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
});

const $timePickerLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "600",
  marginBottom: spacing.sm,
});

const $timePickerScroll: ThemedStyle<ViewStyle> = ({ colors }) => ({
  maxHeight: 150,
  width: "100%",
  borderWidth: 1,
  borderColor: colors.separator,
  borderRadius: 8,
});

const $timePickerItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  alignItems: "center",
});

const $timePickerItemSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
});

const $timePickerItemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
});

const $timePickerItemTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontWeight: "bold",
});

const $timePickerSeparator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  marginTop: spacing.xl,
});

const $timePickerSeparatorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 24,
  fontWeight: "bold",
});

const $quickTimeButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  marginBottom: spacing.lg,
});

const $quickTimeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: 8,
  backgroundColor: colors.separator,
});

const $quickTimeButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
});

const $timePickerActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
});

const $timePickerCancelButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

const $timePickerConfirmButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

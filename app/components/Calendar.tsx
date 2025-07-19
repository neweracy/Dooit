import {
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useAppTheme } from "@/utils/useAppTheme";
import type { ThemedStyle } from "@/theme";
import { Text } from "@/components/Text";
import { useState, useCallback, useMemo } from "react";
import { useStores } from "@/models";

export interface CalendarProps {
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Callback when a date is selected
   */
  onDateSelect?: (date: Date) => void;
  /**
   * Selected date
   */
  selectedDate?: Date;
  /**
   * Show tasks on calendar
   */
  showTasks?: boolean;
  /**
   * Minimum selectable date
   */
  minDate?: Date;
  /**
   * Maximum selectable date
   */
  maxDate?: Date;
}

/**
 * Custom Calendar component with task integration
 */
export const Calendar = observer(function Calendar(props: CalendarProps) {
  const {
    style,
    onDateSelect,
    selectedDate,
    showTasks = true,
    minDate,
    maxDate,
  } = props;

  const $styles = [$container, style];
  const { themed } = useAppTheme();
  const { taskStore } = useStores();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  // Get current month and year
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  // Month names
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

  // Day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Get tasks for the current month
  const monthTasks = useMemo(() => {
    if (!showTasks) return {};

    const tasksMap: { [key: string]: any[] } = {};

    taskStore.tasks.forEach((task) => {
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        if (
          taskDate.getMonth() === currentMonth &&
          taskDate.getFullYear() === currentYear
        ) {
          const dateKey = taskDate.getDate().toString();
          if (!tasksMap[dateKey]) {
            tasksMap[dateKey] = [];
          }
          tasksMap[dateKey].push(task);
        }
      }
    });

    return tasksMap;
  }, [taskStore.tasks, currentMonth, currentYear, showTasks]);

  // Navigate to previous month
  const goToPrevMonth = useCallback(() => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  }, [currentYear, currentMonth]);

  // Navigate to next month
  const goToNextMonth = useCallback(() => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  }, [currentYear, currentMonth]);

  // Handle date selection
  const handleDatePress = useCallback(
    (day: number) => {
      const selectedDate = new Date(currentYear, currentMonth, day);

      // Check if date is within allowed range
      if (minDate && selectedDate < minDate) return;
      if (maxDate && selectedDate > maxDate) return;

      setCurrentDate(selectedDate);
      onDateSelect?.(selectedDate);
    },
    [currentYear, currentMonth, minDate, maxDate, onDateSelect]
  );

  // Check if a date is today
  const isToday = useCallback(
    (day: number) => {
      const today = new Date();
      return (
        today.getDate() === day &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear
      );
    },
    [currentMonth, currentYear]
  );

  // Check if a date is selected
  const isSelected = useCallback(
    (day: number) => {
      if (!selectedDate) return false;
      return (
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear
      );
    },
    [selectedDate, currentMonth, currentYear]
  );

  // Check if a date is disabled
  const isDisabled = useCallback(
    (day: number) => {
      const date = new Date(currentYear, currentMonth, day);
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    },
    [currentYear, currentMonth, minDate, maxDate]
  );

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push(
        <TouchableOpacity
          key={`prev-${day}`}
          style={themed($dayContainer)}
          disabled={true}
        >
          <Text style={themed($dayTextDisabled)}>{day}</Text>
        </TouchableOpacity>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = monthTasks[day.toString()] || [];
      const hasCompletedTasks = dayTasks.some((task) => task.isCompleted);
      const hasPendingTasks = dayTasks.some((task) => !task.isCompleted);
      const disabled = isDisabled(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={themed([
            $dayContainer,
            isToday(day) && $todayContainer,
            isSelected(day) && $selectedContainer,
            disabled && $disabledContainer,
          ])}
          onPress={() => handleDatePress(day)}
          disabled={disabled}
        >
          <Text
            style={themed([
              $dayText,
              isToday(day) && $todayText,
              isSelected(day) && $selectedText,
              disabled && $disabledText,
            ])}
          >
            {day}
          </Text>

          {showTasks && dayTasks.length > 0 && (
            <View style={themed($taskIndicatorContainer)}>
              {hasPendingTasks && (
                <View style={themed($taskIndicatorPending)} />
              )}
              {hasCompletedTasks && (
                <View style={themed($taskIndicatorCompleted)} />
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <TouchableOpacity
          key={`next-${day}`}
          style={themed($dayContainer)}
          disabled={true}
        >
          <Text style={themed($dayTextDisabled)}>{day}</Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={$styles}>
      {/* Header */}
      <View style={themed($header)}>
        <TouchableOpacity onPress={goToPrevMonth} style={themed($navButton)}>
          <Text style={themed($navButtonText)}>‹</Text>
        </TouchableOpacity>

        <Text style={themed($monthYearText)}>
          {monthNames[currentMonth]} {currentYear}
        </Text>

        <TouchableOpacity onPress={goToNextMonth} style={themed($navButton)}>
          <Text style={themed($navButtonText)}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={themed($dayNamesContainer)}>
        {dayNames.map((dayName) => (
          <View key={dayName} style={themed($dayNameContainer)}>
            <Text style={themed($dayNameText)}>{dayName}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={themed($calendarGrid)}>{generateCalendarDays()}</View>

      {/* Task summary for selected date */}
      {showTasks && selectedDate && (
        <View style={themed($taskSummary)}>
          <Text style={themed($taskSummaryTitle)}>
            Tasks for {selectedDate.toLocaleDateString()}
          </Text>
          {monthTasks[selectedDate.getDate().toString()]?.length > 0 ? (
            <ScrollView
              style={themed($tasksList)}
              showsVerticalScrollIndicator={false}
            >
              {monthTasks[selectedDate.getDate().toString()].map(
                (task, index) => (
                  <View key={task.id || index} style={themed($taskItem)}>
                    <View
                      style={themed([
                        $taskStatusIndicator,
                        task.isCompleted && $taskStatusCompleted,
                      ])}
                    />
                    <View style={themed($taskContent)}>
                      <Text
                        style={themed([
                          $taskTitle,
                          task.isCompleted && $taskTitleCompleted,
                        ])}
                      >
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text style={themed($taskDescription)}>
                          {task.description}
                        </Text>
                      )}
                    </View>
                  </View>
                )
              )}
            </ScrollView>
          ) : (
            <Text style={themed($noTasksText)}>No tasks for this date</Text>
          )}
        </View>
      )}
    </View>
  );
});

const $container: ViewStyle = {
  backgroundColor: "transparent",
};

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
});

const $navButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.xs,
  borderRadius: 20,
  backgroundColor: colors.palette.neutral100,
  width: 40,
  height: 40,
  justifyContent: "center",
  alignItems: "center",
});

const $navButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 20,
  color: colors.palette.primary500,
});

const $monthYearText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 18,
  color: colors.text,
});

const $dayNamesContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
});

const $dayNameContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
});

const $dayNameText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.textDim,
});

const $calendarGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  paddingHorizontal: spacing.md,
});

const $dayContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: `${100 / 7}%`,
  aspectRatio: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.xs,
  position: "relative",
});

const $todayContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 20,
});

const $selectedContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
  borderRadius: 20,
});

const $disabledContainer: ThemedStyle<ViewStyle> = () => ({
  opacity: 0.3,
});

const $dayText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.text,
});

const $todayText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  fontWeight: "bold",
});

const $selectedText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "bold",
});

const $disabledText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
});

const $dayTextDisabled: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.palette.neutral400,
});

const $taskIndicatorContainer: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  bottom: 4,
  flexDirection: "row",
  gap: 2,
});

const $taskIndicatorPending: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.palette.angry500,
});

const $taskIndicatorCompleted: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.palette.primary500,
});

const $taskSummary: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.md,
  padding: spacing.md,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  maxHeight: 200,
});

const $taskSummaryTitle: ThemedStyle<TextStyle> = ({
  colors,
  typography,
  spacing,
}) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.sm,
});

const $tasksList: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

const $taskItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  paddingVertical: spacing.xs,
  gap: spacing.sm,
});

const $taskStatusIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.palette.angry500,
  marginTop: 4,
});

const $taskStatusCompleted: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
});

const $taskContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

const $taskTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.text,
});

const $taskTitleCompleted: ThemedStyle<TextStyle> = ({ colors }) => ({
  textDecorationLine: "line-through",
  color: colors.textDim,
});

const $taskDescription: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginTop: 2,
});

const $noTasksText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  fontStyle: "italic",
});

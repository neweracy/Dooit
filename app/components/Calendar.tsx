import {
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
  TouchableOpacity,
  ScrollView,
  SectionList,
  RefreshControl,
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
  /**
   * Show agenda list view instead of task summary
   */
  showAgenda?: boolean;
  /**
   * Callback when a task is pressed in the agenda
   */
  onTaskPress?: (task: any) => void;
  /**
   * Number of days to show in agenda
   */
  agendaDays?: number;
}

interface AgendaSection {
  title: string;
  data: any[];
  date: Date;
}

// ENHANCEMENT 1: New interfaces for task types and periods
interface TaskPeriod {
  startDate: Date;
  endDate: Date;
  task: any;
  isStart: boolean;
  isEnd: boolean;
  isMiddle: boolean;
  isSingleDay: boolean;
}

interface DayTaskInfo {
  singleDayTasks: any[];
  multiDayPeriods: TaskPeriod[];
  allTasks: any[];
}

/**
 * Custom Calendar component with task integration and agenda list
 */
export const Calendar = observer(function Calendar(props: CalendarProps) {
  const {
    style,
    onDateSelect,
    selectedDate,
    showTasks = true,
    minDate,
    maxDate,
    showAgenda = false,
    onTaskPress,
    agendaDays = 3,
  } = props;

  const $styles = [$container, style];
  const { themed } = useAppTheme();
  const { taskStore } = useStores();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

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

  // ENHANCEMENT 2: Helper function to check if a task spans multiple days
  const isMultiDayTask = useCallback((task: any): boolean => {
    if (!task.startDate || !task.dueDate) return false;
    
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.dueDate);
    
    // Reset time to compare only dates
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return startDate.getTime() !== endDate.getTime();
  }, []);

  // ENHANCEMENT 3: Helper function to get task period info for a specific date
  const getTaskPeriodInfo = useCallback((task: any, date: Date): TaskPeriod | null => {
    if (!task.startDate || !task.dueDate) return null;
    
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.dueDate);
    const checkDate = new Date(date);
    
    // Reset times for date comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const checkTime = checkDate.getTime();
    
    // Check if date falls within task period
    if (checkTime < startTime || checkTime > endTime) return null;
    
    const isSingleDay = startTime === endTime;
    const isStart = checkTime === startTime;
    const isEnd = checkTime === endTime;
    const isMiddle = !isStart && !isEnd && !isSingleDay;
    
    return {
      startDate,
      endDate,
      task,
      isStart,
      isEnd,
      isMiddle,
      isSingleDay,
    };
  }, []);

  // ENHANCEMENT 4: Enhanced task mapping for the current month
  const monthTasksEnhanced = useMemo(() => {
    if (!showTasks) return {};

    const tasksMap: { [key: string]: DayTaskInfo } = {};
    const allTasks = taskStore.tasks.slice();

    // Initialize all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      tasksMap[day.toString()] = {
        singleDayTasks: [],
        multiDayPeriods: [],
        allTasks: [],
      };
    }

    allTasks.forEach((task) => {
      if (task.startDate && task.dueDate) {
        const startDate = new Date(task.startDate);
        const endDate = new Date(task.dueDate);
        
        // Check each day of the month to see if task overlaps
        for (let day = 1; day <= daysInMonth; day++) {
          const checkDate = new Date(currentYear, currentMonth, day);
          const periodInfo = getTaskPeriodInfo(task, checkDate);
          
          if (periodInfo) {
            const dayKey = day.toString();
            tasksMap[dayKey].allTasks.push(task);
            
            if (periodInfo.isSingleDay) {
              tasksMap[dayKey].singleDayTasks.push(task);
            } else {
              tasksMap[dayKey].multiDayPeriods.push(periodInfo);
            }
          }
        }
      } else if (task.dueDate) {
        // Fallback for tasks with only dueDate
        const taskDate = new Date(task.dueDate);
        if (
          taskDate.getMonth() === currentMonth &&
          taskDate.getFullYear() === currentYear
        ) {
          const dayKey = taskDate.getDate().toString();
          tasksMap[dayKey].singleDayTasks.push(task);
          tasksMap[dayKey].allTasks.push(task);
        }
      }
    });

    return tasksMap;
  }, [taskStore.tasks, currentMonth, currentYear, showTasks, daysInMonth, getTaskPeriodInfo]);

  // Format section title
  const formatSectionTitle = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    }

    if (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    ) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // Force re-computation when tasks change by using tasks length as dependency
  const tasksVersion = useMemo(() => taskStore.tasks.length, [
    taskStore.tasks.length,
  ]);

  // CHANGE 1: Updated agendaSections to show tasks from startDate to dueDate
  const agendaSections = useMemo((): AgendaSection[] => {
    if (!showAgenda) return [];

    const sections: AgendaSection[] = [];
    const startDate = selectedDate || new Date();

    // Force fresh computation
    const allTasks = taskStore.tasks.slice();

    for (let i = 0; i < agendaDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // CHANGE 2: Enhanced task filtering to include tasks that span across the date
      const dayTasks = allTasks.filter((task) => {
        // Check if task has both startDate and dueDate
        if (task.startDate && task.dueDate) {
          const taskStartDate = new Date(task.startDate);
          const taskEndDate = new Date(task.dueDate);
          const checkDate = new Date(date);
          
          // Reset times for date comparison
          taskStartDate.setHours(0, 0, 0, 0);
          taskEndDate.setHours(0, 0, 0, 0);
          checkDate.setHours(0, 0, 0, 0);
          
          // Include task if the date falls within the task's date range
          return checkDate.getTime() >= taskStartDate.getTime() && 
                 checkDate.getTime() <= taskEndDate.getTime();
        }
        
        // Fallback: if only dueDate exists, use original logic
        if (task.dueDate) {
          const taskDate = new Date(task.dueDate);
          return (
            taskDate.getDate() === date.getDate() &&
            taskDate.getMonth() === date.getMonth() &&
            taskDate.getFullYear() === date.getFullYear()
          );
        }
        
        return false;
      });

      // Always add section, even if no tasks (to show empty state)
      sections.push({
        title: formatSectionTitle(date),
        data: dayTasks,
        date: date,
      });
    }

    return sections;
  }, [taskStore.tasks, selectedDate, agendaDays, showAgenda, tasksVersion]);

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

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

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

  // ENHANCEMENT 5: Render multi-day task period indicator
  const renderMultiDayIndicator = useCallback((periods: TaskPeriod[]) => {
    if (periods.length === 0) return null;

    return (
      <View style={themed($multiDayContainer)}>
        {periods.slice(0, 3).map((period, index) => (
          <View
            key={`${period.task.id}-${index}`}
            style={themed([
              $multiDayIndicator,
              period.isStart && $multiDayStart,
              period.isEnd && $multiDayEnd,
              period.isMiddle && $multiDayMiddle,
              { backgroundColor: getTaskColor(period.task, index) },
            ])}
          />
        ))}
        {periods.length > 3 && (
          <Text style={themed($multiDayOverflow)}>+{periods.length - 3}</Text>
        )}
      </View>
    );
  }, [themed]);

  // ENHANCEMENT 6: Render single day task dots
  const renderSingleDayDots = useCallback((tasks: any[]) => {
    if (tasks.length === 0) return null;

    const maxDots = 4;
    const visibleTasks = tasks.slice(0, maxDots);
    const remainingCount = tasks.length - maxDots;

    return (
      <View style={themed($taskDotsContainer)}>
        {visibleTasks.map((task, index) => (
          <View
            key={task.id || index}
            style={themed([
              $taskDot,
              task.isCompleted && $taskDotCompleted,
              { backgroundColor: getTaskColor(task, index) },
            ])}
          />
        ))}
        {remainingCount > 0 && (
          <Text style={themed($taskDotsOverflow)}>+{remainingCount}</Text>
        )}
      </View>
    );
  }, [themed]);

  // ENHANCEMENT 7: Helper function to get consistent task colors
  const getTaskColor = useCallback((task: any, index: number) => {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FECA57', // Yellow
      '#FF9FF3', // Pink
      '#54A0FF', // Light Blue
      '#5F27CD', // Purple
    ];
    
    // Use task priority for color if available
    if (task.priority) {
      switch (task.priority) {
        case 'high': return '#FF6B6B';
        case 'medium': return '#FECA57';
        case 'low': return '#96CEB4';
      }
    }
    
    // Fallback to index-based color
    return colors[index % colors.length];
  }, []);

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
      const dayInfo = monthTasksEnhanced[day.toString()] || {
        singleDayTasks: [],
        multiDayPeriods: [],
        allTasks: [],
      };
      
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

          {/* ENHANCEMENT 8: Enhanced task indicators */}
          {showTasks && (
            <View style={themed($taskIndicatorsContainer)}>
              {/* Multi-day task periods */}
              {renderMultiDayIndicator(dayInfo.multiDayPeriods)}
              
              {/* Single day task dots */}
              {renderSingleDayDots(dayInfo.singleDayTasks)}
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

  // CHANGE 3: Enhanced agenda item rendering with task period context
  const renderAgendaItem = useCallback(
    ({ item, section }: { item: any; section: AgendaSection }) => {
      // CHANGE 4: Determine task period context for this specific date
      const currentDate = section.date;
      const taskPeriodInfo = getTaskPeriodInfo(item, currentDate);
      
      // CHANGE 5: Generate period indicator text
      const getPeriodText = () => {
        if (!taskPeriodInfo || taskPeriodInfo.isSingleDay) return null;
        
        if (taskPeriodInfo.isStart) return "Starts";
        if (taskPeriodInfo.isEnd) return "Ends";
        if (taskPeriodInfo.isMiddle) return "Continues";
        return null;
      };

      const periodText = getPeriodText();

      return (
        <TouchableOpacity
          style={themed($agendaItem)}
          onPress={() => onTaskPress?.(item)}
          activeOpacity={0.7}
        >
          <View
            style={themed([
              $agendaItemIndicator,
              item.isCompleted && $agendaItemIndicatorCompleted,
              // CHANGE 6: Add period-specific styling
              taskPeriodInfo?.isStart && $agendaItemIndicatorStart,
              taskPeriodInfo?.isEnd && $agendaItemIndicatorEnd,
              taskPeriodInfo?.isMiddle && $agendaItemIndicatorMiddle,
            ])}
          />
          <View style={themed($agendaItemContent)}>
            {/* CHANGE 7: Add period context text */}
            {periodText && (
              <Text style={themed($agendaItemPeriodText)}>
                {periodText}
              </Text>
            )}
            <Text
              style={themed([
                $agendaItemTitle,
                item.isCompleted && $agendaItemTitleCompleted,
              ])}
            >
              {item.title}
            </Text>
            {item.description && (
              <Text style={themed($agendaItemDescription)}>
                {item.description}
              </Text>
            )}
            {/* CHANGE 8: Show task duration for multi-day tasks */}
            {taskPeriodInfo && !taskPeriodInfo.isSingleDay && (
              <Text style={themed($agendaItemDuration)}>
                {taskPeriodInfo.startDate.toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric" 
                })} - {taskPeriodInfo.endDate.toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric" 
                })}
              </Text>
            )}
            {item.dueDate && (
              <Text style={themed($agendaItemTime)}>
                {new Date(item.taskTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [onTaskPress, themed, getTaskPeriodInfo]
  );

  // Render empty agenda section
  const renderEmptyAgendaSection = useCallback(() => {
    return (
      <View style={themed($emptyAgendaSection)}>
        <Text style={themed($emptyAgendaText)}>No tasks scheduled</Text>
      </View>
    );
  }, [themed]);

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: AgendaSection }) => {
      return (
        <View style={themed($sectionHeader)}>
          <Text style={themed($sectionHeaderText)}>{section.title}</Text>
          <Text style={themed($sectionHeaderDate)}>
            {section.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      );
    },
    [themed]
  );

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

      {/* Agenda List */}
      {showAgenda ? (
        <View style={themed($agendaContainer)}>
          <SectionList
            sections={agendaSections}
            renderItem={renderAgendaItem}
            renderSectionHeader={renderSectionHeader}
            ListEmptyComponent={renderEmptyAgendaSection}
            keyExtractor={(item, index) =>
              item.id?.toString() || index.toString()
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={() => (
              <View style={themed($itemSeparator)} />
            )}
            contentContainerStyle={themed($agendaContentContainer)}
          />
        </View>
      ) : (
        /* Task summary for selected date */
        showTasks &&
        selectedDate && (
          <View style={themed($taskSummary)}>
            <Text style={themed($taskSummaryTitle)}>
              Tasks for {selectedDate.toLocaleDateString()}
            </Text>
            {monthTasksEnhanced[selectedDate.getDate().toString()]?.allTasks.length > 0 ? (
              <ScrollView
                style={themed($tasksList)}
                showsVerticalScrollIndicator={false}
              >
                {monthTasksEnhanced[selectedDate.getDate().toString()].allTasks.map(
                  (task, index) => (
                    <TouchableOpacity
                      key={task.id || index}
                      style={themed($taskItem)}
                      onPress={() => onTaskPress?.(task)}
                    >
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
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            ) : (
              <Text style={themed($noTasksText)}>No tasks for this date</Text>
            )}
          </View>
        )
      )}
    </View>
  );
});


//  #region Styles

const $container: ViewStyle = {
  backgroundColor: "transparent",
  flex: 1,
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

// ENHANCEMENT 9: New styles for enhanced task indicators
const $taskIndicatorsContainer: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  bottom: 2,
  left: 0,
  right: 0,
  alignItems: "center",
});

// Multi-day task period styles
const $multiDayContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  alignItems: "center",
  marginBottom: 2,
});

const $multiDayIndicator: ThemedStyle<ViewStyle> = () => ({
  height: 3,
  width: "90%",
  marginBottom: 1,
});

const $multiDayStart: ThemedStyle<ViewStyle> = () => ({
  borderTopLeftRadius: 2,
  borderBottomLeftRadius: 2,
});

const $multiDayEnd: ThemedStyle<ViewStyle> = () => ({
  borderTopRightRadius: 2,
  borderBottomRightRadius: 2,
});

const $multiDayMiddle: ThemedStyle<ViewStyle> = () => ({
  // No border radius for middle segments
});

const $multiDayOverflow: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 8,
  color: colors.textDim,
  marginTop: 1,
});

// Single-day task dots styles
const $taskDotsContainer: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 1,
});

const $taskDot: ThemedStyle<ViewStyle> = () => ({
  width: 4,
  height: 4,
  borderRadius: 2,
});

const $taskDotCompleted: ThemedStyle<ViewStyle> = () => ({
  opacity: 0.6,
});

const $taskDotsOverflow: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 6,
  color: colors.textDim,
  marginLeft: 1,
});

// Legacy styles (kept for backward compatibility)
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

// Agenda List Styles
const $agendaContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginTop: spacing.md,
});

const $agendaContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.lg,
});

const $sectionHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  marginVertical: spacing.xs,
});

const $sectionHeaderText: ThemedStyle<TextStyle> = ({
  colors,
  typography,
}) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  textTransform: "capitalize",
});

const $sectionHeaderDate: ThemedStyle<TextStyle> = ({
  colors,
  typography,
}) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
});

const $agendaItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.md,
  marginVertical: spacing.xs,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
});

const $agendaItemIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 4,
  height: 40,
  borderRadius: 2,
  backgroundColor: colors.palette.angry500,
  marginRight: 12,
  marginTop: 2,
});

const $agendaItemIndicatorCompleted: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
});

// CHANGE 9: New styles for period-specific indicators
const $agendaItemIndicatorStart: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.secondary500,
  borderTopLeftRadius: 2,
  borderTopRightRadius: 2,
});

const $agendaItemIndicatorEnd: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.secondary500,
  borderBottomLeftRadius: 2,
  borderBottomRightRadius: 2,
});

const $agendaItemIndicatorMiddle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.secondary300,
});

// CHANGE 10: New styles for period text and duration
const $agendaItemPeriodText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 10,
  color: colors.palette.secondary500,
  textTransform: "uppercase",
  marginBottom: 2,
});

const $agendaItemDuration: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 11,
  color: colors.palette.secondary400,
  marginBottom: 2,
  fontStyle: "italic",
});

const $agendaItemContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

const $agendaItemTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginBottom: 4,
});

const $agendaItemTitleCompleted: ThemedStyle<TextStyle> = ({ colors }) => ({
  textDecorationLine: "line-through",
  color: colors.textDim,
});

const $agendaItemDescription: ThemedStyle<TextStyle> = ({
  colors,
  typography,
}) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  marginBottom: 4,
});

const $agendaItemTime: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.palette.primary500,
  fontWeight: "600",
});

const $emptyAgendaSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  alignItems: "center",
});

const $emptyAgendaText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  fontStyle: "italic",
});

const $itemSeparator: ThemedStyle<ViewStyle> = () => ({
  height: 1,
  backgroundColor: "transparent",
});

// Original Task Summary Styles (kept for backward compatibility)
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
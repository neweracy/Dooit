// Import necessary React and React Native components and hooks
import {
  Link,
  RouteProp,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import {
  FC,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Image,
  ImageStyle,
  Platform,
  SectionList,
  View,
  ViewStyle,
  Alert,
  TextStyle,
} from "react-native";
import { Drawer } from "react-native-drawer-layout";
import type { ContentStyle } from "@shopify/flash-list";
// Import custom components
import {
  ListItem,
  ListView,
  ListViewRef,
  Screen,
  Text,
  Button,
  TaskModal,
  showQueuedAlert,
} from "../../components";
// Import i18n utilities for internationalization
import { TxKeyPath, isRTL, translate } from "@/i18n";
// Import navigation types and theme utilities
import {
  DemoTabParamList,
  DemoTabScreenProps,
} from "../../navigators/DemoNavigator";
import type { Theme, ThemedStyle } from "@/theme";
import { $styles } from "@/theme";
// Import custom hooks and utilities
import { useSafeAreaInsetsStyle } from "../../utils/useSafeAreaInsetsStyle";
import * as Demos from "./demos";
import { DrawerIconButton } from "./DrawerIconButton";
import SectionListWithKeyboardAwareScrollView from "./SectionListWithKeyboardAwareScrollView";
import { useAppTheme } from "@/utils/useAppTheme";
// Import calendar components and state management
import { Calendar, CalendarList, Agenda } from "react-native-calendars";
import { useStores } from "@/models";
import { observer } from "mobx-react-lite";
import { useHandler } from "react-native-reanimated";
import { useHeader } from "@/utils/useHeader";

// App logo import
const logo = require("../../../assets/images/app-icon-android-adaptive-foreground.png");

/**
 * Interface defining the structure of a demo component
 * @property {string} name - Name of the demo
 * @property {TxKeyPath} description - Internationalization key for the description
 * @property {Function} data - Function that returns an array of React elements for the demo
 */
export interface Demo {
  name: string;
  description: TxKeyPath;
  data: ({ themed, theme }: { themed: any; theme: Theme }) => ReactElement[];
}

/**
 * Interface for demo list item props
 * @property {Object} item - The demo item containing name and use cases
 * @property {number} sectionIndex - Index of the current section
 * @property {Function} [handleScroll] - Optional callback for handling scroll to section
 */
interface DemoListItem {
  item: { name: string; useCases: string[] };
  sectionIndex: number;
  handleScroll?: (sectionIndex: number, itemIndex?: number) => void;
}

// Platform detection constant
const isAndroid = Platform.OS === "android";

/**
 * Main Demo Showroom Screen component
 * Displays a collection of demo components with navigation
 */
export const DemoShowroomScreen: FC<DemoTabScreenProps<
  "DemoShowroom"
>> = observer(function DemoShowroomScreen(_props) {
  // State for controlling the drawer open/close
  const [open, setOpen] = useState(false);
  const listRef = useRef<any>(null);

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get theme and styles
  const { themed, theme } = useAppTheme();

  // Get stores and their methods
  const {
    taskStore: {
      fetchTasks, // Fetches tasks from the server
      tasks, // List of all tasks
      completedTasks, // List of completed tasks
      createTask, // Creates a new task
      pendingTasks, // List of pending tasks
      getTasksForDate,
    },
  } = useStores();

  // Fetch tasks when screen loads
  useEffect(() => {
    loadTasks();
  }, []);

  // Refresh tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    try {
      await fetchTasks();
    } catch (error) {
      console.error("Error loading tasks:", error);

      showQueuedAlert({
        title: "Error",
        message: "Failed to load tasks. Please try again.",
      });
    }
  };

  const generateMultiPeriodMarkedDates = useCallback(() => {
    const markedDates: { [key: string]: any } = {};

    // Use the component-scoped taskColors

    tasks.forEach((task, taskIndex) => {
      if (task.startDate && task.dueDate) {
        const startDate = new Date(task.startDate);
        const dueDate = new Date(task.dueDate);
        const taskColor = taskColors[taskIndex % taskColors.length];

        // Generate all dates between start and due date
        const currentDate = new Date(startDate);
        const dates: string[] = [];

        while (currentDate <= dueDate) {
          dates.push(currentDate.toISOString().split("T")[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Mark each date with appropriate period properties
        dates.forEach((dateStr, index) => {
          if (!markedDates[dateStr]) {
            markedDates[dateStr] = { periods: [] };
          }

          const isStarting = index === 0;
          const isEnding = index === dates.length - 1;

          markedDates[dateStr].periods.push({
            startingDay: isStarting,
            endingDay: isEnding,
            color: taskColor,
          });
        });
      }
    });

    // Add selected date marking
    if (selectedDate) {
      const selectedDateStr = selectedDate.toISOString().split("T")[0];
      if (markedDates[selectedDateStr]) {
        markedDates[selectedDateStr].selected = true;
        markedDates[selectedDateStr].selectedColor =
          theme.colors.palette.primary500;
      } else {
        markedDates[selectedDateStr] = {
          selected: true,
          selectedColor: theme.colors.palette.primary500,
          periods: [],
        };
      }
    }

    return markedDates;
  }, [tasks, selectedDate, theme.colors.palette.primary500]);

  // Handle calendar day press
  const handleDayPress = (day: {
    dateString: string;
    day: number;
    month: number;
    year: number;
    timestamp: number;
  }) => {
    console.log("selected day", day);
    setSelectedDate(new Date(day.dateString));
  };

  // Handle task creation
  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    startDate: Date; // ← ADD THIS
    dueDate: Date; // ← CHANGE from 'datetime'
    taskTime: Date; // ← ADD THIS (format: "HH:MM")
    period: "morning" | "afternoon" | "evening";
    reminder: boolean;
  }) => {
    try {
      const result = await createTask({
        title: taskData.title,
        description: taskData.description,
        startDate: taskData.startDate.toISOString(), // ← ADD THIS
        dueDate: taskData.dueDate.toISOString(), // ← CHANGE from 'datetime'
        taskTime: taskData.taskTime, // ← ADD THIS
        period: taskData.period,
        reminderEnabled: taskData.reminder,
      });

      if (result) {
        Alert.alert("Success", "Task created successfully!");
        setTaskModalVisible(false);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create task");
    }
  };

  const scrollToIndexFailed = (info: any) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 500));
    wait.then(() => {
      listRef.current?.scrollToIndex({ index: info.index, animated: true });
    });
  };

  // Get tasks for selected date
  const selectedDateTasks = getTasksForDate(selectedDate);

  // Define colors for different tasks
  const taskColors = [
    "#5f9ea0", // cadet blue
    "#ffa500", // orange
    "#f0e68c", // khaki
    "#dda0dd", // plum
    "#98fb98", // pale green
    "#f0b27a", // sandy brown
    "#85c1e9", // sky blue
  ];

  // Demo sections - you can customize these based on your needs
  const demoSections = [
    {
      name: "Today's Tasks",
      description: "Tasks scheduled for today",
      data: [
        {
          content: (
            <View style={themed($taskSection)}>
              {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map((task: any) => (
                  <View key={task.id} style={themed($taskItem)}>
                    <Text style={themed($taskTitle)}>{task.title}</Text>
                    <Text style={themed($taskDescription)}>
                      {task.description}
                    </Text>
                    <Text style={themed($taskMeta)}>
                      {task.period} •{""}
                      {task.taskTime
                        ? ` ${new Date(task.taskTime).toLocaleTimeString()}`
                        : ""}
                      {task.startDate &&
                        ` • Start: ${new Date(
                          task.startDate
                        ).toLocaleDateString()}`}
                      {task.dueDate &&
                        ` • Due: ${new Date(
                          task.dueDate
                        ).toLocaleDateString()}`}
                    </Text>

                    {/* ADD: Task period progress indicator */}
                    {task.startDate && task.dueDate && (
                      <View style={themed($taskProgressContainer)}>
                        <Text style={themed($taskProgressText)}>
                          Task Period:{" "}
                          {new Date(task.startDate).toLocaleDateString()} →{" "}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </Text>
                        <View style={themed($taskProgressBar)}>
                          <View
                            style={themed([
                              $taskProgressFill,
                              {
                                backgroundColor:
                                  taskColors[
                                    selectedDateTasks.indexOf(task) %
                                      taskColors.length
                                  ],
                              },
                            ])}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={themed($noTasksText)}>
                  No tasks for selected date
                </Text>
              )}
            </View>
          ),
        },
      ],
    },
    {
      name: "Task Statistics",
      description: "Overview of your tasks",
      data: [
        {
          content: (
            <View style={themed($statsSection)}>
              <View style={themed($statItem)}>
                <Text style={themed($statNumber)}>{completedTasks.length}</Text>
                <Text style={themed($statLabel)}>Completed</Text>
              </View>
              <View style={themed($statItem)}>
                <Text style={themed($statNumber)}>{pendingTasks.length}</Text>
                <Text style={themed($statLabel)}>Pending</Text>
              </View>
              {/* <View style={themed($statItem)}>
              <Text style={themed($statNumber)}>{tasksWithReminders.length}</Text>
              <Text style={themed($statLabel)}>With Reminders</Text>
            </View> */}
            </View>
          ),
        },
      ],
    },
    {
      name: "Quick Actions",
      description: "Common task actions",
      data: [
        {
          content: (
            <View style={themed($quickActionsSection)}>
              <Button
                text="View All Tasks"
                onPress={() => console.log("View all tasks")}
                style={themed($actionButton)}
              />
              <Button
                text="Today's Tasks"
                onPress={() => setSelectedDate(new Date())}
                style={themed($actionButton)}
              />
              <Button
                text="Clear Completed"
                onPress={() => console.log("Clear completed")}
                style={themed($actionButton)}
              />
            </View>
          ),
        },
      ],
    },
    {
      name: "Task Legend",
      description: "Color coding for task periods",
      data: [
        {
          content: (
            <View style={themed($legendSection)}>
              {tasks.slice(0, 7).map((task, index) => (
                <View key={task.id} style={themed($legendItem)}>
                  <View
                    style={[
                      themed($legendColor),
                      { backgroundColor: taskColors[index] },
                    ]}
                  />
                  <Text style={themed($legendText)} numberOfLines={1}>
                    {task.title}
                  </Text>
                </View>
              ))}
            </View>
          ),
        },
      ],
    },
  ];

  /**
   * Toggles the drawer open/close state
   */
  const toggleDrawer = useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, []);

  const $drawerInsets = useSafeAreaInsetsStyle(["top"]);

  return (
    <Drawer
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      drawerType="back"
      drawerPosition={isRTL ? "right" : "left"}
      renderDrawerContent={() => (
        <View style={themed([$drawer, $drawerInsets])}>
          <View style={themed($logoContainer)}>
            <Image source={logo} style={$logoImage} />
          </View>
        </View>
      )}
    >
      <Screen
        preset="fixed"
        safeAreaEdges={["top"]}
        contentContainerStyle={$styles.flex1}
        {...(isAndroid
          ? { KeyboardAvoidingViewProps: { behavior: undefined } }
          : {})}
      >
        <DrawerIconButton onPress={toggleDrawer} />

        <SectionListWithKeyboardAwareScrollView
          ref={listRef}
          contentContainerStyle={themed($sectionListContentContainer)}
          stickySectionHeadersEnabled={false}
          sections={demoSections}
          renderItem={({ item }) => (
            <View style={themed($itemContainer)}>{item.content}</View>
          )}
          renderSectionFooter={() => (
            <View style={themed($demoUseCasesSpacer)} />
          )}
          ListHeaderComponent={
            <View style={themed($heading)}>
              <Text preset="heading" style={themed($headingText)}>
                Task Manager Demo
              </Text>

              <Calendar
                onDayPress={handleDayPress}
                markingType="multi-period"
                markedDates={generateMultiPeriodMarkedDates()}
                style={themed($calendar)}
                theme={{
                  selectedDayBackgroundColor: theme.colors.palette.primary500,
                  todayTextColor: theme.colors.palette.primary500,
                  dayTextColor: theme.colors.text,
                  monthTextColor: theme.colors.text,
                  arrowColor: theme.colors.palette.primary500,
                }}
              />

              {/* Add Task Button */}
              <Button
                text="+ Add New Task"
                onPress={() => setTaskModalVisible(true)}
                style={themed($addTaskButton)}
              />
            </View>
          }
          onScrollToIndexFailed={scrollToIndexFailed}
          renderSectionHeader={({ section }) => (
            <View style={themed($sectionHeader)}>
              <Text style={themed($sectionTitle)}>{section.name}</Text>
              <Text style={themed($sectionDescription)}>
                {section.description}
              </Text>
            </View>
          )}
        />

        {/* Task Modal */}
        <TaskModal
          visible={taskModalVisible}
          onClose={() => setTaskModalVisible(false)}
          onSave={handleSaveTask}
        />
      </Screen>
    </Drawer>
  );
});

// #region Styles
// Existing styles
const $drawer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  flex: 1,
});

const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
});

const $sectionListContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
});

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xxxl,
});

const $logoImage: ImageStyle = {
  height: 80,
  width: 80,
};

const $logoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "flex-start",
  justifyContent: "center",
  height: 56,
  paddingHorizontal: spacing.lg,
});

const $menuContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xs,
  paddingTop: spacing.lg,
});

const $demoUseCasesSpacer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
});

// Add task button style
const $addTaskButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  marginTop: spacing.lg,
});

const $headingText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
});

const $calendar: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.lg,
  borderRadius: 12,
  backgroundColor: colors.background,
});

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  marginBottom: spacing.sm,
});

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.semiBold,
  fontSize: 18,
  color: colors.text,
  marginBottom: 4,
});

const $sectionDescription: ThemedStyle<TextStyle> = ({
  colors,
  typography,
}) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
});

const $itemContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.sm,
});

const $taskSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
});

const $taskItem: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.md,
  backgroundColor: colors.background,
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: colors.palette.primary500,
});

const $taskTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.semiBold,
  fontSize: 16,
  color: colors.text,
  marginBottom: 4,
});

const $taskDescription: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  marginBottom: 8,
});

const $taskMeta: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.palette.primary500,
});

const $noTasksText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
  textAlign: "center",
  padding: 20,
});

const $statsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  paddingVertical: spacing.md,
});

const $statItem: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
});

const $statNumber: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 24,
  color: colors.palette.primary500,
});

const $statLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginTop: 4,
});

const $quickActionsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
});

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  marginBottom: 8,
});

// const $demoUseCasesSpacer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
//   paddingVertical: spacing.lg,
// })

const $taskProgressContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
});

const $taskProgressText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 11,
  color: colors.textDim,
  marginBottom: 4,
});

const $taskProgressBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 4,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 2,
  overflow: "hidden",
});

const $taskProgressFill: ThemedStyle<ViewStyle> = () => ({
  height: "100%",
  width: "100%",
  borderRadius: 2,
});
// 6. ADD: Legend styles
const $legendSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
});

const $legendItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.xs,
  flex: 1,
  minWidth: "45%",
});

const $legendColor: ThemedStyle<ViewStyle> = () => ({
  width: 12,
  height: 12,
  borderRadius: 6,
});

const $legendText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.text,
  flex: 1,
});

// Import necessary React and React Native components and hooks
import { Link, RouteProp, useRoute } from "@react-navigation/native";
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

/**
 * Native list item component for the demo screen
 * Renders a section header with its use cases as list items
 */
const NativeListItem: FC<DemoListItem> = ({
  item,
  sectionIndex,
  handleScroll,
}) => {
  const { themed } = useAppTheme();
  return (
    <View>
      {/* Section header */}
      <Text
        onPress={() => handleScroll?.(sectionIndex)}
        preset="bold"
        style={themed($menuContainer)}
      >
        {item.name}
      </Text>
      {/* List of use cases for this section */}
      {item.useCases.map((u, index) => (
        <ListItem
          key={`section${sectionIndex}-${u}`}
          onPress={() => handleScroll?.(sectionIndex, index)}
          text={u}
          rightIcon={isRTL ? "caretLeft" : "caretRight"}
        />
      ))}
    </View>
  );
};

// Platform-specific component selection
const ShowroomListItem = Platform.select({
  default: NativeListItem, // Use NativeListItem as default for all platforms
});

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

  // State for managing selected date and task modal
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>();

  // Refs for managing timeouts and component references
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const listRef = useRef<SectionList>(null);
  const menuRef = useRef<ListViewRef<DemoListItem["item"]>>(null);
  
  // Get current route parameters
  const route = useRoute<RouteProp<DemoTabParamList, "DemoShowroom">>();
  const params = route.params;

  /**
   * Opens the task creation modal
   * @param date - Optional date to prefill in the modal
   */
  const openTaskModal = (date?: Date) => {
    if (date) {
      setPrefilledDate(date);
    } else {
      setPrefilledDate(selectedDate || new Date());
    }
    setIsTaskModalVisible(true);
  };

  /**
   * Closes the task creation modal and resets the prefilled date
   */
  const closeTaskModal = () => {
    setIsTaskModalVisible(false);
    setPrefilledDate(undefined);
  };


  // Get theme and styles
  const { themed, theme } = useAppTheme();

  // Get stores and their methods
  const {
    taskStore: {
      fetchTasks,          // Fetches tasks from the server
      tasks,               // List of all tasks
      updateTask,          // Updates an existing task
      deleteTask,          // Deletes a task
      toggleTaskCompletion, // Toggles task completion status
      completedTasks,      // List of completed tasks
      createTask,          // Creates a new task
      pendingTasks,        // List of pending tasks
    },
    authenticationStore: {
      // getEmail,          // Uncomment if needed for user authentication
    },
  } = useStores();

  /**
   * Handles date selection from the calendar
   * @param date - Selected date
   */
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  /**
   * Handles day press event from the calendar component
   * @param day - Object containing day information
   */
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

  /**
   * Handles saving a new task
   * @param taskData - Task data including title, description, datetime, period, and reminder settings
   */
  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    datetime: Date;
    period: "morning" | "afternoon" | "evening";
    reminder: boolean;
  }) => {
    try {
      // Create a new task using the task store
      const result = await createTask({
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.datetime.toISOString(),
        period: taskData.period,
        reminderEnabled: taskData.reminder,
      });

      // Show success message and close modal if task was created successfully
      if (result) {
        Alert.alert("Success", "Task created successfully!");
        closeTaskModal();
      }

      // If task was created for a different date, update the selected date
      if (taskData.datetime.toDateString() !== selectedDate?.toDateString()) {
        setSelectedDate(taskData.datetime);
      }
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Failed to create task. Please try again.");
    }
  };

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  /**
   * Toggles the drawer open/close state
   */
  const toggleDrawer = useCallback(() => {
    setOpen(prevOpen => !prevOpen);
  }, []);

  /**
   * Handles scrolling to a specific section and item in the list
   * @param sectionIndex - Index of the section to scroll to
   * @param itemIndex - Index of the item within the section (defaults to 0)
   */
  const handleScroll = useCallback((sectionIndex: number, itemIndex = 0) => {
    try {
      // Scroll the main content to the selected section and item
      listRef.current?.scrollToLocation({
        animated: true,
        sectionIndex,
        itemIndex,
        viewOffset: 80,
      });
      
      // Also scroll the menu to highlight the selected section
      menuRef.current?.scrollToIndex({
        index: sectionIndex,
        animated: true,
        viewPosition: 0.5,
      });
    } catch (error) {
      console.error("Error scrolling to location:", error);
    }
  }, []);

  /**
   * Handles scroll-to-index failures by implementing a retry mechanism
   * @param info - Object containing scroll failure information
   */
  const scrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    // Clear any existing timeout to prevent multiple retries
    if (timeout.current) clearTimeout(timeout.current);

    // Set a new timeout to retry scrolling
    timeout.current = setTimeout(() => {
      if (listRef.current) {
        if (info.highestMeasuredFrameIndex === -1) {
          // List hasn't rendered anything yet, try scrolling to the target index
          handleScroll(info.index, 0);
        } else if (info.index < info.highestMeasuredFrameIndex) {
          // Can't reach the target index, scroll to the highest measured frame
          handleScroll(info.highestMeasuredFrameIndex, 0);
        }
      }
    }, 50); // Wait 50ms before retrying
  };

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
          <ListView<DemoListItem["item"]>
            ref={menuRef}
            contentContainerStyle={themed($listContentContainer)}
            estimatedItemSize={250}
            data={Object.values(Demos).map((d) => ({
              name: d.name,
              useCases: d
                .data({ theme, themed })
                .map((u) => translate(u.props.name)),
            }))}
            keyExtractor={(item) => item.name}
            renderItem={({ item, index: sectionIndex }) => (
              <ShowroomListItem {...{ item, sectionIndex, handleScroll }} />
            )}
          />
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
          sections={Object.values(Demos).map((d) => ({
            name: d.name,
            description: d.description,
            data: [d.data({ theme, themed })],
          }))}
          renderItem={({ item, index: sectionIndex }) => <View></View>}
          renderSectionFooter={() => (
            <View style={themed($demoUseCasesSpacer)} />
          )}
          ListHeaderComponent={
            <View style={themed($heading)}>
              <Text
                preset="heading"
                tx="demoShowroomScreen:jumpStart"
                txOptions={{ user: "" }}
              />

              <Calendar
                onDayPress={(day: {
                  dateString: string;
                  day: number;
                  month: number;
                  year: number;
                  timestamp: number;
                }) => {
                  console.log("selected day", day);
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
          renderSectionHeader={({ section }) => {
            return <View></View>;
          }}
        />
      </Screen>
    </Drawer>
  );
});

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

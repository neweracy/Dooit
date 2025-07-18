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
  TextStyle,
  View,
  ViewStyle,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Drawer } from "react-native-drawer-layout";
import type { ContentStyle } from "@shopify/flash-list";
import {
  ListItem,
  ListView,
  ListViewRef,
  Screen,
  Text,
  TextField,
  Button,
} from "../../components";
import { TxKeyPath, isRTL, translate } from "@/i18n";
import {
  DemoTabParamList,
  DemoTabScreenProps,
} from "../../navigators/DemoNavigator";
import type { Theme, ThemedStyle } from "@/theme";
import { $styles } from "@/theme";
import { useSafeAreaInsetsStyle } from "../../utils/useSafeAreaInsetsStyle";
import * as Demos from "./demos";
import { DrawerIconButton } from "./DrawerIconButton";
import SectionListWithKeyboardAwareScrollView from "./SectionListWithKeyboardAwareScrollView";
import { useAppTheme } from "@/utils/useAppTheme";
import { Calendar, CalendarList, Agenda } from "react-native-calendars";
import { useStores } from "@/models";
import { Task } from "@/models/Task";
import { observer } from "mobx-react-lite";
import { useHeader } from "@/utils/useHeader";
import Parse from "@/lib/Parse/parse";


const logo = require("../../../assets/images/app-icon-android-adaptive-foreground.png");

export interface Demo {
  name: string;
  description: TxKeyPath;
  data: ({ themed, theme }: { themed: any; theme: Theme }) => ReactElement[];
}


interface DemoListItem {
  item: { name: string; useCases: string[] };
  sectionIndex: number;
  handleScroll?: (sectionIndex: number, itemIndex?: number) => void;
}




const NativeListItem: FC<DemoListItem> = ({
  item,
  sectionIndex,
  handleScroll,
}) => {
  const { themed } = useAppTheme();
  return (
    <View>
      <Text
        onPress={() => handleScroll?.(sectionIndex)}
        preset="bold"
        style={themed($menuContainer)}
      >
        {item.name}
      </Text>
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

const ShowroomListItem = Platform.select({
  default: NativeListItem,
});
const isAndroid = Platform.OS === "android";

export const DemoShowroomScreen: FC<DemoTabScreenProps<
  "DemoShowroom"
>> = observer(function DemoShowroomScreen(_props) {
  const [open, setOpen] = useState(false);


  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false)
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>()



  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const listRef = useRef<SectionList>(null);
  const menuRef = useRef<ListViewRef<DemoListItem["item"]>>(null);
  const route = useRoute<RouteProp<DemoTabParamList, "DemoShowroom">>();
  const params = route.params;


  const openTaskModal = (date?: Date) => {
    if (date) {
      setPrefilledDate(date)
    } else {
      setPrefilledDate(selectedDate || new Date())
    }
    setIsTaskModalVisible(true)
  }


  const closeTaskModal = () => {
    setIsTaskModalVisible(false)
    setPrefilledDate(undefined)
  }




  const { themed, theme } = useAppTheme();

  const {
    taskStore: {
      fetchTasks,
      tasks,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      completedTasks,
      createTask,
      pendingTasks,
    },authenticationStore:{

      // getEmail,
    }
  } = useStores();


  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }


  const handleSaveTask = async (taskData: {
    title: string
    description: string
    datetime: Date
    period: "morning" | "afternoon" | "evening"
    reminder: boolean
  }) => {
    try {
      const newTask = {
        id: Date.now().toString(),
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.datetime.toISOString(), // Convert Date to ISO string
        period: taskData.period,
        reminderEnabled: taskData.reminder, // Changed 'reminder' to 'reminderEnabled' to match the expected type
        // isCompleted: false,  // Remove if not needed in the type
        // createdAt: new Date(),  // Remove if not needed in the type
      }

      await createTask(newTask)
      
      Alert.alert("Success", "Task created successfully!")
      
      // If task was created for a different date, update selected date
      if (taskData.datetime.toDateString() !== selectedDate?.toDateString()) {
        setSelectedDate(taskData.datetime)
      }
      
    } catch (error) {
      console.error("Error saving task:", error)
      Alert.alert("Error", "Failed to create task. Please try again.")
    }
  }


  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleDrawer = useCallback(() => {
    if (!open) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [open]);

  const handleScroll = useCallback((sectionIndex: number, itemIndex = 0) => {
    try {
      listRef.current?.scrollToLocation({
        animated: true,
        itemIndex,
        sectionIndex,
        viewPosition: 0.25,
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const scrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    listRef.current?.getScrollResponder()?.scrollToEnd();
    timeout.current = setTimeout(
      () =>
        listRef.current?.scrollToLocation({
          animated: true,
          itemIndex: info.index,
          sectionIndex: 0,
        }),
      50
    );
  };

  useEffect(() => {
    return () => timeout.current && clearTimeout(timeout.current);
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
              <Text preset="heading" tx="demoShowroomScreen:jumpStart" txOptions={{ user: "" }} />

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
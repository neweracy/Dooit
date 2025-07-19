import { observer } from "mobx-react-lite"
import { ComponentType, FC, useCallback, useEffect, useMemo, useState } from "react"
import {
  AccessibilityProps,
  ActivityIndicator,
  Platform,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { type ContentStyle } from "@shopify/flash-list"
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import {
  Button,
  ButtonAccessoryProps,
  Card,
  EmptyState,
  Icon,
  ListView,
  Screen,
  Switch,
  Text,
} from "@/components"
import { isRTL, translate } from "@/i18n"
import { useStores } from "../models"
import { DemoTabScreenProps } from "../navigators/DemoNavigator"
import type { ThemedStyle } from "@/theme"
import { $styles } from "../theme"
import { delay } from "../utils/delay"
import { useAppTheme } from "@/utils/useAppTheme"

const ICON_SIZE = 18      

type FilterType = "all" | "completed" | "pending" | "reminders"
type PeriodFilter = "all" | "morning" | "afternoon" | "evening"

import { Instance } from "mobx-state-tree"
import { TaskModel } from "../models/Task"

type Task = Instance<typeof TaskModel>

export const DemoPodcastListScreen: FC<DemoTabScreenProps<"DemoPodcastList">> = observer(
  function DemoPodcastListScreen(_props) {
    const { taskStore } = useStores()
    const { themed } = useAppTheme()

    const [refreshing, setRefreshing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [filterType, setFilterType] = useState<FilterType>("all")
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")

    // initially, kick off a background refresh without the refreshing UI
    useEffect(() => {
      ;(async function load() {
        setIsLoading(true)
        await taskStore.fetchTasks()
        setIsLoading(false)
      })()
    }, [taskStore])

    // simulate a longer refresh, if the refresh is too fast for UX
    async function manualRefresh() {
      setRefreshing(true)
      await Promise.all([taskStore.fetchTasks(), delay(750)])
      setRefreshing(false)
    }

    // Type guard to ensure task has the correct shape
    const isValidTask = (task: any): task is Task => {
      return (
        task &&
        typeof task.id === 'string' &&
        typeof task.title === 'string' &&
        typeof task.isCompleted === 'boolean' &&
        (task.period === undefined || 
         task.period === 'morning' || 
         task.period === 'afternoon' || 
         task.period === 'evening')
      )
    }

    // Filter tasks based on current filters
    const filteredTasks = useMemo(() => {
      // Type assertion for tasks from the store
      const getTypedTasks = (tasks: any[]): Task[] => {
        return tasks.filter(isValidTask).map(task => ({
          ...task,
          period: task.period && ['morning', 'afternoon', 'evening'].includes(task.period) 
            ? task.period as 'morning' | 'afternoon' | 'evening'
            : undefined
        }))
      }
      
      let tasks: Task[] = []

      // Apply completion filter
      switch (filterType) {
        case "completed":
          tasks = getTypedTasks(taskStore.completedTasks)
          break
        case "pending":
          tasks = getTypedTasks(taskStore.pendingTasks)
          break
        case "reminders":
          tasks = getTypedTasks(taskStore.tasksWithReminders)
          break
        case "all":
        default:
          tasks = getTypedTasks(taskStore.tasksByDueDate)
          break
      }

      // Apply period filter
      if (periodFilter !== "all") {
        tasks = tasks.filter((task) => task.period === periodFilter)
      }

      return tasks
    }, [taskStore, filterType, periodFilter])

    const getFilterButtonText = (filter: FilterType) => {
      switch (filter) {
        case "all":
          return `All (${taskStore.tasks.length})`
        case "completed":
          return `Completed (${taskStore.completedTasks.length})`
        case "pending":
          return `Pending (${taskStore.pendingTasks.length})`
        case "reminders":
          return `Reminders (${taskStore.tasksWithReminders.length})`
      }
    }

    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$styles.flex1}>
        <ListView<Task>
          contentContainerStyle={themed([$styles.container, $listContentContainer])}
          data={filteredTasks}
          extraData={`${filterType}-${periodFilter}-${taskStore.tasks.length}`}
          refreshing={refreshing}
          estimatedItemSize={150}
          onRefresh={manualRefresh}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator />
            ) : (
              <EmptyState
                preset="generic"
                style={themed($emptyState)}
                heading="No tasks found"
                content="Create your first task to get started"
                buttonOnPress={manualRefresh}
              />
            )
          }
          ListHeaderComponent={
            <View>
              <View style={themed($heading)}>
                <Text preset="heading" text="Task Management" />
                <Text 
                  style={themed($subtitle)} 
                  size="md" 
                  text={`${filteredTasks.length} tasks`} 
                />
              </View>
              
              {/* Filter Buttons */}
              <View style={themed($filterContainer)}>
                <Text style={themed($filterLabel)} size="sm" text="Filter by Status:" />
                <View style={themed($filterButtonRow)}>
                  {(["all", "pending", "completed", "reminders"] as FilterType[]).map((filter) => (
                    <Button
                      key={filter}
                      style={themed([
                        $filterButton,
                        filterType === filter && $activeFilterButton
                      ])}
                      textStyle={themed([
                        $filterButtonText,
                        filterType === filter && $activeFilterButtonText
                      ])}
                      text={getFilterButtonText(filter)}
                      onPress={() => setFilterType(filter)}
                    />
                  ))}
                </View>
              </View>

              {/* Period Filter */}
              <View style={themed($filterContainer)}>
                <Text style={themed($filterLabel)} size="sm" text="Filter by Period:" />
                <View style={themed($filterButtonRow)}>
                  {(["all", "morning", "afternoon", "evening"] as PeriodFilter[]).map((period) => (
                    <Button
                      key={period}
                      style={themed([
                        $periodFilterButton,
                        periodFilter === period && $activeFilterButton
                      ])}
                      textStyle={themed([
                        $filterButtonText,
                        periodFilter === period && $activeFilterButtonText
                      ])}
                      text={period.charAt(0).toUpperCase() + period.slice(1)}
                      onPress={() => setPeriodFilter(period)}
                    />
                  ))}
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggleComplete={() => taskStore.toggleTaskCompletion(item.id)}
              onToggleReminder={() => taskStore.toggleTaskReminder(item.id)}
              onDelete={() => taskStore.deleteTask(item.id)}
            />
          )}
        />
      </Screen>
    )
  },
)

const TaskCard = observer(function TaskCard({
  task,
  onToggleComplete,
  onToggleReminder,
  onDelete,
}: {
  task: Task
  onToggleComplete: () => void
  onToggleReminder: () => void
  onDelete: () => void
}) {
  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  const completed = useSharedValue(task.isCompleted ? 1 : 0)
  const reminderEnabled = useSharedValue(task.reminderEnabled ? 1 : 0)

  // Update animation values when task changes
  useEffect(() => {
    completed.value = withSpring(task.isCompleted ? 1 : 0)
    reminderEnabled.value = withSpring(task.reminderEnabled ? 1 : 0)
  }, [task.isCompleted, task.reminderEnabled, completed, reminderEnabled])

  // Completion checkbox animation
  const animatedCheckboxStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(completed.value, [0, 1], [1, 1.2], Extrapolation.CLAMP) }],
      opacity: interpolate(completed.value, [0, 1], [0.6, 1], Extrapolation.CLAMP),
    }
  })

  // Reminder bell animation
  const animatedReminderStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(reminderEnabled.value, [0, 1], [1, 1.1], Extrapolation.CLAMP) }],
      opacity: interpolate(reminderEnabled.value, [0, 1], [0.4, 1], Extrapolation.CLAMP),
    }
  })

  const handleToggleComplete = useCallback(() => {
    onToggleComplete()
    completed.value = withSpring(completed.value ? 0 : 1)
  }, [completed, onToggleComplete])

  const handleToggleReminder = useCallback(() => {
    onToggleReminder()
    reminderEnabled.value = withSpring(reminderEnabled.value ? 0 : 1)
  }, [reminderEnabled, onToggleReminder])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ""
    const time = new Date(timeString)
    return time.toLocaleTimeString(undefined, { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getPeriodIcon = (period?: string) => {
    switch (period) {
      case "morning":
        return "sun"
      case "afternoon":
        return "sun"
      case "evening":
        return "moon"
      default:
        return "clock"
    }
  }

  const getPeriodColor = (period?: string) => {
    switch (period) {
      case "morning":
        return colors.palette.primary300
      case "afternoon":
        return colors.palette.secondary300
      case "evening":
        return colors.palette.neutral500
      default:
        return colors.palette.neutral400
    }
  }

  const CheckboxAccessory: ComponentType<ButtonAccessoryProps> = useMemo(
    () =>
      function CheckboxAccessory() {
        return (
          <Animated.View style={[themed($iconContainer), animatedCheckboxStyles]}>
            <Icon
              icon={task.isCompleted ? "check" : "view"}
              size={ICON_SIZE}
              color={task.isCompleted ? colors.palette.primary400 : colors.palette.neutral600}
            />
          </Animated.View>
        )
      },
    [animatedCheckboxStyles, task.isCompleted, colors, themed],
  )

  const ReminderAccessory: ComponentType<ButtonAccessoryProps> = useMemo(
    () =>
      function ReminderAccessory() {
        return (
          <Animated.View style={[themed($iconContainer), animatedReminderStyles]}>
            <Icon
              icon="bell"
              size={ICON_SIZE}
              
              color={task.reminderEnabled ? colors.palette.primary400 : colors.palette.neutral400}
            />
          </Animated.View>
        )
      },
    [animatedReminderStyles, task.reminderEnabled, colors, themed],
  )

  return (
    <Card
      style={themed([$item, task.isCompleted && $completedItem])}
      verticalAlignment="force-footer-bottom"
      HeadingComponent={
        <View style={[$styles.row, themed($metadata)]}>
          <View style={$styles.row}>
            <Icon
              icon="clap"
              size={12}
              color={getPeriodColor(task.period)}
            />
            <Text
              style={themed($metadataText)}
              size="xxs"
              text={task.period?.toUpperCase() || ""}
            />
          </View>
          {task.dueDate && (
            <Text
              style={themed($metadataText)}
              size="xxs"
              text={formatDate(task.dueDate)}
            />
          )}
          {task.taskTime && (
            <Text
              style={themed($metadataText)}
              size="xxs"
              text={formatTime(task.taskTime)}
            />
          )}
        </View>
      }
      content={task.title}
      contentStyle={themed([task.isCompleted && $completedText])}
      FooterComponent={
        task.description ? (
          <Text
            style={themed([$description, task.isCompleted && $completedText])}
            size="sm"
            text={task.description}
          />
        ) : undefined
      }
      RightComponent={
        <View style={themed($actionButtons)}>
          <Button
            style={themed($actionButton)}
            onPress={handleToggleComplete}
            LeftAccessory={CheckboxAccessory}
          />
          <Button
            style={themed($actionButton)}
            onPress={handleToggleReminder}
            LeftAccessory={ReminderAccessory}
          />
          <Button
            style={themed([$actionButton, $deleteButton])}
            onPress={onDelete}
          >
            <Icon
              icon="x"
              size={ICON_SIZE}
              color={colors.palette.angry500}
            />
          </Button>
        </View>
      }
    />
  )
})

// #region Styles
const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg + spacing.xl,
  paddingBottom: spacing.lg,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  alignItems: "center",
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
})

const $filterContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $filterLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.xs,
  fontWeight: "600",
})

const $filterButtonRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $filterButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderColor: colors.palette.neutral300,
  borderRadius: 16,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  minHeight: 32,
})

const $periodFilterButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderColor: colors.palette.neutral300,
  borderRadius: 16,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  minHeight: 32,
  flex: 1,
  maxWidth: "27%",
})

const $activeFilterButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
  borderColor: colors.palette.primary300,
})

const $filterButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  fontWeight: "500",
})

const $activeFilterButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})

const $item: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  marginTop: spacing.md,
  minHeight: 100,
  backgroundColor: colors.palette.neutral100,
})

const $completedItem: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral100,
  opacity: 0.8,
})

const $completedText: ThemedStyle<TextStyle> = ({ colors }) => ({
  textDecorationLine: "line-through",
  color: colors.textDim,
})

const $description: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
  fontStyle: "italic",
})

const $iconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  // padding: spacing.xs, 
  alignItems: "center",
  justifyContent: "center",
})

const $metadata: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $metadataText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginStart: spacing.xs,
})

const $actionButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderColor: colors.palette.neutral300,
  // borderRadius: 20,
  width: 36,
  height: 20,
  padding: 0,
  alignItems: "center",
  justifyContent: "center",
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.angry100,
  borderColor: colors.palette.angry100,
  borderRadius: 20,
  width: 44,
  height: 20,
  paddingTop: 18,
  alignItems: "center",
  justifyContent: "center",
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxl,
})
// #endregion
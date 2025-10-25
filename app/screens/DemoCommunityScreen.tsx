import { ComponentType, FC, useCallback, useEffect, useMemo, useState } from "react"
import {
  AccessibilityProps,
  ActivityIndicator,
  Image,
  ImageStyle,
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

import { Button, type ButtonAccessoryProps } from "@/components/Button"
import { Card } from "@/components/Card"
import { EmptyState } from "@/components/EmptyState"
import { Icon } from "@/components/Icon"
import { ListView } from "@/components/ListView"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Switch } from "@/components/Toggle/Switch"
import { isRTL } from "@/i18n"
import { DemoTabScreenProps } from "@/navigators/DemoNavigator"
import type { NewsArticle } from "@/models/NewsArticle"
import type { ThemedStyle, Theme } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { $styles } from "@/theme"
import { delay } from "@/utils/delay"
import { openLinkInBrowser } from "@/utils/openLinkInBrowser"
import { useStores } from "@/models"

const ICON_SIZE = 14

// Custom hooks for better separation of concerns
const useNewsData = () => {
  const { newsStore } = useStores()
  const [refreshing, setRefreshing] = useState(false)

  const loadInitialData = useCallback(async () => {
    await newsStore.fetchGlobalHealthcareNews()
  }, [newsStore])

  const manualRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.allSettled([
        newsStore.currentQuery 
          ? newsStore.searchHealthcareNews(newsStore.currentQuery, newsStore.currentCountry || undefined)
          : newsStore.currentCountry
          ? newsStore.fetchCountryHealthcareNews(newsStore.currentCountry)
          : newsStore.fetchGlobalHealthcareNews(),
        delay(750)
      ])
    } finally {
      setRefreshing(false)
    }
  }, [newsStore])

  const loadMore = useCallback(async () => {
    if (!newsStore.hasMoreArticles) return

    try {
      await newsStore.loadMoreArticles()
    } catch (error) {
      console.error('Error loading more articles:', error)
    }
  }, [newsStore])

  return {
    newsStore,
    refreshing,
    loadInitialData,
    manualRefresh,
    loadMore,
  }
}

// Separated header component for better organization
const NewsListHeader: FC<{
  currentModeLabel: string
  favoritesOnly: boolean
  favoriteCount: number
  totalResults: number
  onToggleFavorites: () => void
  hasArticles: boolean
}> = ({ 
  currentModeLabel, 
  favoritesOnly, 
  favoriteCount, 
  totalResults, 
  onToggleFavorites, 
  hasArticles 
}) => {
  const { themed } = useAppTheme()

  return (
    <View style={themed($heading)}>
      <Text preset="heading" text="Healthcare News" />
      <Text 
        preset="default" 
        style={themed($subtitle)} 
        text={currentModeLabel}
      />
      
      {(favoritesOnly || hasArticles) && (
        <View style={themed($toggle)}>
          <Switch
            value={favoritesOnly}
            onValueChange={onToggleFavorites}
            label={`Favorites Only (${favoriteCount})`}
            labelPosition="left"
            labelStyle={$labelStyle}
            accessibilityLabel="Toggle favorites only view"
          />
        </View>
      )}
      
      {totalResults > 0 && (
        <Text 
          preset="formHelper" 
          style={themed($resultsCount)}
          text={`${totalResults} articles found`}
        />
      )}
    </View>
  )
}

// Separated footer component
const NewsListFooter: FC<{ loading: boolean; hasArticles: boolean }> = ({ 
  loading, 
  hasArticles 
}) => {
  const { themed } = useAppTheme()

  if (!loading || !hasArticles) return null

  return (
    <View style={themed($loadingFooter)}>
      <ActivityIndicator />
      <Text preset="default" text="Loading more articles..." style={themed($loadingText)} />
    </View>
  )
}

// Separated empty state component
const NewsEmptyState: FC<{
  loading: boolean
  favoritesOnly: boolean
  onRefresh: () => void
}> = ({ loading, favoritesOnly, onRefresh }) => {
  const { themed } = useAppTheme()

  if (loading) {
    return <ActivityIndicator />
  }

  return (
    <EmptyState
      preset="generic"
      style={themed($emptyState)}
      heading={
        favoritesOnly 
          ? "No Favorite Articles" 
          : "No Healthcare News Available"
      }
      content={
        favoritesOnly 
          ? "You haven't favorited any healthcare articles yet. Browse articles and tap the heart to add them to your favorites." 
          : "Unable to load healthcare news at the moment. Please try refreshing."
      }
      button={favoritesOnly ? "" : "Refresh"}
      buttonOnPress={onRefresh}
      imageStyle={$emptyStateImage}
      ImageProps={{ resizeMode: "contain" }}
    />
  )
}

// Main component - now much cleaner
export const DemoCommunityScreen: FC<DemoTabScreenProps<"DemoCommunity">> = () => {
  const { themed } = useAppTheme()
  const { 
    newsStore, 
    refreshing, 
    loadInitialData, 
    manualRefresh, 
    loadMore 
  } = useNewsData()

  const {
    articlesForList,
    loading,
    favoritesOnly,
    currentModeLabel,
    totalResults,
    favoriteCount,
  } = newsStore

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const handleToggleFavorites = useCallback(() => {
    newsStore.toggleFavoritesOnly()
  }, [newsStore])

  const handleToggleFavorite = useCallback((article: NewsArticle) => {
    newsStore.toggleFavorite(article)
  }, [newsStore])

  const renderItem = useCallback(({ item }: { item: NewsArticle }) => (
    <NewsArticleCard 
      article={item} 
      onPressFavorite={() => handleToggleFavorite(item)}
      isFavorite={newsStore.hasFavorite(item)}
    />
  ), [handleToggleFavorite, newsStore])

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$styles.flex1}>
      <ListView<NewsArticle>
        contentContainerStyle={themed([$styles.container, $listContentContainer])}
        data={articlesForList}
        extraData={articlesForList.length}
        refreshing={refreshing}
        estimatedItemSize={200}
        onRefresh={manualRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <NewsEmptyState 
            loading={loading}
            favoritesOnly={favoritesOnly}
            onRefresh={manualRefresh}
          />
        }
        ListHeaderComponent={
          <NewsListHeader
            currentModeLabel={currentModeLabel}
            favoritesOnly={favoritesOnly}
            favoriteCount={favoriteCount}
            totalResults={totalResults}
            onToggleFavorites={handleToggleFavorites}
            hasArticles={articlesForList.length > 0}
          />
        }
        ListFooterComponent={
          <NewsListFooter 
            loading={loading} 
            hasArticles={articlesForList.length > 0} 
          />
        }
        renderItem={renderItem}
      />
    </Screen>
  )
}

// Animated heart button component
const AnimatedHeartButton: FC<{
  isFavorite: boolean
  onPress: () => void
}> = ({ isFavorite, onPress }) => {
  const { theme: { colors }, themed } = useAppTheme()
  const liked = useSharedValue(isFavorite ? 1 : 0)

  useEffect(() => {
    liked.value = withSpring(isFavorite ? 1 : 0)
  }, [isFavorite, liked])

  const animatedLikeButtonStyles = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.EXTEND) }],
    opacity: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }))

  const animatedUnlikeButtonStyles = useAnimatedStyle(() => ({
    transform: [{ scale: liked.value }],
    opacity: liked.value,
  }))

  const handlePress = useCallback(() => {
    onPress()
    liked.value = withSpring(liked.value ? 0 : 1)
  }, [liked, onPress])

  const ButtonLeftAccessory: ComponentType<ButtonAccessoryProps> = useMemo(
    () => function ButtonLeftAccessory() {
      return (
        <View>
          <Animated.View
            style={[
              $styles.row,
              themed($iconContainer),
              StyleSheet.absoluteFill,
              animatedLikeButtonStyles,
            ]}
          >
            <Icon icon="heart" size={ICON_SIZE} color={colors.palette.neutral800} />
          </Animated.View>
          <Animated.View
            style={[$styles.row, themed($iconContainer), animatedUnlikeButtonStyles]}
          >
            <Icon icon="heart" size={ICON_SIZE} color={colors.palette.primary400} />
          </Animated.View>
        </View>
      )
    },
    [animatedLikeButtonStyles, animatedUnlikeButtonStyles, colors, themed],
  )

  return (
    <Button
      onPress={handlePress}
      onLongPress={handlePress}
      style={themed([$favoriteButton, isFavorite && $unFavoriteButton])}
      accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
      LeftAccessory={ButtonLeftAccessory}
    >
      <Text
        size="xxs"
        weight="medium"
        text={isFavorite ? "Unfavorite" : "Favorite"}
      />
    </Button>
  )
}

// News article card component - simplified
const NewsArticleCard: FC<{
  article: NewsArticle
  onPressFavorite: () => void
  isFavorite: boolean
}> = ({ article, onPressFavorite, isFavorite }) => {
  const { themed } = useAppTheme()

  const imageSource = useMemo(() => 
    article.image_url ? { uri: article.image_url } : undefined
  , [article.image_url])

  const accessibilityProps = useMemo(
    (): AccessibilityProps => ({
      accessibilityLabel: article.title,
      accessibilityActions: [{ name: "longpress", label: "Toggle favorite" }],
      onAccessibilityAction: ({ nativeEvent }) => {
        if (nativeEvent.actionName === "longpress") {
          onPressFavorite()
        }
      },
      accessibilityRole: "button",
      accessibilityHint: "Tap to view article, long press to toggle favorite",
    }),
    [article.title, onPressFavorite, isFavorite],
  )

  const handlePressCard = useCallback(() => {
    openLinkInBrowser(article.link)
  }, [article.link])

  return (
    <Card
      style={themed($item)}
      verticalAlignment="force-footer-bottom"
      onPress={handlePressCard}
      onLongPress={onPressFavorite}
      {...accessibilityProps}
      HeadingComponent={
        <View style={[$styles.row, themed($metadata)]}>
          <Text style={themed($metadataText)} size="xxs" text={article.timeAgo} />
          <Text style={themed($metadataText)} size="xxs" text={article.source_name} />
          {article.primaryCountry && (
            <Text style={themed($metadataText)} size="xxs" text={article.primaryCountry} />
          )}
        </View>
      }
      content={article.title}
      RightComponent={
        imageSource ? (
          <Image source={imageSource} style={themed($itemThumbnail)} />
        ) : undefined
      }
      FooterComponent={
        <View>
          {article.shortDescription && (
            <Text 
              style={themed($description)} 
              size="sm" 
              text={article.shortDescription}
            />
          )}
          <AnimatedHeartButton 
            isFavorite={isFavorite}
            onPress={onPressFavorite}
          />
        </View>
      }
    />
  )
}

// Styles remain the same
const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg + spacing.xl,
  paddingBottom: spacing.lg,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
})

const $resultsCount: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.sm,
})

const $item: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  marginTop: spacing.md,
  minHeight: 140,
  backgroundColor: colors.palette.neutral100,
})

const $itemThumbnail: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  borderRadius: 8,
  alignSelf: "flex-start",
  width: 80,
  height: 80,
})

const $description: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
})

const $toggle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $labelStyle: TextStyle = {
  textAlign: "left",
}

const $iconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: ICON_SIZE,
  width: ICON_SIZE,
  marginEnd: spacing.sm,
})

const $metadata: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $metadataText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginEnd: spacing.md,
  marginBottom: spacing.xs,
})

const $favoriteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 17,
  marginTop: spacing.md,
  justifyContent: "flex-start",
  backgroundColor: colors.palette.neutral300,
  borderColor: colors.palette.neutral300,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.xxxs,
  paddingBottom: 0,
  minHeight: 32,
  alignSelf: "flex-start",
})

const $unFavoriteButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary100,
  backgroundColor: colors.palette.primary100,
})

const $loadingFooter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.lg,
  alignItems: "center",
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.sm,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxl,
})

const $emptyStateImage: ImageStyle = {
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}
import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { api } from "../services/api"
import { NewsArticle, NewsArticleModel } from "./NewsArticle"
import { withSetPropAction } from "./helpers/withSetPropAction"

// TypeScript interfaces for better type safety and documentation
interface NewsStoreProps {
  articles: NewsArticle[]
  favorites: NewsArticle[]
  favoritesOnly: boolean
  loading: boolean
  currentCountry: string
  currentQuery: string
  totalResults: number
  nextPage: string | null
}

interface NewsStoreActions {
  fetchGlobalHealthcareNews: (page?: string) => Promise<void>
  fetchCountryHealthcareNews: (country: string, page?: string) => Promise<void>
  searchHealthcareNews: (query: string, country?: string, page?: string) => Promise<void>
  loadMoreArticles: () => Promise<void>
  addFavorite: (article: NewsArticle) => void
  removeFavorite: (article: NewsArticle) => void
  clearArticles: () => void
  toggleFavorite: (article: NewsArticle) => void
  toggleFavoritesOnly: () => void
}

interface NewsStoreViews {
  articlesForList: NewsArticle[]
  hasMoreArticles: boolean
  isSearchMode: boolean
  isCountryMode: boolean
  currentModeLabel: string
  hasFavorite: (article: NewsArticle) => boolean
  favoriteCount: number
  getArticlesByCategory: (category: string) => NewsArticle[]
  getRecentArticles: (days?: number) => NewsArticle[]
}

export const NewsStoreModel = types
  .model("NewsStore")
  .props({
    articles: types.array(NewsArticleModel),
    // Store favorites as plain objects instead of references to avoid reference resolution issues
    favoriteArticles: types.array(NewsArticleModel),
    favoritesOnly: false,
    loading: false,
    currentCountry: types.optional(types.string, ""),
    currentQuery: types.optional(types.string, ""),
    totalResults: 0,
    nextPage: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)
  .actions((store) => {
    // Core API methods
    const fetchGlobalHealthcareNews = async (page?: string): Promise<void> => {
      store.setProp("loading", true)
      try {
        const response = await api.getGlobalHealthcareNews(page)
        if (response.kind === "ok") {
          // Ensure articles have proper IDs and data before adding to store
          const validArticles = response.articles.filter(article => 
            article && article.article_id && typeof article.article_id === 'string'
          )
          
          if (page && store.nextPage) {
            // For pagination, append to existing articles
            store.setProp("articles", [...store.articles, ...validArticles])
          } else {
            // For new search, replace articles
            store.setProp("articles", validArticles)
          }
          store.setProp("totalResults", response.totalResults)
          store.setProp("nextPage", response.nextPage || null)
          store.setProp("currentCountry", "")
          store.setProp("currentQuery", "")
        } else {
          console.error(`Error fetching global healthcare news: ${JSON.stringify(response)}`)
        }
      } catch (error) {
        console.error("Error in fetchGlobalHealthcareNews:", error)
      } finally {
        store.setProp("loading", false)
      }
    }

    const fetchCountryHealthcareNews = async (country: string, page?: string): Promise<void> => {
      store.setProp("loading", true)
      try {
        const response = await api.getCountryHealthcareNews(country, page)
        if (response.kind === "ok") {
          // Ensure articles have proper IDs and data before adding to store
          const validArticles = response.articles.filter(article => 
            article && article.article_id && typeof article.article_id === 'string'
          )
          
          if (page && store.nextPage) {
            store.setProp("articles", [...store.articles, ...validArticles])
          } else {
            store.setProp("articles", validArticles)
          }
          store.setProp("totalResults", response.totalResults)
          store.setProp("nextPage", response.nextPage || null)
          store.setProp("currentCountry", country)
          store.setProp("currentQuery", "")
        } else {
          console.error(`Error fetching ${country} healthcare news: ${JSON.stringify(response)}`)
        }
      } catch (error) {
        console.error("Error in fetchCountryHealthcareNews:", error)
      } finally {
        store.setProp("loading", false)
      }
    }

    const searchHealthcareNews = async (query: string, country?: string, page?: string): Promise<void> => {
      store.setProp("loading", true)
      try {
        const response = await api.searchHealthcareNews(query, country, page)
        if (response.kind === "ok") {
          // Ensure articles have proper IDs and data before adding to store
          const validArticles = response.articles.filter(article => 
            article && article.article_id && typeof article.article_id === 'string'
          )
          
          if (page && store.nextPage) {
            store.setProp("articles", [...store.articles, ...validArticles])
          } else {
            store.setProp("articles", validArticles)
          }
          store.setProp("totalResults", response.totalResults)
          store.setProp("nextPage", response.nextPage || null)
          store.setProp("currentQuery", query)
          store.setProp("currentCountry", country || "")
        } else {
          console.error(`Error searching healthcare news: ${JSON.stringify(response)}`)
        }
      } catch (error) {
        console.error("Error in searchHealthcareNews:", error)
      } finally {
        store.setProp("loading", false)
      }
    }

    const loadMoreArticles = async (): Promise<void> => {
      if (!store.nextPage || store.loading) return

      if (store.currentQuery) {
        await searchHealthcareNews(
          store.currentQuery,
          store.currentCountry || undefined,
          store.nextPage
        )
      } else if (store.currentCountry) {
        await fetchCountryHealthcareNews(store.currentCountry, store.nextPage)
      } else {
        await fetchGlobalHealthcareNews(store.nextPage)
      }
    }

    const addFavorite = (article: NewsArticle): void => {
      if (!store.favoriteArticles.some(fav => fav.article_id === article.article_id)) {
        store.favoriteArticles.push(article)
      }
    }

    const removeFavorite = (article: NewsArticle): void => {
      const index = store.favoriteArticles.findIndex(fav => fav.article_id === article.article_id)
      if (index !== -1) {
        store.favoriteArticles.splice(index, 1)
      }
    }

    const clearArticles = (): void => {
      store.setProp("articles", [])
      store.setProp("totalResults", 0)
      store.setProp("nextPage", null)
      store.setProp("currentQuery", "")
      store.setProp("currentCountry", "")
    }

    const cleanupInvalidFavorites = (): void => {
      // Remove any favorites that might have invalid references
      const validFavorites = store.favoriteArticles.filter(fav => 
        fav && fav.article_id && typeof fav.article_id === 'string'
      )
      if (validFavorites.length !== store.favoriteArticles.length) {
        store.setProp("favoriteArticles", validFavorites)
      }
    }

    const toggleFavoritesOnly = (): void => {
      store.setProp("favoritesOnly", !store.favoritesOnly)
    }

    return {
      fetchGlobalHealthcareNews,
      fetchCountryHealthcareNews,
      searchHealthcareNews,
      loadMoreArticles,
      addFavorite,
      removeFavorite,
      clearArticles,
      cleanupInvalidFavorites,
      toggleFavoritesOnly,
    }
  })
  .views((store) => ({
    get articlesForList(): NewsArticle[] {
      return store.favoritesOnly ? store.favoriteArticles.slice() : store.articles
    },

    get hasMoreArticles(): boolean {
      return !!store.nextPage && !store.loading
    },

    get isSearchMode(): boolean {
      return !!store.currentQuery
    },

    get isCountryMode(): boolean {
      return !!store.currentCountry && !store.currentQuery
    },

    get currentModeLabel(): string {
      if (store.currentQuery) {
        return `Search: "${store.currentQuery}"${store.currentCountry ? ` in ${store.currentCountry}` : ""}`
      }
      if (store.currentCountry) {
        return `${store.currentCountry} Healthcare News`
      }
      return "Global Healthcare News"
    },

    hasFavorite(article: NewsArticle): boolean {
      return store.favoriteArticles.some(fav => fav.article_id === article.article_id)
    },

    get favoriteCount(): number {
      return store.favoriteArticles.length
    },

    get favorites(): NewsArticle[] {
      return store.favoriteArticles.slice()
    },

    getArticlesByCategory(category: string): NewsArticle[] {
      return store.articles.filter(article => 
        article.category?.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
      )
    },

    getRecentArticles(days: number = 7): NewsArticle[] {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      return store.articles.filter(article => {
        try {
          const pubDate = new Date(article.pubDate)
          return pubDate >= cutoffDate
        } catch {
          return false
        }
      })
    },
  }))
  .actions((store) => ({
    // Actions that depend on views - must come after views are defined
    // Clean up method that can be called from UI components
    toggleFavorite(article: NewsArticle): void {
      // Clean up any invalid favorites first
      store.cleanupInvalidFavorites()
      
      if (store.hasFavorite(article)) {
        store.removeFavorite(article)
      } else {
        store.addFavorite(article)
      }
    },
  }))

export interface NewsStore extends Instance<typeof NewsStoreModel> {}
export interface NewsStoreSnapshotOut extends SnapshotOut<typeof NewsStoreModel> {}
export interface NewsStoreSnapshotIn extends SnapshotIn<typeof NewsStoreModel> {}

export const createNewsStoreDefaultModel = () => types.optional(NewsStoreModel, {})
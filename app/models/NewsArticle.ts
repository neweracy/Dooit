import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

/**
 * NewsArticle model for healthcare news articles with proper null handling
 */
export const NewsArticleModel = types
  .model("NewsArticle")
  .props({
    article_id: types.identifier,
    title: types.optional(types.string, ""),
    link: types.optional(types.string, ""),
    keywords: types.maybeNull(types.array(types.string)),
    creator: types.maybeNull(types.array(types.string)),
    description: types.maybeNull(types.string), // Allow null from API
    content: types.maybeNull(types.string), // Allow null from API
    pubDate: types.string,
    pubDateTZ: types.optional(types.string, ""),
    image_url: types.maybeNull(types.string),
    video_url: types.maybeNull(types.string),
    source_id: types.string,
    source_name: types.string,
    source_priority: types.optional(types.number, 0),
    source_url: types.string,
    source_icon: types.optional(types.string, ""),
    language: types.optional(types.string, "en"),
    country: types.maybeNull(types.array(types.string)),
    category: types.maybeNull(types.array(types.string)),
    ai_tag: types.optional(types.string, ""),
    sentiment: types.optional(types.string, ""),
    ai_summary: types.optional(types.string, ""),
  })
  .actions(withSetPropAction)
  .views((article) => ({
    get formattedDate() {
      try {
        return new Date(article.pubDate).toLocaleDateString()
      } catch {
        return article.pubDate
      }
    },

    get formattedDateTime() {
      try {
        return new Date(article.pubDate).toLocaleString()
      } catch {
        return article.pubDate
      }
    },

    get timeAgo() {
      try {
        const now = new Date()
        const pubDate = new Date(article.pubDate)
        const diffInMs = now.getTime() - pubDate.getTime()
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
        
        if (diffInMinutes < 1) return "Just now"
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`
        if (diffInHours < 24) return `${diffInHours}h ago`
        if (diffInDays < 30) return `${diffInDays}d ago`
        
        const diffInMonths = Math.floor(diffInDays / 30)
        if (diffInMonths < 12) return `${diffInMonths}mo ago`
        
        const diffInYears = Math.floor(diffInMonths / 12)
        return `${diffInYears}y ago`
      } catch {
        return ""
      }
    },

    get hasImage() {
      return !!article.image_url
    },

    get hasVideo() {
      return !!article.video_url
    },

    get hasMultimedia() {
      return !!article.image_url || !!article.video_url
    },

    get primaryCategory() {
      const categories = article.category || []
      return categories.length > 0 ? categories[0] : "General"
    },

    get allCategories() {
      const categories = article.category || []
      return categories.join(", ") || "General"
    },

    get primaryCountry() {
      const countries = article.country || []
      return countries.length > 0 ? countries[0] : "Global"
    },

    get allCountries() {
      const countries = article.country || []
      return countries.join(", ") || "Global"
    },

    get authorName() {
      const creators = article.creator || []
      return creators.length > 0 ? creators.join(", ") : "Unknown"
    },

    get firstAuthor() {
      const creators = article.creator || []
      return creators.length > 0 ? creators[0] : "Unknown"
    },

    get shortDescription() {
      if (!article.description) return ""
      if (article.description.length <= 100) return article.description
      return article.description.substring(0, 100) + "..."
    },

    get mediumDescription() {
      if (!article.description) return ""
      if (article.description.length <= 200) return article.description
      return article.description.substring(0, 200) + "..."
    },

    get keywordsList() {
      const keywords = article.keywords || []
      return keywords.join(", ")
    },

    get isHealthRelated() {
      const healthKeywords = [
        "health", "medical", "healthcare", "medicine", "hospital", "doctor", 
        "disease", "treatment", "patient", "clinic", "therapy", "diagnosis",
        "pharmaceutical", "vaccine", "epidemic", "pandemic", "wellness"
      ]
      const searchText = `${article.title || ""} ${article.description || ""} ${(article.keywords || []).join(" ")}`.toLowerCase()
      return healthKeywords.some(keyword => searchText.includes(keyword))
    },

    get isRecent() {
      try {
        const now = new Date()
        const pubDate = new Date(article.pubDate)
        const diffInHours = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60)
        return diffInHours <= 24 // Within last 24 hours
      } catch {
        return false
      }
    },

    get isToday() {
      try {
        const now = new Date()
        const pubDate = new Date(article.pubDate)
        return now.toDateString() === pubDate.toDateString()
      } catch {
        return false
      }
    },

    get sourcePriorityLabel() {
      if (article.source_priority <= 1000) return "High Priority"
      if (article.source_priority <= 5000) return "Medium Priority"
      return "Low Priority"
    },

    get sourcePriorityBadgeColor() {
      if (article.source_priority <= 1000) return "green"
      if (article.source_priority <= 5000) return "yellow"
      return "gray"
    },

    get sentimentLabel() {
      switch (article.sentiment?.toLowerCase()) {
        case "positive": return "Positive"
        case "negative": return "Negative"
        case "neutral": return "Neutral"
        default: return "Unknown"
      }
    },

    get sentimentColor() {
      switch (article.sentiment?.toLowerCase()) {
        case "positive": return "green"
        case "negative": return "red"
        case "neutral": return "blue"
        default: return "gray"
      }
    },

    get isGhanaNews() {
      const countries = article.country || []
      return countries.some(country => country === "GH" || country === "Ghana")
    },

    get shareUrl() {
      return article.link
    },

    get displayTitle() {
      return article.title || "Untitled Article"
    },

    get hasContent() {
      return !!(article.content && article.content.trim().length > 0)
    },

    get contentPreview() {
      if (!article.content) return article.description || ""
      if (article.content.length <= 150) return article.content
      return article.content.substring(0, 150) + "..."
    },

    get readingTimeEstimate() {
      const wordsPerMinute = 200
      const contentLength = (article.content || article.description || "").length
      const wordCount = contentLength / 5 // Rough estimate: 5 characters per word
      const minutes = Math.ceil(wordCount / wordsPerMinute)
      return minutes > 0 ? `${minutes} min read` : "< 1 min read"
    },
  }))
  .actions((article) => ({
    markAsRead() {
      // Could be used to track read status
    },

    updateSentiment(sentiment: string) {
      article.setProp("sentiment", sentiment)
    },

    updateAiSummary(summary: string) {
      article.setProp("ai_summary", summary)
    },
  }))

export interface NewsArticle extends Instance<typeof NewsArticleModel> {}
export interface NewsArticleSnapshotOut extends SnapshotOut<typeof NewsArticleModel> {}
export interface NewsArticleSnapshotIn extends SnapshotIn<typeof NewsArticleModel> {}
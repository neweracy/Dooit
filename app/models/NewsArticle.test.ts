import { NewsArticleModel } from "./NewsArticle"

describe("NewsArticle", () => {
  const createTestArticle = (overrides = {}) => {
    return NewsArticleModel.create({
      article_id: "test-1",
      title: "Test Health Article",
      link: "https://example.com/article",
      pubDate: "2024-01-15T10:30:00Z",
      source_id: "test-source",
      source_name: "Healthcare Today",
      source_url: "https://healthcaretoday.com",
      keywords: ["health", "medicine"],
      creator: ["Dr. Jane Smith"],
      description: "This is a test article about healthcare developments and medical research findings.",
      content: "Full article content with detailed information about healthcare trends and medical breakthroughs.",
      country: ["US", "GH"],
      category: ["health", "medicine"],
      source_priority: 1500,
      sentiment: "positive",
      image_url: "https://example.com/image.jpg",
      ...overrides,
    })
  }

  test("can be created with minimal props", () => {
    const instance = NewsArticleModel.create({
      article_id: "1",
      title: "Test Article",
      link: "https://example.com/test",
      pubDate: new Date().toISOString(),
      source_id: "source1",
      source_name: "Test Source",
      source_url: "https://example.com/source",
    })

    expect(instance).toBeTruthy()
    expect(instance.keywords).toEqual([])
    expect(instance.description).toBe("")
    expect(instance.language).toBe("en")
  })

  describe("date views", () => {
    test("formats dates correctly", () => {
      const article = createTestArticle({ pubDate: "2024-01-15T10:30:00Z" })
      
      expect(article.formattedDate).toMatch(/2024/)
      expect(article.formattedDateTime).toContain("2024")
    })

    test("handles invalid dates", () => {
      const article = createTestArticle({ pubDate: "invalid-date" })
      expect(article.formattedDate).toBe("invalid-date")
      expect(article.timeAgo).toBe("")
    })

    test("calculates time ago", () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const article = createTestArticle({ pubDate: oneHourAgo.toISOString() })
      expect(article.timeAgo).toBe("1h ago")
    })
  })

  describe("multimedia views", () => {
    test("detects multimedia presence", () => {
      const withImage = createTestArticle({ image_url: "test.jpg", video_url: null })
      const withVideo = createTestArticle({ image_url: null, video_url: "test.mp4" })
      const withNeither = createTestArticle({ image_url: null, video_url: null })

      expect(withImage.hasImage).toBe(true)
      expect(withImage.hasMultimedia).toBe(true)
      expect(withVideo.hasVideo).toBe(true)
      expect(withNeither.hasMultimedia).toBe(false)
    })
  })

  describe("content views", () => {
    test("handles categories and countries", () => {
      const article = createTestArticle({ category: ["health", "medicine"], country: ["US", "CA"] })
      const empty = createTestArticle({ category: [], country: [] })

      expect(article.primaryCategory).toBe("health")
      expect(article.allCategories).toBe("health, medicine")
      expect(article.primaryCountry).toBe("US")
      expect(empty.primaryCategory).toBe("General")
      expect(empty.allCountries).toBe("Global")
    })

    test("handles authors", () => {
      const withAuthors = createTestArticle({ creator: ["John Doe", "Jane Smith"] })
      const withoutAuthors = createTestArticle({ creator: [] })

      expect(withAuthors.authorName).toBe("John Doe, Jane Smith")
      expect(withAuthors.firstAuthor).toBe("John Doe")
      expect(withoutAuthors.authorName).toBe("Unknown")
    })

    test("truncates descriptions", () => {
      const longDesc = "A".repeat(150)
      const article = createTestArticle({ description: longDesc })

      expect(article.shortDescription).toBe("A".repeat(100) + "...")
      expect(article.mediumDescription).toBe("A".repeat(150))
    })
  })

  describe("health detection", () => {
    test("detects health-related content", () => {
      const healthArticle = createTestArticle({ 
        title: "Medical Breakthrough", 
        description: "", 
        keywords: [] 
      })
      const nonHealthArticle = createTestArticle({ 
        title: "Tech Update", 
        description: "Software news", 
        keywords: ["tech"] 
      })

      expect(healthArticle.isHealthRelated).toBe(true)
      expect(nonHealthArticle.isHealthRelated).toBe(false)
    })
  })

  describe("priority and sentiment", () => {
    test("categorizes source priority", () => {
      const highPriority = createTestArticle({ source_priority: 500 })
      const lowPriority = createTestArticle({ source_priority: 8000 })

      expect(highPriority.sourcePriorityLabel).toBe("High Priority")
      expect(highPriority.sourcePriorityBadgeColor).toBe("green")
      expect(lowPriority.sourcePriorityLabel).toBe("Low Priority")
      expect(lowPriority.sourcePriorityBadgeColor).toBe("gray")
    })

    test("handles sentiment", () => {
      const positive = createTestArticle({ sentiment: "positive" })
      const unknown = createTestArticle({ sentiment: "" })

      expect(positive.sentimentLabel).toBe("Positive")
      expect(positive.sentimentColor).toBe("green")
      expect(unknown.sentimentLabel).toBe("Unknown")
      expect(unknown.sentimentColor).toBe("gray")
    })
  })

  describe("Ghana detection", () => {
    test("identifies Ghana news", () => {
      const ghanaCode = createTestArticle({ country: ["GH"] })
      const ghanaName = createTestArticle({ country: ["Ghana"] })
      const nonGhana = createTestArticle({ country: ["US"] })

      expect(ghanaCode.isGhanaNews).toBe(true)
      expect(ghanaName.isGhanaNews).toBe(true)
      expect(nonGhana.isGhanaNews).toBe(false)
    })
  })

  describe("utility views", () => {
    test("provides utility properties", () => {
      const article = createTestArticle({ 
        content: "Test content",
        title: "Test Title",
        keywords: ["health", "test"]
      })
      const emptyTitle = createTestArticle({ title: "" })

      expect(article.hasContent).toBe(true)
      expect(article.displayTitle).toBe("Test Title")
      expect(article.shareUrl).toBe("https://example.com/article")
      expect(article.keywordsList).toBe("health, test")
      expect(article.readingTimeEstimate).toMatch(/min read/)
      expect(emptyTitle.displayTitle).toBe("Untitled Article")
    })
  })

  describe("actions", () => {
    test("updates from API data", () => {
      const article = createTestArticle({ title: "Original" })
      
      article.updateFromApi({ title: "Updated", sentiment: "negative" })
      
      expect(article.title).toBe("Updated")
      expect(article.sentiment).toBe("negative")
    })

    test("updates sentiment and AI summary", () => {
      const article = createTestArticle()
      
      article.updateSentiment("neutral")
      article.updateAiSummary("AI summary")
      
      expect(article.sentiment).toBe("neutral")
      expect(article.ai_summary).toBe("AI summary")
    })

    test("markAsRead executes without error", () => {
      const article = createTestArticle()
      expect(() => article.markAsRead()).not.toThrow()
    })
  })
})
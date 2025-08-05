import { NewsStoreModel } from "./NewsStore"

describe("NewsStore", () => {
  test("can be created", () => {
    const instance = NewsStoreModel.create({})
    expect(instance).toBeTruthy()
  })

  test("can be created with default values", () => {
    const instance = NewsStoreModel.create({})
    
    expect(instance.articles).toEqual([])
    expect(instance.favorites).toEqual([])
    expect(instance.favoritesOnly).toBe(false)
    expect(instance.loading).toBe(false)
    expect(instance.currentCountry).toBe("")
    expect(instance.currentQuery).toBe("")
    expect(instance.totalResults).toBe(0)
    expect(instance.nextPage).toBe(null)
  })

  test("can toggle favoritesOnly", () => {
    const instance = NewsStoreModel.create({})

    expect(instance.favoritesOnly).toBe(false)
    
    instance.toggleFavoritesOnly()
    expect(instance.favoritesOnly).toBe(true)

    instance.toggleFavoritesOnly()
    expect(instance.favoritesOnly).toBe(false)
  })

  test("can clear articles", () => {
    const instance = NewsStoreModel.create({
      articles: [],
      totalResults: 10,
      nextPage: "page2",
      currentQuery: "test query",
      currentCountry: "US"
    })

    instance.clearArticles()

    expect(instance.articles).toEqual([])
    expect(instance.totalResults).toBe(0)
    expect(instance.nextPage).toBe(null)
    expect(instance.currentQuery).toBe("")
    expect(instance.currentCountry).toBe("")
  })

  test("view properties work correctly", () => {
    const instance = NewsStoreModel.create({})

    expect(instance.articlesForList).toEqual([])
    expect(instance.hasMoreArticles).toBe(false)
    expect(instance.isSearchMode).toBe(false)
    expect(instance.isCountryMode).toBe(false)
    expect(instance.currentModeLabel).toBe("Global Healthcare News")
    expect(instance.favoriteCount).toBe(0)
  })

  test("currentModeLabel updates based on state", () => {
    const instance = NewsStoreModel.create({})

    // Default state
    expect(instance.currentModeLabel).toBe("Global Healthcare News")

    // Country mode
    instance.setProp("currentCountry", "US")
    expect(instance.currentModeLabel).toBe("US Healthcare News")

    // Search mode
    instance.setProp("currentQuery", "covid")
    expect(instance.currentModeLabel).toBe('Search: "covid" in US')

    // Search without country
    instance.setProp("currentCountry", "")
    expect(instance.currentModeLabel).toBe('Search: "covid"')
  })

  test("mode detection works correctly", () => {
    const instance = NewsStoreModel.create({})

    // Default state
    expect(instance.isSearchMode).toBe(false)
    expect(instance.isCountryMode).toBe(false)

    // Country mode
    instance.setProp("currentCountry", "US")
    expect(instance.isSearchMode).toBe(false)
    expect(instance.isCountryMode).toBe(true)

    // Search mode (overrides country mode)
    instance.setProp("currentQuery", "covid")
    expect(instance.isSearchMode).toBe(true)
    expect(instance.isCountryMode).toBe(false)
  })

  test("hasMoreArticles works correctly", () => {
    const instance = NewsStoreModel.create({})

    // No next page
    expect(instance.hasMoreArticles).toBe(false)

    // Has next page but loading
    instance.setProp("nextPage", "page2")
    instance.setProp("loading", true)
    expect(instance.hasMoreArticles).toBe(false)

    // Has next page and not loading
    instance.setProp("loading", false)
    expect(instance.hasMoreArticles).toBe(true)
  })
})
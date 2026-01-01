/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"
import type { ApiConfig } from "./api.types"

// NewsData.io API types
export interface NewsArticle {
  article_id: string
  title: string
  link: string
  keywords: string[]
  creator: string[]
  description: string
  content: string
  pubDate: string
  pubDateTZ: string
  image_url: string | null
  video_url: string | null
  source_id: string
  source_name: string
  source_priority: number
  source_url: string
  source_icon: string
  language: string
  country: string[]
  category: string[]
  ai_tag?: string
  sentiment?: string
  ai_summary?: string
}

export interface NewsDataResponse {
  status: string
  totalResults: number
  results: NewsArticle[]
  nextPage?: string
}

export interface NewsSource {
  id: string
  name: string
  url: string
  category: string[]
  language: string[]
  country: string[]
  description: string
  status: string
}

export interface NewsSourcesResponse {
  status: string
  results: NewsSource[]
}

export interface NewsSearchParams {
  q?: string
  country?: string
  category?: string
  language?: string
  from_date?: string
  to_date?: string
  page?: string
}

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

/**
 * NewsData.io API configuration
 */
export const NEWSDATA_API_CONFIG = {
  baseURL: "https://newsdata.io/api/1/",
  apiKey: "pub_ba0b6114ab7a4c4bb4c770a6fe1de3fd",
  timeout: 15000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  newsDataApi: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })

    // Set up NewsData.io API instance
    this.newsDataApi = create({
      baseURL: NEWSDATA_API_CONFIG.baseURL,
      timeout: NEWSDATA_API_CONFIG.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  /**
   * Gets latest news articles from NewsData.io
   */
  async getLatestNews(params: NewsSearchParams = {}): Promise<{ kind: "ok"; articles: NewsArticle[]; totalResults: number; nextPage?: string } | GeneralApiProblem> {
    // Build query parameters
    const queryParams = {
      apikey: NEWSDATA_API_CONFIG.apiKey,
      ...params,
    }

    const response: ApiResponse<NewsDataResponse> = await this.newsDataApi.get("latest", queryParams)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const rawData = response.data

      if (rawData?.status !== "success") {
        return { kind: "bad-data" }
      }

      return {
        kind: "ok",
        articles: rawData.results || [],
        totalResults: rawData.totalResults || 0,
        nextPage: rawData.nextPage,
      }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets global healthcare news
   */
  async getGlobalHealthcareNews(page?: string): Promise<{ kind: "ok"; articles: NewsArticle[]; totalResults: number; nextPage?: string } | GeneralApiProblem> {
    return this.getLatestNews({
      category: "health",
      language: "en",
      ...(page && { page }),
    })
  }

  /**
   * Gets healthcare news for a specific country
   */
  async getCountryHealthcareNews(country: string, page?: string): Promise<{ kind: "ok"; articles: NewsArticle[]; totalResults: number; nextPage?: string } | GeneralApiProblem> {
    return this.getLatestNews({
      country,
      category: "health",
      language: "en",
      ...(page && { page }),
    })
  }

  /**
   * Gets Ghana-specific healthcare news
   */
  async getGhanaHealthcareNews(page?: string): Promise<{ kind: "ok"; articles: NewsArticle[]; totalResults: number; nextPage?: string } | GeneralApiProblem> {
    return this.getCountryHealthcareNews("GH", page)
  }

  /**
   * Search for specific healthcare topics
   */
  async searchHealthcareNews(query: string, country?: string, page?: string): Promise<{ kind: "ok"; articles: NewsArticle[]; totalResults: number; nextPage?: string } | GeneralApiProblem> {
    return this.getLatestNews({
      q: query,
      category: "health",
      language: "en",
      ...(country && { country }),
      ...(page && { page }),
    })
  }

  /**
   * Gets archived healthcare news within a date range
   */
  async getHealthcareNewsArchive(fromDate: string, toDate: string, query?: string, country?: string): Promise<{ kind: "ok"; articles: NewsArticle[]; totalResults: number; nextPage?: string } | GeneralApiProblem> {
    const queryParams = {
      apikey: NEWSDATA_API_CONFIG.apiKey,
      from_date: fromDate,
      to_date: toDate,
      language: "en",
      ...(query && { q: query }),
      ...(country && { country }),
    }

    const response: ApiResponse<NewsDataResponse> = await this.newsDataApi.get("archive", queryParams)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const rawData = response.data

      if (rawData?.status !== "success") {
        return { kind: "bad-data" }
      }

      return {
        kind: "ok",
        articles: rawData.results || [],
        totalResults: rawData.totalResults || 0,
        nextPage: rawData.nextPage,
      }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets available news sources
   */
  async getNewsSources(country?: string, category?: string): Promise<{ kind: "ok"; sources: NewsSource[] } | GeneralApiProblem> {
    const queryParams = {
      apikey: NEWSDATA_API_CONFIG.apiKey,
      ...(country && { country }),
      ...(category && { category }),
    }

    const response: ApiResponse<NewsSourcesResponse> = await this.newsDataApi.get("sources", queryParams)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const rawData = response.data

      if (rawData?.status !== "success") {
        return { kind: "bad-data" }
      }

      return {
        kind: "ok",
        sources: rawData.results || [],
      }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets Ghana healthcare news sources
   */
  async getGhanaHealthcareSources(): Promise<{ kind: "ok"; sources: NewsSource[] } | GeneralApiProblem> {
    return this.getNewsSources("GH", "health")
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
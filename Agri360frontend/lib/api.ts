const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

if (!API_BASE) {
  console.warn("⚠️ NEXT_PUBLIC_API_URL is not set. API calls will fail.")
}

// ============================================================================
// SAFE DATE HELPER - Prevents "Invalid time value" errors
// ============================================================================
/**
 * Safely parse a date value, returning null for invalid dates
 * Prevents "Invalid time value" errors when sending to backend
 */
export function safeDate(d: any): Date | null {
  if (d === null || d === undefined || d === "" || d === "null" || d === "undefined") {
    return null
  }
  try {
    const parsed = d instanceof Date ? d : new Date(d)
    return isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

/**
 * Safely convert a date to ISO string, returning null for invalid dates
 */
export function safeDateToISO(d: any): string | null {
  const parsed = safeDate(d)
  return parsed ? parsed.toISOString() : null
}

// ============================================================================
// TYPES
// ============================================================================
export interface UserPreferences {
  language: 'ar' | 'en'
  currency: string
  units: 'metric' | 'imperial'
  notifications: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  marketAlerts: boolean
  weatherAlerts: boolean
  taskReminders: boolean
}

export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  country?: string
  governorate?: string
  preferences?: UserPreferences
  createdAt: string
  updatedAt: string
  [key: string]: any  // Allow additional properties
}

export interface Farm {
  _id: string
  user: string
  name: string
  location: string
  size: number
  sizeUnit: string
  area?: number  // Alias for size
  soilType?: string
  waterSource?: string
  coordinates?: { lat: number; lng: number }
  crops: Array<{
    name: string
    area: number
    plantingDate: Date
    expectedHarvest: Date
    status: string
  }>
  animals: Array<{
    type: string
    breed?: string
    count: number
    healthStatus: string
    feedType?: string
    lastCheckup?: Date
    notes?: string
  }>
  createdAt: string
  updatedAt: string
  [key: string]: any  // Allow additional properties
}

export interface Notification {
  _id: string
  user: string
  type: string
  title: string
  message: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
}

export interface MarketListing {
  _id: string
  seller: string | User
  title: string
  crop: string
  quantity: number
  unit: string
  pricePerUnit: number
  currency: string
  location: string
  status: string
  description?: string
  images?: string[]
  createdAt: string
}

export interface Order {
  _id: string
  listing: string | MarketListing
  buyer: string | User
  seller: string | User
  quantity: number
  totalPrice: number
  status: string
  paymentMethod?: string
  deliveryMethod?: string
  createdAt: string
}

export interface DashboardData {
  user: User
  farm?: Farm
  stats: {
    totalCrops: number
    totalAnimals: number
    totalListings: number
    pendingOrders: number
  }
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
  weatherData?: any
  marketPrices?: any
  aiSummary?: string
}

// ============================================================================
// REQUEST HELPER - Production-safe with defensive error handling
// ============================================================================

/**
 * Safely parse JSON, returning null on failure
 */
function safeJsonParse(text: string): any | null {
  if (!text || text.trim() === '') return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  status: number
  statusText: string
  body: string
  
  constructor(status: number, statusText: string, body: string, message?: string) {
    super(message || `API Error ${status}: ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}

/**
 * Centralized API request function
 * - Checks response.ok before parsing
 * - Verifies Content-Type before JSON parsing
 * - Falls back to text on non-JSON responses
 * - Never throws on JSON parse errors
 * - Handles 401/403/500 gracefully
 */
async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  let res: Response
  
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...options,
      headers,
    })
  } catch (networkError: any) {
    // Network error (no internet, DNS failure, CORS, etc.)
    console.error(`Network Error [${path}]:`, networkError.message)
    throw new ApiError(0, 'Network Error', '', networkError.message || 'Failed to connect to server')
  }

  // Get response body as text first (safe operation)
  let responseText = ''
  try {
    responseText = await res.text()
  } catch {
    responseText = ''
  }

  // Check Content-Type header
  const contentType = res.headers.get("content-type") || ""
  const isJsonResponse = contentType.includes("application/json")

  // Handle non-OK responses
  if (!res.ok) {
    let errorMessage = res.statusText || `HTTP ${res.status}`
    
    // Try to extract error message from JSON response
    if (isJsonResponse && responseText) {
      const errorJson = safeJsonParse(responseText)
      if (errorJson) {
        errorMessage = errorJson.message || errorJson.error || errorJson.msg || errorMessage
      }
    } else if (responseText && responseText.length < 500) {
      // Use text response if short enough (not HTML page)
      errorMessage = responseText
    }
    
    // Handle specific status codes
    if (res.status === 401) {
      console.warn(`Auth Error [${path}]: Unauthorized - token may be expired`)
      // Clear token on 401
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
      }
      errorMessage = 'Session expired. Please login again.'
    } else if (res.status === 403) {
      console.warn(`Auth Error [${path}]: Forbidden`)
      errorMessage = 'You do not have permission to access this resource.'
    } else if (res.status >= 500) {
      console.error(`Server Error [${res.status}] [${path}]:`, errorMessage)
      errorMessage = 'Server error. Please try again later.'
    } else {
      console.error(`API Error [${res.status}] [${path}]:`, errorMessage)
    }
    
    throw new ApiError(res.status, res.statusText, responseText, errorMessage)
  }

  // Parse successful response
  if (isJsonResponse && responseText) {
    const jsonData = safeJsonParse(responseText)
    if (jsonData !== null) {
      return jsonData as T
    }
    // JSON parse failed but Content-Type said JSON - log warning
    console.warn(`Invalid JSON response from [${path}]:`, responseText.substring(0, 200))
    return {} as T
  }
  
  // Non-JSON response (could be text, HTML, etc.)
  if (responseText) {
    // Return as-is for non-JSON
    return responseText as unknown as T
  }
  
  // Empty response
  return {} as T
}

// ============================================================================
// AUTHENTICATION APIs - Routes: /api/auth
// ============================================================================
export const auth = {
  register: (data: { name: string; email: string; password: string; phone?: string }) => 
    request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  
  login: (data: { email: string; password: string }) => 
    request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  
  me: () => 
    request<User>("/auth/me"),
}

// ============================================================================
// USER APIs - Routes: /api/users
// ============================================================================
export const user = {
  // Profile
  getProfile: () => 
    request<User>("/users/me"),
  
  updateProfile: (data: Partial<User>) => 
    request<User>("/users/me", { method: "PUT", body: JSON.stringify(data) }),
  
  // Preferences
  getPreferences: () => 
    request<User['preferences']>("/users/preferences"),
  
  updatePreferences: (data: Partial<User['preferences']>) => 
    request<User['preferences']>("/users/preferences", { method: "PUT", body: JSON.stringify(data) }),
  
  // Notification Settings
  getNotificationSettings: () => 
    request<NotificationSettings>("/users/notification-settings"),
  
  updateNotificationSettings: (data: Partial<NotificationSettings>) => 
    request<NotificationSettings>("/users/notification-settings", { method: "PUT", body: JSON.stringify(data) }),
  
  // Notifications
  getNotifications: (params?: { unreadOnly?: boolean; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.unreadOnly) query.append('unreadOnly', 'true')
    if (params?.limit) query.append('limit', params.limit.toString())
    return request<{ notifications: Notification[]; unreadCount: number }>(`/users/notifications?${query}`)
  },
  
  markNotificationRead: (id: string) => 
    request<Notification>(`/users/notifications/${id}/read`, { method: "PUT" }),
  
  markAllNotificationsRead: () => 
    request<{ message: string }>("/users/notifications/read-all", { method: "PUT" }),
  
  // Plan Stats
  getPlanStats: () => 
    request<{ plans: any[]; stats: any }>("/users/plan-stats"),
  
  // Orders
  getOrders: (params?: { status?: string; role?: 'buyer' | 'seller' }) => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.role) query.append('role', params.role)
    return request<Order[]>(`/users/orders?${query}`)
  },
  
  // User Dashboard
  getDashboard: () => 
    request<DashboardData>("/users/dashboard"),
}

// ============================================================================
// FARM MANAGEMENT APIs - Routes: /api/farms
// ============================================================================
export const farms = {
  // Create Farm
  create: (data: Partial<Farm>) => 
    request<Farm>("/farms", { method: "POST", body: JSON.stringify(data) }),
  
  // Get User's Farm
  getMyFarm: () => 
    request<Farm>("/farms/my-farm"),
  
  // Get Farm by ID
  getFarm: (id: string) => 
    request<Farm>(`/farms/${id}`),
  
  // Update Farm
  updateFarm: (data: Partial<Farm>) => 
    request<Farm>("/farms/update", { method: "PUT", body: JSON.stringify(data) }),
  
  // Soil Analysis
  analyzeSoil: (data: { soilType: string; ph?: number; moisture?: number; farmId?: string }) => 
    request<{ analysis: any; recommendations: string[] }>("/farms/analyze-soil", { method: "POST", body: JSON.stringify(data) }),
  
  // =====================
  // ANIMALS CRUD
  // =====================
  getAnimals: () => 
    request<Farm['animals']>("/farms/animals"),
  
  addAnimal: (data: Farm['animals'][0]) => 
    request<Farm>("/farms/animals", { method: "POST", body: JSON.stringify(data) }),
  
  updateAnimal: (animalId: string, data: Partial<Farm['animals'][0]>) => 
    request<Farm>(`/farms/animals/${animalId}`, { method: "PUT", body: JSON.stringify(data) }),
  
  deleteAnimal: (animalId: string) => 
    request<Farm>(`/farms/animals/${animalId}`, { method: "DELETE" }),
  
  // =====================
  // CROPS
  // =====================
  getCropHistory: () => 
    request<{ crops: Farm['crops']; history: any[] }>("/farms/crop-history"),
  
  // =====================
  // WATER ANALYSIS
  // =====================
  getWaterAnalysis: () => 
    request<{ waterSource: string; analysis: any; recommendations: string[] }>("/farms/water"),
  
  analyzeWater: (data: { waterSource: string; quality?: string; ph?: number }) => 
    request<{ analysis: any; recommendations: string[] }>("/farms/water/analyze", { method: "POST", body: JSON.stringify(data) }),
  
  // =====================
  // AI SUMMARY
  // =====================
  getFarmSummary: () => 
    request<{ summary: string; insights: any; recommendations: string[] }>("/farms/summary"),
  
  // =====================
  // PLANS
  // =====================
  getFarmPlans: () => 
    request<{ businessPlans: any[]; harvestPlans: any[]; summary: any }>("/farms/plans"),
}

// ============================================================================
// HARVEST PLAN APIs - Routes: /api/harvests
// ============================================================================
export const harvest = {
  create: (data: any) => 
    request<any>("/harvests", { method: "POST", body: JSON.stringify(data) }),
  
  list: () => 
    request<any[]>("/harvests"),
  
  get: (id: string) => 
    request<any>(`/harvests/${id}`),
  
  update: (id: string, data: any) => 
    request<any>(`/harvests/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  
  delete: (id: string) => 
    request<void>(`/harvests/${id}`, { method: "DELETE" }),
}

// ============================================================================
// BUSINESS PLAN APIs - Routes: /api/business
// ============================================================================
export const businessPlan = {
  create: (data: any) => 
    request<any>("/business", { method: "POST", body: JSON.stringify(data) }),
  
  list: () => 
    request<any[]>("/business"),
  
  get: (id: string) => 
    request<any>(`/business/${id}`),
  
  update: (id: string, data: any) => 
    request<any>(`/business/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  
  delete: (id: string) => 
    request<void>(`/business/${id}`, { method: "DELETE" }),
}

// ============================================================================
// SIMPLE PLAN APIs - Routes: /api/simple
// ============================================================================
export const simplePlan = {
  create: (data: any) => 
    request<any>("/simple/simple", { method: "POST", body: JSON.stringify(data) }),
}

// ============================================================================
// MOCK PLAN APIs - Routes: /api/simple (alternative endpoint)
// ============================================================================
export const mockPlan = {
  create: (data: any) => 
    request<any>("/simple/mock", { method: "POST", body: JSON.stringify(data) }),
}

// ============================================================================
// DASHBOARD APIs - Routes: /api/dashboard
// ============================================================================
export const dashboard = {
  // Get Dashboard for current user
  getStats: () => 
    request<DashboardData>("/dashboard"),
  
  // Get User-specific dashboard view
  getUserDashboard: () => 
    request<DashboardData>("/dashboard/user"),
  
  // Compute and store dashboard stats
  computeAndStore: (data?: any) => 
    request<any>("/dashboard/compute", { method: "POST", body: JSON.stringify(data || {}) }),
  
  // Refresh dashboard data
  refresh: () => 
    request<DashboardData>("/dashboard/refresh", { method: "POST" }),
}

// ============================================================================
// MARKETPLACE APIs - Routes: /api/market
// ============================================================================
export const marketplace = {
  // =====================
  // LISTINGS
  // =====================
  listListings: (params?: { 
    crop?: string
    minPrice?: number
    maxPrice?: number
    location?: string
    status?: string
    sort?: string
    limit?: number
    page?: number
  }) => {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, value.toString())
      })
    }
    return request<{ listings: MarketListing[]; total: number; page: number; pages: number }>(`/market/listings?${query}`)
  },
  
  getListing: (id: string) => 
    request<MarketListing>(`/market/listings/${id}`),
  
  createListing: (data: {
    crop: string
    quantity: number
    unit?: string
    pricePerUnit: number
    currency?: string
    description?: string
    images?: string[]
  }) => 
    request<MarketListing>("/market/listings", { method: "POST", body: JSON.stringify(data) }),
  
  updateListing: (id: string, data: Partial<MarketListing>) => 
    request<MarketListing>(`/market/listings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  
  deleteListing: (id: string) => 
    request<void>(`/market/listings/${id}`, { method: "DELETE" }),
  
  // Get My Listings
  getMyListings: () => 
    request<MarketListing[]>("/market/my-listings"),
  
  // =====================
  // OFFERS/ORDERS
  // =====================
  makeOffer: (listingId: string, data: {
    quantity: number
    offeredPrice: number
    message?: string
  }) => 
    request<Order>(`/market/listings/${listingId}/offer`, { method: "POST", body: JSON.stringify(data) }),
  
  createOrder: (data: {
    listingId: string
    quantity: number
    paymentMethod?: string
    deliveryMethod?: string
  }) => 
    request<Order>("/market/orders", { method: "POST", body: JSON.stringify(data) }),
  
  getOrder: (id: string) => 
    request<Order>(`/market/orders/${id}`),
  
  updateOrderStatus: (id: string, status: string) => 
    request<Order>(`/market/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  
  // =====================
  // AI ANALYSIS
  // =====================
  getListingAnalysis: (id: string) => 
    request<{ 
      priceAnalysis: any
      marketTrends: any
      recommendations: string[]
      competitorAnalysis: any
    }>(`/market/listings/${id}/analysis`),
  
  // =====================
  // MARKET PRICES
  // =====================
  getMarketPrices: (crop?: string) => {
    const query = crop ? `?crop=${encodeURIComponent(crop)}` : ''
    return request<{ prices: any[]; trends: any }>(`/market/prices${query}`)
  },
}

// ============================================================================
// CHAT/AI APIs - Routes: /api/chat
// ============================================================================
export const chat = {
  send: async (message: string, context?: { farmId?: string; topic?: string; lang?: string }) => {
    const result = await request<{ reply: string; response?: string; suggestions?: string[] }>("/chat", { 
      method: "POST", 
      body: JSON.stringify({ message, ...context }) 
    })
    // Normalize: backend returns 'reply', but we want 'response' for consistency
    return { 
      response: result.reply || result.response || '', 
      suggestions: result.suggestions 
    }
  },
  
  getHistory: () => 
    request<Array<{ role: string; content: string; timestamp: string }>>("/chat/history"),
}

// ============================================================================
// WEATHER APIs - Direct call to Open-Meteo (free, no API key needed)
// ============================================================================

// Geocode location using Nominatim (OpenStreetMap)
async function geocodeLocation(location: string): Promise<{lat: number, lon: number} | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Agri360/1.0' } })
    if (!res.ok) return null
    const text = await res.text()
    const data = safeJsonParse(text)
    if (data && Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    }
  } catch (err) {
    console.warn('Geocode error:', err)
  }
  return null
}

// Map weather codes to conditions
function getWeatherCondition(code: number): string {
  if (code === 0) return 'sunny'
  if (code <= 3) return 'cloudy'
  if (code >= 51 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain'
  if (code >= 95) return 'storm'
  return 'cloudy'
}

// Get day name
function getDayName(date: Date, lang: string = 'en'): string {
  return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' })
}

export const weather = {
  getCurrent: async (location?: string, coords?: {lat: number, lon: number}) => {
    try {
      // Get coordinates
      let lat: number, lon: number
      if (coords) {
        lat = coords.lat
        lon = coords.lon
      } else if (location) {
        const geo = await geocodeLocation(location)
        if (!geo) throw new Error('Location not found')
        lat = geo.lat
        lon = geo.lon
      } else {
        // Default to Cairo
        lat = 30.0444
        lon = 31.2357
      }

      // Call Open-Meteo API directly
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=auto&forecast_days=5`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Weather API returned ${res.status}`)
      const text = await res.text()
      const data = safeJsonParse(text)

      if (!data || !data.current) throw new Error('No weather data')

      // Build forecast from daily data
      const forecast = data.daily?.time?.slice(0, 5).map((date: string, i: number) => ({
        day: getDayName(new Date(date)),
        temp: Math.round(data.daily.temperature_2m_max[i]),
        icon: getWeatherCondition(data.daily.weather_code[i])
      })) || []

      return {
        location: location || 'Current Location',
        temperature: Math.round(data.current.temperature_2m),
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m),
        condition: getWeatherCondition(data.current.weather_code),
        forecast
      }
    } catch (err) {
      console.warn('Weather API error, using fallback:', err)
      // Fallback data
      return {
        location: location || 'Cairo, Egypt',
        temperature: 28,
        humidity: 45,
        windSpeed: 12,
        condition: 'sunny',
        forecast: [
          { day: 'Sat', temp: 29, icon: 'sunny' },
          { day: 'Sun', temp: 31, icon: 'sunny' },
          { day: 'Mon', temp: 28, icon: 'cloudy' },
          { day: 'Tue', temp: 26, icon: 'rain' },
          { day: 'Wed', temp: 27, icon: 'sunny' },
        ]
      }
    }
  },
  
  // Get user's location via browser geolocation
  getUserLocation: (): Promise<{lat: number, lon: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(err),
        { timeout: 10000 }
      )
    })
  },

  getForecast: async (days?: number, location?: string) => {
    // Use getCurrent which already fetches forecast
    return weather.getCurrent(location)
  },
}

// ============================================================================
// PLANS APIs - Generic plans management (for backward compatibility)
// ============================================================================
export const plans = {
  // Save an already-generated plan (without calling AI)
  create: (data: { title: string; type?: string; content?: any; phases?: any[] }) => 
    request<any>("/business/save", { method: "POST", body: JSON.stringify(data) }),
  
  // Generate a new plan with AI
  generate: (data: any) =>
    request<any>("/business", { method: "POST", body: JSON.stringify(data) }),
  
  list: () => 
    request<any[]>("/business"),
  
  get: (id: string) => 
    request<any>(`/business/${id}`),
  
  update: (id: string, data: any) => 
    request<any>(`/business/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  
  delete: (id: string) => 
    request<void>(`/business/${id}`, { method: "DELETE" }),
}

// ============================================================================
// DEFAULT EXPORT - All API modules
// ============================================================================
const api = {
  auth,
  user,
  farms,
  harvest,
  businessPlan,
  simplePlan,
  mockPlan,
  dashboard,
  marketplace,
  chat,
  weather,
  plans,
}

export default api

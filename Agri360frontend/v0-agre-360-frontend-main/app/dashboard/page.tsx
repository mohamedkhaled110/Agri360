"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  Line, LineChart, Bar, BarChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip, Area, AreaChart,
} from "recharts"
import { 
  TrendingUp, TrendingDown, Droplets, Cloud, Thermometer, Wind, Sun, CloudRain,
  AlertTriangle, CheckCircle, Calendar as CalendarIcon, DollarSign, Activity, 
  BarChart3, FileText, Sprout, TrendingUpIcon, ShoppingCart, Clock,
  Bell, RefreshCw, Loader2, MapPin, Users, Package, ChevronLeft, ChevronRight,
  Wheat, Beef, TreePine, Eye, Edit, Target, CheckCircle2, Circle, Plus, X, Trash2, ExternalLink, Leaf
} from 'lucide-react'
import { dashboard, farms, user as userApi, plans, DashboardData, Farm, Notification } from "@/lib/api"

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// Default Egyptian crop prices (EGP per ton) - used as fallback
const DEFAULT_CROP_PRICES = [
  { crop: 'wheat', nameEn: 'Wheat', nameAr: 'قمح', price: 12500, change: 2.5, unit: 'ton' },
  { crop: 'corn', nameEn: 'Corn', nameAr: 'ذرة', price: 9800, change: -1.2, unit: 'ton' },
  { crop: 'rice', nameEn: 'Rice', nameAr: 'أرز', price: 15000, change: 3.8, unit: 'ton' },
  { crop: 'cotton', nameEn: 'Cotton', nameAr: 'قطن', price: 45000, change: 5.1, unit: 'ton' },
  { crop: 'potatoes', nameEn: 'Potatoes', nameAr: 'بطاطس', price: 8500, change: -2.3, unit: 'ton' },
  { crop: 'tomatoes', nameEn: 'Tomatoes', nameAr: 'طماطم', price: 12000, change: 8.5, unit: 'ton' },
  { crop: 'onions', nameEn: 'Onions', nameAr: 'بصل', price: 7500, change: -5.0, unit: 'ton' },
  { crop: 'citrus', nameEn: 'Citrus', nameAr: 'حمضيات', price: 11000, change: 1.5, unit: 'ton' },
]

export default function DashboardPage() {
  const { t, language } = useLanguage()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  
  // State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [farmData, setFarmData] = useState<Farm | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [savedPlans, setSavedPlans] = useState<any[]>([])
  const [weatherData, setWeatherData] = useState<any>(null)
  const [cropPrices, setCropPrices] = useState(DEFAULT_CROP_PRICES)
  const [pricesSource, setPricesSource] = useState<'live' | 'fallback'>('fallback')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  
  // Plan dialogs state
  const [viewPlanDialog, setViewPlanDialog] = useState(false)
  const [editPlanDialog, setEditPlanDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [editingPhases, setEditingPhases] = useState<any[]>([])
  const [isSavingPlan, setIsSavingPlan] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch all data
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData()
    }
  }, [isAuthenticated])

  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [dashboardRes, farmRes, notificationsRes, plansRes] = await Promise.allSettled([
        dashboard.getUserDashboard(),
        farms.getMyFarm(),
        userApi.getNotifications({ limit: 10 }),
        plans.list()
      ])

      if (dashboardRes.status === 'fulfilled') {
        setDashboardData(dashboardRes.value)
        if (dashboardRes.value.weatherData) {
          setWeatherData(dashboardRes.value.weatherData)
        }
      }

      if (farmRes.status === 'fulfilled') {
        setFarmData(farmRes.value)
      }

      if (notificationsRes.status === 'fulfilled') {
        setNotifications(notificationsRes.value.notifications || [])
      }

      if (plansRes.status === 'fulfilled') {
        // Handle both array response and {businessPlans: [...]} response
        const rawValue = plansRes.value as any
        const plansData = Array.isArray(rawValue) 
          ? rawValue 
          : (rawValue?.businessPlans || rawValue?.plans || [])
        setSavedPlans(plansData)
        
        console.log('📋 Plans loaded:', plansData.length, 'plans')
        
        // Extract calendar events from plan phases
        const events: any[] = []
        plansData.forEach((plan: any) => {
          console.log('Processing plan:', plan.title, 'phases:', plan.phases?.length)
          if (plan.phases && Array.isArray(plan.phases)) {
            plan.phases.forEach((phase: any) => {
              if (phase.startDate) {
                events.push({
                  date: new Date(phase.startDate),
                  title: language === 'ar' ? phase.nameArabic || phase.name : phase.name,
                  type: 'phase-start',
                  planTitle: plan.title,
                  planType: plan.planType,
                  status: phase.status,
                  color: phase.status === 'completed' ? 'green' : phase.status === 'in-progress' ? 'blue' : 'gray'
                })
              }
              if (phase.endDate) {
                events.push({
                  date: new Date(phase.endDate),
                  title: `${language === 'ar' ? 'نهاية' : 'End'}: ${language === 'ar' ? phase.nameArabic || phase.name : phase.name}`,
                  type: 'phase-end',
                  planTitle: plan.title,
                  planType: plan.planType,
                  status: phase.status,
                  color: 'orange'
                })
              }
              // Add tasks
              if (phase.tasks && Array.isArray(phase.tasks)) {
                phase.tasks.forEach((task: any) => {
                  if (task.dueDate) {
                    events.push({
                      date: new Date(task.dueDate),
                      title: language === 'ar' ? task.taskArabic || task.task : task.task,
                      type: 'task',
                      completed: task.completed,
                      color: task.completed ? 'green' : 'red'
                    })
                  }
                })
              }
            })
          }
        })
        setCalendarEvents(events)
      }

      // Fetch weather and crop prices
      fetchWeatherData()
      fetchCropPrices()

    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWeatherData = async () => {
    try {
      const weatherApi = (await import("@/lib/api")).weather
      
      // Try to get user's actual location first
      try {
        const coords = await weatherApi.getUserLocation()
        const data = await weatherApi.getCurrent(undefined, coords)
        // Try to reverse geocode for location name
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`, {
            headers: { 'User-Agent': 'Agri360/1.0' }
          })
          const geoData = await geoRes.json()
          data.location = geoData.address?.city || geoData.address?.town || geoData.address?.state || 'Your Location'
        } catch { /* ignore reverse geocode errors */ }
        setWeatherData(data)
        return
      } catch {
        // Geolocation denied or failed, use farm location or default
      }
      
      // Fallback to farm location or Cairo
      const data = await weatherApi.getCurrent(farmData?.location || 'Cairo, Egypt')
      setWeatherData(data)
    } catch (err) {
      console.warn('Weather fetch error:', err)
      // Use fallback data
      setWeatherData({
        location: farmData?.location || 'Cairo, Egypt',
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
      })
    }
  }

  const fetchCropPrices = async () => {
    try {
      // Try to fetch from backend market API
      const res = await fetch('http://localhost:5000/api/market/prices')
      if (res.ok) {
        const data = await res.json()
        if (data.prices && data.prices.length > 0) {
          // Map to our format
          const mappedPrices = data.prices.map((p: any) => ({
            crop: p.crop || p.name,
            nameEn: p.nameEn || p.crop || p.name,
            nameAr: p.nameAr || p.crop,
            price: p.price,
            change: p.change || (Math.random() * 10 - 5), // Random change if not provided
            unit: p.unit || 'ton'
          }))
          setCropPrices(mappedPrices.length >= 8 ? mappedPrices : DEFAULT_CROP_PRICES)
          setPricesSource(data.source === 'mahsoly' ? 'live' : 'fallback')
          return
        }
      }
    } catch (err) {
      console.warn('Failed to fetch crop prices:', err)
    }
    // Use default prices
    setCropPrices(DEFAULT_CROP_PRICES)
    setPricesSource('fallback')
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAllData()
    await fetchWeatherData()
    await fetchCropPrices()
    setIsRefreshing(false)
  }

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const prevMonth = () => setCurrentMonth(addDays(monthStart, -1))
  const nextMonth = () => setCurrentMonth(addDays(monthEnd, 1))

  // Plan type helpers
  const getPlanTypeVariant = (planType: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (planType) {
      case 'business': return 'default'
      case 'farming': case 'crop': return 'secondary'
      case 'market': return 'outline'
      case 'animal': return 'destructive'
      default: return 'secondary'
    }
  }

  const getPlanTypeName = (planType: string, lang: string) => {
    const names: Record<string, { en: string; ar: string }> = {
      business: { en: 'Business', ar: 'تجارية' },
      farming: { en: 'Farming', ar: 'زراعية' },
      crop: { en: 'Crop', ar: 'محصول' },
      market: { en: 'Market', ar: 'تسويق' },
      animal: { en: 'Animal', ar: 'حيوان' },
      mixed: { en: 'Mixed', ar: 'مختلط' },
    }
    return lang === 'ar' ? (names[planType]?.ar || planType) : (names[planType]?.en || planType)
  }

  const getPlanTypeIcon = (planType: string) => {
    switch (planType) {
      case 'business': return <Target className="h-3 w-3" />
      case 'farming': case 'crop': return <Sprout className="h-3 w-3" />
      case 'market': return <BarChart3 className="h-3 w-3" />
      case 'animal': return <Beef className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
    }
  }

  // Get plan phases and progress from actual plan data
  const getPlanProgress = (plan: any) => {
    // Use actual phases from the plan if available
    let phases = []
    
    if (plan.phases && Array.isArray(plan.phases) && plan.phases.length > 0) {
      phases = plan.phases.map((p: any) => ({
        name: language === 'ar' ? p.nameArabic || p.name : p.name,
        status: p.status || 'pending',
        progress: p.progress || 0,
        startDate: p.startDate,
        endDate: p.endDate,
      }))
    } else {
      // Fallback default phases - all start at 0%
      phases = [
        { name: language === 'ar' ? 'التخطيط' : 'Planning', status: 'pending', progress: 0 },
        { name: language === 'ar' ? 'التنفيذ' : 'Implementation', status: 'pending', progress: 0 },
        { name: language === 'ar' ? 'المراقبة' : 'Monitoring', status: 'pending', progress: 0 },
        { name: language === 'ar' ? 'الحصاد' : 'Harvest', status: 'pending', progress: 0 },
      ]
    }
    
    const totalProgress = phases.length > 0 
      ? phases.reduce((acc: number, p: any) => acc + (p.progress || 0), 0) / phases.length
      : 0
    return { phases, totalProgress }
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => 
      isSameDay(new Date(event.date), date)
    )
  }

  // Check if date has events
  const dateHasEvents = (date: Date) => {
    return calendarEvents.some(event => isSameDay(new Date(event.date), date))
  }

  // Get current active phase across all plans
  const getActivePhases = () => {
    const activePhases: any[] = []
    savedPlans.forEach((plan: any) => {
      if (plan.phases && Array.isArray(plan.phases)) {
        plan.phases.forEach((phase: any) => {
          if (phase.status === 'in-progress') {
            activePhases.push({
              ...phase,
              planTitle: plan.title,
              planType: plan.planType,
            })
          }
        })
      }
    })
    return activePhases
  }

  // View plan handler
  const handleViewPlan = (plan: any) => {
    setSelectedPlan(plan)
    setViewPlanDialog(true)
  }

  // Edit plan handler
  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan)
    // Create editable copy of phases
    const phases = plan.phases?.map((p: any) => ({
      ...p,
      progress: p.progress || 0,
      status: p.status || 'pending'
    })) || []
    setEditingPhases(phases)
    setEditPlanDialog(true)
  }

  // Delete plan handler
  const handleDeletePlan = async (plan: any) => {
    const confirmMsg = language === 'ar' 
      ? `هل أنت متأكد من حذف "${plan.title}"؟`
      : `Are you sure you want to delete "${plan.title}"?`
    
    if (!confirm(confirmMsg)) return
    
    try {
      await plans.delete(plan._id)
      // Refresh plans
      await fetchAllData()
    } catch (err: any) {
      console.error('Error deleting plan:', err)
      alert(language === 'ar' ? 'خطأ في حذف الخطة' : 'Error deleting plan')
    }
  }

  // Save plan progress
  const handleSavePlanProgress = async () => {
    if (!selectedPlan) return
    setIsSavingPlan(true)
    try {
      await plans.update(selectedPlan._id, { 
        phases: editingPhases,
        status: editingPhases.every((p: any) => p.status === 'completed') ? 'completed' : 'in_progress'
      })
      // Refresh plans
      await fetchAllData()
      setEditPlanDialog(false)
      setSelectedPlan(null)
    } catch (err: any) {
      console.error('Error saving plan:', err)
      alert(language === 'ar' ? 'خطأ في حفظ التقدم' : 'Error saving progress')
    } finally {
      setIsSavingPlan(false)
    }
  }

  // Update phase progress
  const updatePhaseProgress = (index: number, progress: number) => {
    const updated = [...editingPhases]
    updated[index].progress = progress
    // Auto-update status based on progress
    if (progress === 100) {
      updated[index].status = 'completed'
    } else if (progress > 0) {
      updated[index].status = 'in-progress'
    } else {
      updated[index].status = 'pending'
    }
    setEditingPhases(updated)
  }

  // Weather icon helper
  const getWeatherIcon = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'sunny': case 'clear': return <Sun className="h-8 w-8 text-yellow-500" />
      case 'cloudy': case 'clouds': return <Cloud className="h-8 w-8 text-gray-500" />
      case 'rain': case 'rainy': return <CloudRain className="h-8 w-8 text-blue-500" />
      default: return <Sun className="h-8 w-8 text-yellow-500" />
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.stats || { totalCrops: 0, totalAnimals: 0, totalListings: 0, pendingOrders: 0 }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? `مرحباً، ${user?.name || 'مزارع'}` : `Welcome, ${user?.name || 'Farmer'}`}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, d MMMM yyyy', { locale: language === 'ar' ? ar : enUS })}
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive">
            <AlertTriangle className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        )}

        {/* Active Phases Banner - shows current work in progress */}
        {getActivePhases().length > 0 && (
          <Card className="mb-6 border-2 border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-green-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                {language === 'ar' ? 'المراحل النشطة الآن' : 'Currently Active Phases'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getActivePhases().map((phase, i) => (
                  <div key={i} className="p-4 rounded-lg bg-card border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {phase.planType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {phase.progress}%
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">
                      {language === 'ar' ? phase.nameArabic || phase.name : phase.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      {phase.planTitle}
                    </p>
                    <Progress value={phase.progress} className="h-2" />
                    {phase.startDate && phase.endDate && (
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{format(new Date(phase.startDate), 'd MMM')}</span>
                        <span>{format(new Date(phase.endDate), 'd MMM')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Create New Plan */}
        <Card className="mb-6 border-2 border-dashed border-green-500/50 bg-gradient-to-r from-green-500/5 to-emerald-500/5 hover:border-green-500 transition-colors">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <Plus className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {language === 'ar' ? 'إنشاء خطة جديدة' : 'Create a New Plan'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'ar' 
                      ? 'استخدم الذكاء الاصطناعي لإنشاء خطة مخصصة لمزرعتك' 
                      : 'Use AI to generate a customized plan for your farm'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/planning?type=farming">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Leaf className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'خطة زراعية' : 'Farming Plan'}
                  </Button>
                </Link>
                <Link href="/planning?type=business">
                  <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                    <Target className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'خطة تجارية' : 'Business Plan'}
                  </Button>
                </Link>
                <Link href="/planning?type=market">
                  <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'خطة تسويقية' : 'Market Plan'}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Row: Weather + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Weather Card */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>{language === 'ar' ? 'الطقس الحالي' : 'Current Weather'}</span>
                <MapPin className="h-4 w-4" />
              </CardTitle>
              <CardDescription className="text-blue-100">
                {weatherData?.location || farmData?.location || (language === 'ar' ? 'موقعك' : 'Your Location')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weatherData ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getWeatherIcon(weatherData?.condition)}
                      <div>
                        <div className="text-4xl font-bold">{weatherData?.temperature ?? '--'}°C</div>
                        <div className="text-blue-100 capitalize">{weatherData?.condition || (language === 'ar' ? 'غير متاح' : 'N/A')}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Droplets className="h-4 w-4" />
                        <span>{weatherData?.humidity ?? '--'}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wind className="h-4 w-4" />
                        <span>{weatherData?.windSpeed ?? '--'} km/h</span>
                      </div>
                    </div>
                  </div>
                  {/* 5-day forecast */}
                  {weatherData?.forecast && weatherData.forecast.length > 0 && (
                    <div className="flex justify-between mt-4 pt-4 border-t border-blue-400">
                      {weatherData.forecast.map((day: any, i: number) => (
                        <div key={i} className="text-center">
                          <div className="text-xs text-blue-200">{day.day}</div>
                          <div className="font-semibold">{day.temp}°</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-blue-100">{language === 'ar' ? 'جاري تحميل بيانات الطقس...' : 'Loading weather data...'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المحاصيل' : 'Crops'}</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalCrops}</p>
                </div>
                <Wheat className="h-10 w-10 text-green-500/50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'ar' ? 'نشطة في المزرعة' : 'Active in farm'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الحيوانات' : 'Animals'}</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalAnimals}</p>
                </div>
                <Beef className="h-10 w-10 text-blue-500/50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'ar' ? 'في المزرعة' : 'In farm'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Egyptian Crop Prices */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                {language === 'ar' ? 'أسعار المحاصيل المصرية' : 'Egyptian Crop Prices'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'أسعار السوق الحالية (جنيه مصري/طن)' : 'Current market prices (EGP/ton)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {cropPrices.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {language === 'ar' ? item.nameAr : item.nameEn}
                      </span>
                      {item.change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : item.change < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                    <div className="text-xl font-bold">{item.price.toLocaleString()}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">EGP/{item.unit}</span>
                      <span className={`text-xs font-medium ${item.change > 0 ? 'text-green-500' : item.change < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {language === 'ar' ? 'التقويم' : 'Calendar'}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {format(currentMonth, 'MMMM yyyy', { locale: language === 'ar' ? ar : enUS })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                {(language === 'ar' 
                  ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
                  : ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                ).map((day, i) => (
                  <div key={i} className="text-muted-foreground font-medium py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                {daysInMonth.map((day, i) => {
                  const hasEvents = dateHasEvents(day)
                  const dayEvents = getEventsForDate(day)
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={`p-2 text-sm rounded-md transition-colors relative ${
                        isToday(day) 
                          ? 'bg-primary text-primary-foreground font-bold' 
                          : isSameDay(day, selectedDate)
                          ? 'bg-primary/20 font-medium'
                          : hasEvents
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {format(day, 'd')}
                      {hasEvents && (
                        <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event, ei) => (
                            <span 
                              key={ei} 
                              className={`w-1.5 h-1.5 rounded-full ${
                                event.color === 'green' ? 'bg-green-500' :
                                event.color === 'blue' ? 'bg-blue-500' :
                                event.color === 'orange' ? 'bg-orange-500' :
                                event.color === 'red' ? 'bg-red-500' :
                                'bg-gray-400'
                              }`}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {/* Selected date tasks */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">
                  {format(selectedDate, 'd MMMM', { locale: language === 'ar' ? ar : enUS })}
                </p>
                <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Circle className="h-2 w-2 fill-gray-300 text-gray-300" />
                      {language === 'ar' ? 'لا توجد مهام مجدولة' : 'No scheduled tasks'}
                    </div>
                  ) : (
                    getEventsForDate(selectedDate).map((event, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Circle className={`h-2 w-2 ${
                          event.color === 'green' ? 'fill-green-500 text-green-500' :
                          event.color === 'blue' ? 'fill-blue-500 text-blue-500' :
                          event.color === 'orange' ? 'fill-orange-500 text-orange-500' :
                          event.color === 'red' ? 'fill-red-500 text-red-500' :
                          'fill-gray-400 text-gray-400'
                        }`} />
                        <span className="truncate">{event.title}</span>
                        {event.planTitle && (
                          <Badge variant="outline" className="text-xs ml-auto">
                            {event.planType}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'خططي والتقدم' : 'My Plans & Progress'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'تتبع مراحل خططك ونسبة الإنجاز' : 'Track your plan phases and completion progress'}
                </CardDescription>
              </div>
              <Link href="/dashboard/business-plan">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'خطة جديدة' : 'New Plan'}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {savedPlans.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">
                  {language === 'ar' ? 'لا توجد خطط بعد' : 'No Plans Yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === 'ar' ? 'ابدأ بإنشاء خطتك الأولى' : 'Start by creating your first plan'}
                </p>
                <div className="flex justify-center gap-2">
                  <Link href="/dashboard/business-plan">
                    <Button variant="outline" size="sm">{language === 'ar' ? 'خطة عمل' : 'Business Plan'}</Button>
                  </Link>
                  <Link href="/dashboard/farming-plan">
                    <Button variant="outline" size="sm">{language === 'ar' ? 'خطة زراعية' : 'Farming Plan'}</Button>
                  </Link>
                  <Link href="/dashboard/market-plan">
                    <Button variant="outline" size="sm">{language === 'ar' ? 'خطة تسويق' : 'Market Plan'}</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {savedPlans.slice(0, 3).map((plan: any) => {
                  const { phases, totalProgress } = getPlanProgress(plan)
                  return (
                    <div key={plan._id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getPlanTypeVariant(plan.planType)}>
                              {getPlanTypeIcon(plan.planType)}
                              <span className="ml-1">{getPlanTypeName(plan.planType, language)}</span>
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(plan.createdAt), 'd MMM yyyy', { locale: language === 'ar' ? ar : enUS })}
                            </span>
                          </div>
                          <h4 className="font-semibold">{plan.title}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{Math.round(totalProgress)}%</div>
                          <div className="text-xs text-muted-foreground">{language === 'ar' ? 'مكتمل' : 'Complete'}</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <Progress value={totalProgress} className="h-2 mb-3" />
                      
                      {/* Phases */}
                      <div className="grid grid-cols-4 gap-2">
                        {phases.map((phase: any, i: number) => (
                          <div key={i} className="text-center">
                            <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                              phase.status === 'completed' ? 'bg-green-500 text-white' :
                              phase.status === 'in-progress' ? 'bg-blue-500 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {phase.status === 'completed' ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : phase.status === 'in-progress' ? (
                                <Clock className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </div>
                            <div className="text-xs font-medium truncate">{phase.name}</div>
                            <div className="text-xs text-muted-foreground">{phase.progress}%</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewPlan(plan)}>
                          <Eye className="h-4 w-4 mr-1" />
                          {language === 'ar' ? 'عرض' : 'View'}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditPlan(plan)}>
                          <Edit className="h-4 w-4 mr-1" />
                          {language === 'ar' ? 'تحديث' : 'Update'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDeletePlan(plan)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                
                {/* Show more plans link */}
                {savedPlans.length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="link" size="sm" onClick={() => router.push('/dashboard/plans')}>
                      {language === 'ar' ? `عرض كل الخطط (${savedPlans.length})` : `View all plans (${savedPlans.length})`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Recent Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/farm">
                  <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                    <Sprout className="h-6 w-6 text-green-600" />
                    <span>{language === 'ar' ? 'إدارة المزرعة' : 'Manage Farm'}</span>
                  </Button>
                </Link>
                <Link href="/dashboard/marketplace">
                  <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                    <ShoppingCart className="h-6 w-6 text-purple-600" />
                    <span>{language === 'ar' ? 'السوق' : 'Marketplace'}</span>
                  </Button>
                </Link>
                <Link href="/dashboard/business-plan">
                  <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <span>{language === 'ar' ? 'خطة عمل' : 'Business Plan'}</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                    <Users className="h-6 w-6 text-orange-600" />
                    <span>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notif, i) => (
                    <div key={notif._id || i} className={`p-3 rounded-lg border ${notif.read ? 'bg-background' : 'bg-primary/5'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          notif.priority === 'urgent' || notif.priority === 'high' ? 'bg-red-100 text-red-600' :
                          notif.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {notif.type === 'alert' ? <AlertTriangle className="h-4 w-4" /> :
                           notif.type === 'weather' ? <Cloud className="h-4 w-4" /> :
                           <Bell className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Farm Summary */}
        {farmData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TreePine className="h-5 w-5 text-green-600" />
                    {farmData.name || (language === 'ar' ? 'مزرعتي' : 'My Farm')}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {farmData.location}
                  </CardDescription>
                </div>
                <Link href="/dashboard/farm">
                  <Button variant="outline" size="sm">
                    {language === 'ar' ? 'إدارة المزرعة' : 'Manage Farm'}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{farmData.size} {farmData.sizeUnit}</div>
                  <div className="text-sm text-muted-foreground">{language === 'ar' ? 'المساحة' : 'Size'}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{farmData.crops?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">{language === 'ar' ? 'المحاصيل' : 'Crops'}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{farmData.animals?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">{language === 'ar' ? 'الحيوانات' : 'Animals'}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold capitalize">{farmData.soilType || '-'}</div>
                  <div className="text-sm text-muted-foreground">{language === 'ar' ? 'نوع التربة' : 'Soil Type'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Plan Dialog */}
        <Dialog open={viewPlanDialog} onOpenChange={setViewPlanDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedPlan?.title || (language === 'ar' ? 'عرض الخطة' : 'View Plan')}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {selectedPlan?.planType && (
                  <Badge variant={getPlanTypeVariant(selectedPlan.planType)} className="mr-2">
                    {getPlanTypeIcon(selectedPlan.planType)}
                    <span className="ml-1">{getPlanTypeName(selectedPlan.planType, language)}</span>
                  </Badge>
                )}
                {selectedPlan?.createdAt && (
                  <span>{format(new Date(selectedPlan.createdAt), 'd MMM yyyy', { locale: language === 'ar' ? ar : enUS })}</span>
                )}
              </div>
            </DialogHeader>
            
            {selectedPlan && (
              <div className="space-y-4">
                {/* Phases Timeline */}
                {selectedPlan.phases && selectedPlan.phases.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">{language === 'ar' ? 'المراحل' : 'Phases'}</h4>
                    <div className="space-y-3">
                      {selectedPlan.phases.map((phase: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            phase.status === 'completed' ? 'bg-green-500 text-white' :
                            phase.status === 'in-progress' ? 'bg-blue-500 text-white' :
                            'bg-muted'
                          }`}>
                            {phase.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> :
                             phase.status === 'in-progress' ? <Clock className="h-5 w-5" /> :
                             <Circle className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{language === 'ar' ? phase.nameArabic || phase.name : phase.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {phase.startDate && format(new Date(phase.startDate), 'd MMM', { locale: language === 'ar' ? ar : enUS })}
                              {phase.endDate && ` - ${format(new Date(phase.endDate), 'd MMM', { locale: language === 'ar' ? ar : enUS })}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{phase.progress || 0}%</div>
                            <Progress value={phase.progress || 0} className="w-20 h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Full Plan Content */}
                {selectedPlan.aiAdvice?.fullPlan && (
                  <div>
                    <h4 className="font-semibold mb-3">{language === 'ar' ? 'تفاصيل الخطة' : 'Plan Details'}</h4>
                    <div className="p-4 rounded-lg bg-muted whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                      {selectedPlan.aiAdvice.fullPlan}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Plan Progress Dialog */}
        <Dialog open={editPlanDialog} onOpenChange={setEditPlanDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                {language === 'ar' ? 'تحديث التقدم' : 'Update Progress'}
              </DialogTitle>
              <DialogDescription>
                {selectedPlan?.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {editingPhases.map((phase: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        phase.status === 'completed' ? 'bg-green-500 text-white' :
                        phase.status === 'in-progress' ? 'bg-blue-500 text-white' :
                        'bg-muted'
                      }`}>
                        {i + 1}
                      </div>
                      <span className="font-medium">{language === 'ar' ? phase.nameArabic || phase.name : phase.name}</span>
                    </div>
                    <Badge variant={phase.status === 'completed' ? 'default' : phase.status === 'in-progress' ? 'secondary' : 'outline'}>
                      {phase.progress}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 pl-10">
                    <Slider
                      value={[phase.progress]}
                      onValueChange={(value: number[]) => updatePhaseProgress(i, value[0])}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm w-12 text-right">{phase.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditPlanDialog(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSavePlanProgress} disabled={isSavingPlan}>
                {isSavingPlan && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {language === 'ar' ? 'حفظ التقدم' : 'Save Progress'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

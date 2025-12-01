"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, Settings, Bell, Shield, Globe, Save, ArrowLeft, 
  Mail, Phone, MapPin, Calendar, Camera, Loader2, Check,
  Sun, Moon, Smartphone
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { user as userApi, farms as farmApi } from "@/lib/api"

interface UserProfile {
  _id?: string
  name: string
  email: string
  phone?: string
  location?: string
  avatar?: string
  createdAt?: string
  preferences?: {
    language?: string
    theme?: string
    units?: string
    timezone?: string
  }
}

interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  weatherAlerts: boolean
  marketAlerts: boolean  // Renamed from priceAlerts to match API
  taskReminders: boolean
}

interface FarmData {
  _id?: string
  name: string
  location?: string
  size?: number
  sizeUnit?: string
  crops?: string[]
}

export default function ProfilePage() {
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  
  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  
  // Profile data
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    location: "",
  })
  
  // Notification settings (using any for flexibility with API)
  const [notifications, setNotifications] = useState<any>({
    email: true,
    push: true,
    sms: false,
    weatherAlerts: true,
    marketAlerts: true,
    taskReminders: true,
  })
  
  // Preferences (using any for flexibility)
  const [preferences, setPreferences] = useState<any>({
    language: "en",
    theme: "light",
    units: "metric",
    currency: "EGP",
  })
  
  // Farm data
  const [farm, setFarm] = useState<FarmData | null>(null)
  
  // Load profile data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load profile
        const profileData = await userApi.getProfile()
        setProfile({
          _id: profileData._id,
          name: profileData.name || "",
          email: profileData.email || "",
          phone: (profileData as any).phone || "",
          location: (profileData as any).location || "",
          avatar: (profileData as any).avatar || "",
          createdAt: profileData.createdAt,
          preferences: profileData.preferences as any,
        })
        
        // Set preferences from profile
        if (profileData.preferences) {
          setPreferences({
            language: profileData.preferences.language || "en",
            theme: (profileData.preferences as any).theme || "light",
            units: profileData.preferences.units || "metric",
            currency: profileData.preferences.currency || "EGP",
          })
        }
        
        // Load notification settings
        try {
          const notifSettings = await userApi.getNotificationSettings() as any
          if (notifSettings) {
            setNotifications({
              email: notifSettings.email ?? true,
              push: notifSettings.push ?? true,
              sms: notifSettings.sms ?? false,
              weatherAlerts: notifSettings.weatherAlerts ?? true,
              marketAlerts: notifSettings.marketAlerts ?? true,
              taskReminders: notifSettings.taskReminders ?? true,
            })
          }
        } catch (e) {
          console.log("Notification settings not available")
        }
        
        // Load farm data
        try {
          const farmData = await farmApi.getMyFarm()
          if (farmData) {
            setFarm(farmData as any)
          }
        } catch (e) {
          console.log("Farm data not available")
        }
        
      } catch (err) {
        console.error("Error loading profile:", err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Save profile
  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await userApi.updateProfile({
        name: profile.name,
        // Add other updatable fields
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Error saving profile:", err)
    } finally {
      setSaving(false)
    }
  }
  
  // Save preferences
  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      // Convert to proper API type
      await userApi.updatePreferences({
        language: preferences.language as "en" | "ar",
        units: preferences.units as "metric" | "imperial",
        currency: preferences.currency,
      } as any)
      
      // Update language context
      if (preferences.language !== language) {
        setLanguage(preferences.language as "en" | "ar")
      }
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Error saving preferences:", err)
    } finally {
      setSaving(false)
    }
  }
  
  // Save notification settings
  const handleSaveNotifications = async () => {
    try {
      setSaving(true)
      await userApi.updateNotificationSettings(notifications)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Error saving notifications:", err)
    } finally {
      setSaving(false)
    }
  }
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${language === "ar" ? "rtl" : "ltr"}`}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{language === "ar" ? "الملف الشخصي" : "Profile Settings"}</h1>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "إدارة حسابك وتفضيلاتك" : "Manage your account and preferences"}
              </p>
            </div>
          </div>
          
          {saveSuccess && (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              <Check className="h-3 w-3 mr-1" />
              {language === "ar" ? "تم الحفظ" : "Saved"}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-green-100">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-green-600 text-white text-2xl">
                    {getInitials(profile.name || "U")}
                  </AvatarFallback>
                </Avatar>
                <Button size="icon" variant="outline" className="absolute bottom-0 right-0 rounded-full h-8 w-8">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Info */}
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold">{profile.name || "User"}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    {language === "ar" ? "انضم في" : "Joined"} {formatDate(profile.createdAt)}
                  </Badge>
                  {farm && (
                    <Badge variant="outline" className="bg-green-50">
                      <MapPin className="h-3 w-3 mr-1" />
                      {farm.name}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">{farm?.size || 0}</p>
                  <p className="text-xs text-muted-foreground">{farm?.sizeUnit || "acres"}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-600">{farm?.crops?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "محاصيل" : "Crops"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "ar" ? "الملف" : "Profile"}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "ar" ? "التفضيلات" : "Preferences"}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "ar" ? "الإشعارات" : "Notifications"}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "ar" ? "الأمان" : "Security"}</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  {language === "ar" ? "المعلومات الشخصية" : "Personal Information"}
                </CardTitle>
                <CardDescription>
                  {language === "ar" ? "تحديث بياناتك الشخصية" : "Update your personal details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">{language === "ar" ? "الاسم الكامل" : "Full Name"}</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder={language === "ar" ? "أدخل اسمك" : "Enter your name"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={profile.email}
                        className="pl-9"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar" ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">{language === "ar" ? "رقم الهاتف" : "Phone Number"}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="pl-9"
                        placeholder="+20 XXX XXX XXXX"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">{language === "ar" ? "الموقع" : "Location"}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="pl-9"
                        placeholder={language === "ar" ? "مدينتك أو منطقتك" : "Your city or region"}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  {language === "ar" ? "تفضيلات التطبيق" : "App Preferences"}
                </CardTitle>
                <CardDescription>
                  {language === "ar" ? "تخصيص تجربة استخدام التطبيق" : "Customize your app experience"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {language === "ar" ? "اللغة" : "Language"}
                    </Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      {language === "ar" ? "المظهر" : "Theme"}
                    </Label>
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            {language === "ar" ? "فاتح" : "Light"}
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            {language === "ar" ? "داكن" : "Dark"}
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            {language === "ar" ? "النظام" : "System"}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "وحدات القياس" : "Units"}</Label>
                    <Select
                      value={preferences.units}
                      onValueChange={(value) => setPreferences({ ...preferences, units: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">
                          {language === "ar" ? "متري (°C, كم)" : "Metric (°C, km)"}
                        </SelectItem>
                        <SelectItem value="imperial">
                          {language === "ar" ? "إمبراطوري (°F, mi)" : "Imperial (°F, mi)"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "المنطقة الزمنية" : "Timezone"}</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Cairo">{language === "ar" ? "القاهرة (UTC+2)" : "Cairo (UTC+2)"}</SelectItem>
                        <SelectItem value="Asia/Riyadh">{language === "ar" ? "الرياض (UTC+3)" : "Riyadh (UTC+3)"}</SelectItem>
                        <SelectItem value="Asia/Dubai">{language === "ar" ? "دبي (UTC+4)" : "Dubai (UTC+4)"}</SelectItem>
                        <SelectItem value="Europe/London">{language === "ar" ? "لندن (UTC+0)" : "London (UTC+0)"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {language === "ar" ? "حفظ التفضيلات" : "Save Preferences"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-green-600" />
                  {language === "ar" ? "إعدادات الإشعارات" : "Notification Settings"}
                </CardTitle>
                <CardDescription>
                  {language === "ar" ? "تحكم في كيفية تلقي الإشعارات" : "Control how you receive notifications"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Delivery Methods */}
                <div>
                  <h3 className="font-medium mb-4">{language === "ar" ? "طرق التوصيل" : "Delivery Methods"}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{language === "ar" ? "إشعارات البريد الإلكتروني" : "Email Notifications"}</Label>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "تلقي الإشعارات عبر البريد" : "Receive notifications via email"}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, email: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{language === "ar" ? "إشعارات الدفع" : "Push Notifications"}</Label>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "إشعارات على المتصفح" : "Browser push notifications"}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, push: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{language === "ar" ? "رسائل SMS" : "SMS Messages"}</Label>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "تلقي رسائل نصية" : "Receive text messages"}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.sms}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, sms: checked })}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Alert Types */}
                <div>
                  <h3 className="font-medium mb-4">{language === "ar" ? "أنواع التنبيهات" : "Alert Types"}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{language === "ar" ? "تنبيهات الطقس" : "Weather Alerts"}</Label>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "تحذيرات الطقس الهامة" : "Important weather warnings"}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weatherAlerts}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, weatherAlerts: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{language === "ar" ? "تنبيهات الأسعار" : "Market/Price Alerts"}</Label>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "تغييرات أسعار المحاصيل" : "Crop price changes"}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.marketAlerts}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, marketAlerts: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{language === "ar" ? "تذكيرات المهام" : "Task Reminders"}</Label>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "تذكيرات بالمهام المجدولة" : "Scheduled task reminders"}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.taskReminders}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, taskReminders: checked })}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {language === "ar" ? "حفظ الإعدادات" : "Save Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  {language === "ar" ? "الأمان والخصوصية" : "Security & Privacy"}
                </CardTitle>
                <CardDescription>
                  {language === "ar" ? "إدارة أمان حسابك" : "Manage your account security"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Change */}
                <div className="space-y-4">
                  <h3 className="font-medium">{language === "ar" ? "تغيير كلمة المرور" : "Change Password"}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="current-password">
                      {language === "ar" ? "كلمة المرور الحالية" : "Current Password"}
                    </Label>
                    <Input id="current-password" type="password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">
                      {language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                    </Label>
                    <Input id="new-password" type="password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      {language === "ar" ? "تأكيد كلمة المرور" : "Confirm New Password"}
                    </Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  
                  <Button variant="outline">
                    {language === "ar" ? "تحديث كلمة المرور" : "Update Password"}
                  </Button>
                </div>
                
                <Separator />
                
                {/* Danger Zone */}
                <div className="space-y-4">
                  <h3 className="font-medium text-red-600">{language === "ar" ? "منطقة الخطر" : "Danger Zone"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" 
                      ? "هذه الإجراءات لا يمكن التراجع عنها" 
                      : "These actions are irreversible"}
                  </p>
                  
                  <div className="flex gap-4">
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                      {language === "ar" ? "حذف جميع البيانات" : "Delete All Data"}
                    </Button>
                    <Button variant="destructive">
                      {language === "ar" ? "حذف الحساب" : "Delete Account"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

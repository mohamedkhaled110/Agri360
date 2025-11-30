"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts"
import { 
  MapPin, Ruler, Droplets, TreePine, Plus, Edit, Trash2,
  Loader2, RefreshCw, Beef, Wheat, Sprout, AlertCircle,
  CheckCircle, Heart, Calendar
} from "lucide-react"
import { farms, Farm } from "@/lib/api"

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const animalTypes = [
  { value: 'cattle', labelEn: 'Cattle', labelAr: 'أبقار' },
  { value: 'sheep', labelEn: 'Sheep', labelAr: 'أغنام' },
  { value: 'goats', labelEn: 'Goats', labelAr: 'ماعز' },
  { value: 'poultry', labelEn: 'Poultry', labelAr: 'دواجن' },
  { value: 'horses', labelEn: 'Horses', labelAr: 'خيول' },
  { value: 'camels', labelEn: 'Camels', labelAr: 'إبل' },
  { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
]

const healthStatuses = [
  { value: 'healthy', labelEn: 'Healthy', labelAr: 'صحي', color: 'bg-green-500' },
  { value: 'sick', labelEn: 'Sick', labelAr: 'مريض', color: 'bg-red-500' },
  { value: 'recovering', labelEn: 'Recovering', labelAr: 'في التعافي', color: 'bg-yellow-500' },
]

const soilTypes = [
  { value: 'clay', labelEn: 'Clay', labelAr: 'طيني' },
  { value: 'sandy', labelEn: 'Sandy', labelAr: 'رملي' },
  { value: 'loam', labelEn: 'Loam', labelAr: 'طمي' },
  { value: 'silt', labelEn: 'Silt', labelAr: 'غريني' },
  { value: 'peat', labelEn: 'Peat', labelAr: 'خثي' },
  { value: 'chalk', labelEn: 'Chalk', labelAr: 'طباشيري' },
]

const waterSources = [
  { value: 'well', labelEn: 'Well', labelAr: 'بئر' },
  { value: 'river', labelEn: 'River', labelAr: 'نهر' },
  { value: 'canal', labelEn: 'Canal', labelAr: 'قناة' },
  { value: 'rain', labelEn: 'Rain', labelAr: 'مطر' },
  { value: 'municipal', labelEn: 'Municipal', labelAr: 'مياه بلدية' },
]

export default function FarmPage() {
  const { language } = useLanguage()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [farm, setFarm] = useState<Farm | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Forms
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAnimalDialogOpen, setIsAnimalDialogOpen] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<any>(null)
  
  const [farmForm, setFarmForm] = useState({
    name: '',
    location: '',
    size: '',
    sizeUnit: 'hectares',
    soilType: '',
    waterSource: '',
  })
  
  const [animalForm, setAnimalForm] = useState({
    type: '',
    breed: '',
    count: '',
    healthStatus: 'healthy',
    feedType: '',
    notes: '',
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch farm data
  useEffect(() => {
    if (isAuthenticated) {
      fetchFarm()
    }
  }, [isAuthenticated])

  const fetchFarm = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await farms.getMyFarm()
      setFarm(data)
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('No farm')) {
        // No farm exists yet, that's OK
        setFarm(null)
      } else {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFarm = async () => {
    try {
      setIsSaving(true)
      const newFarm = await farms.create({
        name: farmForm.name,
        location: farmForm.location,
        size: parseFloat(farmForm.size),
        sizeUnit: farmForm.sizeUnit,
        soilType: farmForm.soilType,
        waterSource: farmForm.waterSource,
      })
      setFarm(newFarm)
      setIsCreateDialogOpen(false)
      resetFarmForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateFarm = async () => {
    try {
      setIsSaving(true)
      const updatedFarm = await farms.updateFarm({
        name: farmForm.name,
        location: farmForm.location,
        size: parseFloat(farmForm.size),
        sizeUnit: farmForm.sizeUnit,
        soilType: farmForm.soilType,
        waterSource: farmForm.waterSource,
      })
      setFarm(updatedFarm)
      setIsCreateDialogOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddAnimal = async () => {
    try {
      setIsSaving(true)
      const updatedFarm = await farms.addAnimal({
        type: animalForm.type,
        breed: animalForm.breed,
        count: parseInt(animalForm.count),
        healthStatus: animalForm.healthStatus,
        feedType: animalForm.feedType,
        notes: animalForm.notes,
      })
      setFarm(updatedFarm)
      setIsAnimalDialogOpen(false)
      resetAnimalForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateAnimal = async () => {
    if (!editingAnimal) return
    try {
      setIsSaving(true)
      const updatedFarm = await farms.updateAnimal(editingAnimal._id, {
        type: animalForm.type,
        breed: animalForm.breed,
        count: parseInt(animalForm.count),
        healthStatus: animalForm.healthStatus,
        feedType: animalForm.feedType,
        notes: animalForm.notes,
      })
      setFarm(updatedFarm)
      setIsAnimalDialogOpen(false)
      setEditingAnimal(null)
      resetAnimalForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAnimal = async (animalId: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الحيوان؟' : 'Are you sure you want to delete this animal?')) {
      return
    }
    try {
      const updatedFarm = await farms.deleteAnimal(animalId)
      setFarm(updatedFarm)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetFarmForm = () => {
    setFarmForm({
      name: '',
      location: '',
      size: '',
      sizeUnit: 'hectares',
      soilType: '',
      waterSource: '',
    })
  }

  const resetAnimalForm = () => {
    setAnimalForm({
      type: '',
      breed: '',
      count: '',
      healthStatus: 'healthy',
      feedType: '',
      notes: '',
    })
  }

  const openEditFarm = () => {
    if (farm) {
      setFarmForm({
        name: farm.name || '',
        location: farm.location || '',
        size: (farm.size || farm.area || 0).toString(),
        sizeUnit: farm.sizeUnit || 'hectares',
        soilType: farm.soilType || '',
        waterSource: farm.waterSource || '',
      })
    }
    setIsCreateDialogOpen(true)
  }

  const openEditAnimal = (animal: any) => {
    setEditingAnimal(animal)
    setAnimalForm({
      type: animal.type,
      breed: animal.breed || '',
      count: animal.count.toString(),
      healthStatus: animal.healthStatus,
      feedType: animal.feedType || '',
      notes: animal.notes || '',
    })
    setIsAnimalDialogOpen(true)
  }

  const getAnimalLabel = (type: string) => {
    const animal = animalTypes.find(a => a.value === type)
    return language === 'ar' ? animal?.labelAr : animal?.labelEn || type
  }

  const getHealthLabel = (status: string) => {
    const health = healthStatuses.find(h => h.value === status)
    return language === 'ar' ? health?.labelAr : health?.labelEn || status
  }

  const getHealthColor = (status: string) => {
    const health = healthStatuses.find(h => h.value === status)
    return health?.color || 'bg-gray-500'
  }

  // Prepare chart data
  const animalChartData = farm?.animals?.map((animal, index) => ({
    name: getAnimalLabel(animal.type),
    value: animal.count,
    color: COLORS[index % COLORS.length]
  })) || []

  const cropChartData = farm?.crops?.map(crop => ({
    name: crop.name,
    area: crop.area
  })) || []

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'إدارة المزرعة' : 'Farm Management'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'إدارة تفاصيل مزرعتك ومحاصيلك وحيواناتك' : 'Manage your farm details, crops, and animals'}
            </p>
          </div>
          <Button onClick={fetchFarm} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* No Farm State */}
        {!farm && (
          <Card className="max-w-lg mx-auto mt-12">
            <CardHeader className="text-center">
              <TreePine className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <CardTitle>{language === 'ar' ? 'لم يتم إنشاء مزرعة بعد' : 'No Farm Created Yet'}</CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'أنشئ مزرعتك الأولى للبدء في إدارة محاصيلك وحيواناتك'
                  : 'Create your first farm to start managing your crops and animals'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    {language === 'ar' ? 'إنشاء مزرعة' : 'Create Farm'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'إنشاء مزرعة جديدة' : 'Create New Farm'}</DialogTitle>
                    <DialogDescription>
                      {language === 'ar' ? 'أدخل تفاصيل مزرعتك' : 'Enter your farm details'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{language === 'ar' ? 'اسم المزرعة' : 'Farm Name'}</Label>
                      <Input
                        value={farmForm.name}
                        onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                        placeholder={language === 'ar' ? 'أدخل اسم المزرعة' : 'Enter farm name'}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'الموقع' : 'Location'}</Label>
                      <Input
                        value={farmForm.location}
                        onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
                        placeholder={language === 'ar' ? 'المدينة أو المنطقة' : 'City or region'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{language === 'ar' ? 'المساحة' : 'Size'}</Label>
                        <Input
                          type="number"
                          value={farmForm.size}
                          onChange={(e) => setFarmForm({ ...farmForm, size: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label>{language === 'ar' ? 'الوحدة' : 'Unit'}</Label>
                        <Select
                          value={farmForm.sizeUnit}
                          onValueChange={(v) => setFarmForm({ ...farmForm, sizeUnit: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hectares">{language === 'ar' ? 'هكتار' : 'Hectares'}</SelectItem>
                            <SelectItem value="acres">{language === 'ar' ? 'فدان' : 'Acres'}</SelectItem>
                            <SelectItem value="sqm">{language === 'ar' ? 'متر مربع' : 'Sq Meters'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'نوع التربة' : 'Soil Type'}</Label>
                      <Select
                        value={farmForm.soilType}
                        onValueChange={(v) => setFarmForm({ ...farmForm, soilType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر نوع التربة' : 'Select soil type'} />
                        </SelectTrigger>
                        <SelectContent>
                          {soilTypes.map(soil => (
                            <SelectItem key={soil.value} value={soil.value}>
                              {language === 'ar' ? soil.labelAr : soil.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'مصدر المياه' : 'Water Source'}</Label>
                      <Select
                        value={farmForm.waterSource}
                        onValueChange={(v) => setFarmForm({ ...farmForm, waterSource: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر مصدر المياه' : 'Select water source'} />
                        </SelectTrigger>
                        <SelectContent>
                          {waterSources.map(water => (
                            <SelectItem key={water.value} value={water.value}>
                              {language === 'ar' ? water.labelAr : water.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button onClick={handleCreateFarm} disabled={isSaving || !farmForm.name || !farmForm.location || !farmForm.size}>
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {language === 'ar' ? 'إنشاء' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Farm Exists - Show Details */}
        {farm && (
          <>
            {/* Farm Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اسم المزرعة' : 'Farm Name'}</p>
                      <p className="text-xl font-bold">{farm.name}</p>
                    </div>
                    <TreePine className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الموقع' : 'Location'}</p>
                      <p className="text-xl font-bold">{farm.location}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المساحة' : 'Size'}</p>
                      <p className="text-xl font-bold">{farm.size} {farm.sizeUnit}</p>
                    </div>
                    <Ruler className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مصدر المياه' : 'Water Source'}</p>
                      <p className="text-xl font-bold capitalize">{farm.waterSource || '-'}</p>
                    </div>
                    <Droplets className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">
                  {language === 'ar' ? 'نظرة عامة' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="animals">
                  {language === 'ar' ? 'الحيوانات' : 'Animals'}
                </TabsTrigger>
                <TabsTrigger value="crops">
                  {language === 'ar' ? 'المحاصيل' : 'Crops'}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Farm Details Card */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{language === 'ar' ? 'تفاصيل المزرعة' : 'Farm Details'}</CardTitle>
                      <Button variant="outline" size="sm" onClick={openEditFarm}>
                        <Edit className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{language === 'ar' ? 'نوع التربة' : 'Soil Type'}</p>
                          <p className="font-medium capitalize">{farm.soilType || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مصدر المياه' : 'Water Source'}</p>
                          <p className="font-medium capitalize">{farm.waterSource || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{language === 'ar' ? 'عدد المحاصيل' : 'Total Crops'}</p>
                          <p className="font-medium">{farm.crops?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{language === 'ar' ? 'عدد الحيوانات' : 'Total Animals'}</p>
                          <p className="font-medium">{farm.animals?.reduce((acc, a) => acc + a.count, 0) || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Animals Chart */}
                  {animalChartData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{language === 'ar' ? 'توزيع الحيوانات' : 'Animals Distribution'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={animalChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {animalChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Animals Tab */}
              <TabsContent value="animals">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{language === 'ar' ? 'إدارة الحيوانات' : 'Animal Management'}</CardTitle>
                      <CardDescription>
                        {language === 'ar' ? 'إضافة وإدارة حيوانات المزرعة' : 'Add and manage farm animals'}
                      </CardDescription>
                    </div>
                    <Dialog open={isAnimalDialogOpen} onOpenChange={(open) => {
                      setIsAnimalDialogOpen(open)
                      if (!open) {
                        setEditingAnimal(null)
                        resetAnimalForm()
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'إضافة حيوان' : 'Add Animal'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingAnimal 
                              ? (language === 'ar' ? 'تعديل الحيوان' : 'Edit Animal')
                              : (language === 'ar' ? 'إضافة حيوان جديد' : 'Add New Animal')
                            }
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{language === 'ar' ? 'النوع' : 'Type'}</Label>
                            <Select
                              value={animalForm.type}
                              onValueChange={(v) => setAnimalForm({ ...animalForm, type: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'ar' ? 'اختر النوع' : 'Select type'} />
                              </SelectTrigger>
                              <SelectContent>
                                {animalTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {language === 'ar' ? type.labelAr : type.labelEn}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'السلالة' : 'Breed'}</Label>
                            <Input
                              value={animalForm.breed}
                              onChange={(e) => setAnimalForm({ ...animalForm, breed: e.target.value })}
                              placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>{language === 'ar' ? 'العدد' : 'Count'}</Label>
                              <Input
                                type="number"
                                value={animalForm.count}
                                onChange={(e) => setAnimalForm({ ...animalForm, count: e.target.value })}
                                placeholder="10"
                              />
                            </div>
                            <div>
                              <Label>{language === 'ar' ? 'الحالة الصحية' : 'Health Status'}</Label>
                              <Select
                                value={animalForm.healthStatus}
                                onValueChange={(v) => setAnimalForm({ ...animalForm, healthStatus: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {healthStatuses.map(status => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {language === 'ar' ? status.labelAr : status.labelEn}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'نوع العلف' : 'Feed Type'}</Label>
                            <Input
                              value={animalForm.feedType}
                              onChange={(e) => setAnimalForm({ ...animalForm, feedType: e.target.value })}
                              placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
                            />
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                            <Textarea
                              value={animalForm.notes}
                              onChange={(e) => setAnimalForm({ ...animalForm, notes: e.target.value })}
                              placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {
                            setIsAnimalDialogOpen(false)
                            setEditingAnimal(null)
                            resetAnimalForm()
                          }}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                          </Button>
                          <Button 
                            onClick={editingAnimal ? handleUpdateAnimal : handleAddAnimal} 
                            disabled={isSaving || !animalForm.type || !animalForm.count}
                          >
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingAnimal 
                              ? (language === 'ar' ? 'تحديث' : 'Update')
                              : (language === 'ar' ? 'إضافة' : 'Add')
                            }
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {(!farm.animals || farm.animals.length === 0) ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Beef className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{language === 'ar' ? 'لا توجد حيوانات مضافة' : 'No animals added yet'}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {farm.animals.map((animal: any, index: number) => (
                          <Card key={animal._id || index} className="relative">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <Beef className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-semibold">{getAnimalLabel(animal.type)}</p>
                                    {animal.breed && (
                                      <p className="text-sm text-muted-foreground">{animal.breed}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditAnimal(animal)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => handleDeleteAnimal(animal._id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">{language === 'ar' ? 'العدد' : 'Count'}</span>
                                  <span className="font-medium">{animal.count}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Health'}</span>
                                  <Badge className={`${getHealthColor(animal.healthStatus)} text-white`}>
                                    {getHealthLabel(animal.healthStatus)}
                                  </Badge>
                                </div>
                                {animal.feedType && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">{language === 'ar' ? 'العلف' : 'Feed'}</span>
                                    <span className="text-sm">{animal.feedType}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Crops Tab */}
              <TabsContent value="crops">
                <Card>
                  <CardHeader>
                    <CardTitle>{language === 'ar' ? 'إدارة المحاصيل' : 'Crop Management'}</CardTitle>
                    <CardDescription>
                      {language === 'ar' ? 'عرض وإدارة محاصيل المزرعة' : 'View and manage farm crops'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!farm.crops || farm.crops.length === 0) ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Wheat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{language === 'ar' ? 'لا توجد محاصيل مضافة' : 'No crops added yet'}</p>
                        <p className="text-sm mt-2">
                          {language === 'ar' 
                            ? 'استخدم أداة تخطيط الزراعة لإضافة محاصيل'
                            : 'Use the farming plan tool to add crops'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {cropChartData.length > 0 && (
                          <div className="h-[250px] mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={cropChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="area" fill="#22c55e" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {farm.crops.map((crop: any, index: number) => (
                            <Card key={index}>
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 rounded-lg bg-green-500/10">
                                    <Sprout className="h-6 w-6 text-green-500" />
                                  </div>
                                  <div>
                                    <p className="font-semibold">{crop.name}</p>
                                    <Badge variant="outline">{crop.status}</Badge>
                                  </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">{language === 'ar' ? 'المساحة' : 'Area'}</span>
                                    <span>{crop.area} ha</span>
                                  </div>
                                  {crop.plantingDate && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">{language === 'ar' ? 'تاريخ الزراعة' : 'Planted'}</span>
                                      <span>{new Date(crop.plantingDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  {crop.expectedHarvest && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">{language === 'ar' ? 'الحصاد المتوقع' : 'Expected Harvest'}</span>
                                      <span>{new Date(crop.expectedHarvest).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Edit Farm Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{language === 'ar' ? 'تعديل المزرعة' : 'Edit Farm'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{language === 'ar' ? 'اسم المزرعة' : 'Farm Name'}</Label>
                    <Input
                      value={farmForm.name}
                      onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'الموقع' : 'Location'}</Label>
                    <Input
                      value={farmForm.location}
                      onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'ar' ? 'المساحة' : 'Size'}</Label>
                      <Input
                        type="number"
                        value={farmForm.size}
                        onChange={(e) => setFarmForm({ ...farmForm, size: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'الوحدة' : 'Unit'}</Label>
                      <Select
                        value={farmForm.sizeUnit}
                        onValueChange={(v) => setFarmForm({ ...farmForm, sizeUnit: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hectares">{language === 'ar' ? 'هكتار' : 'Hectares'}</SelectItem>
                          <SelectItem value="acres">{language === 'ar' ? 'فدان' : 'Acres'}</SelectItem>
                          <SelectItem value="sqm">{language === 'ar' ? 'متر مربع' : 'Sq Meters'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'نوع التربة' : 'Soil Type'}</Label>
                    <Select
                      value={farmForm.soilType}
                      onValueChange={(v) => setFarmForm({ ...farmForm, soilType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {soilTypes.map(soil => (
                          <SelectItem key={soil.value} value={soil.value}>
                            {language === 'ar' ? soil.labelAr : soil.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'مصدر المياه' : 'Water Source'}</Label>
                    <Select
                      value={farmForm.waterSource}
                      onValueChange={(v) => setFarmForm({ ...farmForm, waterSource: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {waterSources.map(water => (
                          <SelectItem key={water.value} value={water.value}>
                            {language === 'ar' ? water.labelAr : water.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button onClick={handleUpdateFarm} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}

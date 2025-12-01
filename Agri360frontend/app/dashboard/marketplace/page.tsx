"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Search, Filter, Plus, MapPin, Package, TrendingUp, 
  MessageCircle, Edit, Trash2, ArrowLeft, Loader2,
  DollarSign, AlertCircle, RefreshCw, ShoppingCart
} from 'lucide-react'
import { marketplace, MarketListing } from "@/lib/api"

const cropTypes = [
  { value: 'wheat', labelEn: 'Wheat', labelAr: 'قمح' },
  { value: 'corn', labelEn: 'Corn', labelAr: 'ذرة' },
  { value: 'rice', labelEn: 'Rice', labelAr: 'أرز' },
  { value: 'barley', labelEn: 'Barley', labelAr: 'شعير' },
  { value: 'soybeans', labelEn: 'Soybeans', labelAr: 'فول الصويا' },
  { value: 'cotton', labelEn: 'Cotton', labelAr: 'قطن' },
  { value: 'tomatoes', labelEn: 'Tomatoes', labelAr: 'طماطم' },
  { value: 'potatoes', labelEn: 'Potatoes', labelAr: 'بطاطس' },
  { value: 'onions', labelEn: 'Onions', labelAr: 'بصل' },
  { value: 'dates', labelEn: 'Dates', labelAr: 'تمور' },
  { value: 'olives', labelEn: 'Olives', labelAr: 'زيتون' },
  { value: 'citrus', labelEn: 'Citrus', labelAr: 'حمضيات' },
  { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
]

const units = [
  { value: 'kg', labelEn: 'Kilograms', labelAr: 'كيلوجرام' },
  { value: 'ton', labelEn: 'Tons', labelAr: 'طن' },
  { value: 'piece', labelEn: 'Pieces', labelAr: 'قطعة' },
  { value: 'bag', labelEn: 'Bags', labelAr: 'كيس' },
  { value: 'box', labelEn: 'Boxes', labelAr: 'صندوق' },
]

export default function MarketplacePage() {
  const { t, language } = useLanguage()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [listings, setListings] = useState<MarketListing[]>([])
  const [myListings, setMyListings] = useState<MarketListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCrop, setSelectedCrop] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  
  // Form state
  const [listingForm, setListingForm] = useState({
    crop: '',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
    currency: 'USD',
    description: '',
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch listings
  useEffect(() => {
    if (isAuthenticated) {
      fetchListings()
    }
  }, [isAuthenticated])

  const fetchListings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [allRes, myRes] = await Promise.allSettled([
        marketplace.listListings(),
        marketplace.getMyListings()
      ])

      if (allRes.status === 'fulfilled') {
        setListings(allRes.value.listings || [])
      }

      if (myRes.status === 'fulfilled') {
        setMyListings(Array.isArray(myRes.value) ? myRes.value : [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateListing = async () => {
    try {
      setIsSaving(true)
      await marketplace.createListing({
        crop: listingForm.crop,
        quantity: parseFloat(listingForm.quantity),
        unit: listingForm.unit,
        pricePerUnit: parseFloat(listingForm.pricePerUnit),
        currency: listingForm.currency,
        description: listingForm.description,
      })
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchListings()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteListing = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الإعلان؟' : 'Are you sure you want to delete this listing?')) {
      return
    }
    try {
      await marketplace.deleteListing(id)
      await fetchListings()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setListingForm({
      crop: '',
      quantity: '',
      unit: 'kg',
      pricePerUnit: '',
      currency: 'USD',
      description: '',
    })
  }

  const getCropLabel = (crop: string) => {
    const found = cropTypes.find(c => c.value === crop)
    return language === 'ar' ? found?.labelAr : found?.labelEn || crop
  }

  const getUnitLabel = (unit: string) => {
    const found = units.find(u => u.value === unit)
    return language === 'ar' ? found?.labelAr : found?.labelEn || unit
  }

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = 
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.crop?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCrop = selectedCrop === "all" || listing.crop === selectedCrop
    return matchesSearch && matchesCrop
  })

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-16 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">{t.marketplace.title}</h1>
            </div>
            <p className="text-muted-foreground">{t.marketplace.subtitle}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchListings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t.marketplace.actions.newListing}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.marketplace.listing.title}</DialogTitle>
                  <DialogDescription>
                    {language === 'ar' ? 'أدخل تفاصيل منتجك للبيع' : 'Enter your product details to sell'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'نوع المحصول' : 'Crop Type'}</Label>
                    <Select
                      value={listingForm.crop}
                      onValueChange={(v) => setListingForm({ ...listingForm, crop: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر المحصول' : 'Select crop'} />
                      </SelectTrigger>
                      <SelectContent>
                        {cropTypes.map(crop => (
                          <SelectItem key={crop.value} value={crop.value}>
                            {language === 'ar' ? crop.labelAr : crop.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'الكمية' : 'Quantity'}</Label>
                      <Input 
                        type="number" 
                        value={listingForm.quantity}
                        onChange={(e) => setListingForm({ ...listingForm, quantity: e.target.value })}
                        placeholder="100" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'الوحدة' : 'Unit'}</Label>
                      <Select
                        value={listingForm.unit}
                        onValueChange={(v) => setListingForm({ ...listingForm, unit: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {language === 'ar' ? unit.labelAr : unit.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'السعر لكل وحدة' : 'Price per Unit'}</Label>
                      <Input 
                        type="number" 
                        value={listingForm.pricePerUnit}
                        onChange={(e) => setListingForm({ ...listingForm, pricePerUnit: e.target.value })}
                        placeholder="50" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'العملة' : 'Currency'}</Label>
                      <Select
                        value={listingForm.currency}
                        onValueChange={(v) => setListingForm({ ...listingForm, currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                          <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                          <SelectItem value="AED">AED (د.إ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'وصف إضافي' : 'Description (Optional)'}</Label>
                    <Textarea 
                      value={listingForm.description}
                      onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                      placeholder={language === 'ar' ? 'أضف وصفاً لمنتجك...' : 'Add a description for your product...'}
                      rows={3} 
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button 
                    onClick={handleCreateListing} 
                    disabled={isSaving || !listingForm.crop || !listingForm.quantity || !listingForm.pricePerUnit}
                  >
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t.marketplace.listing.publish}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>×</Button>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.marketplace.filters.search}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder={language === 'ar' ? 'جميع المحاصيل' : 'All Crops'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع المحاصيل' : 'All Crops'}</SelectItem>
                  {cropTypes.map(crop => (
                    <SelectItem key={crop.value} value={crop.value}>
                      {language === 'ar' ? crop.labelAr : crop.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">{t.marketplace.tabs.all}</TabsTrigger>
            <TabsTrigger value="myListings">{t.marketplace.tabs.myListings}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {filteredListings.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t.marketplace.empty.title}</h3>
                    <p className="text-muted-foreground">{t.marketplace.empty.description}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <Card key={listing._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                      <Package className="h-16 w-16 text-green-600/50" />
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        {listing.status || 'active'}
                      </Badge>
                    </div>
                    
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{listing.title || getCropLabel(listing.crop)}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {listing.description || `${listing.quantity} ${getUnitLabel(listing.unit)} ${language === 'ar' ? 'متوفرة' : 'available'}`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {listing.currency === 'EGP' ? 'ج.م' : listing.currency === 'SAR' ? 'ر.س' : '$'}
                          {listing.pricePerUnit}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{getUnitLabel(listing.unit)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {listing.quantity} {getUnitLabel(listing.unit)} {language === 'ar' ? 'متوفرة' : 'available'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{listing.location || (language === 'ar' ? 'غير محدد' : 'Not specified')}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1 gap-2" variant="default">
                          <ShoppingCart className="h-4 w-4" />
                          {language === 'ar' ? 'شراء' : 'Buy'}
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'تواصل' : 'Contact'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="myListings">
            {myListings.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {language === 'ar' ? 'لا توجد إعلانات' : 'No Listings Yet'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {language === 'ar' ? 'ابدأ ببيع منتجاتك الزراعية' : 'Start selling your agricultural products'}
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t.marketplace.actions.newListing}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => (
                  <Card key={listing._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                      <Package className="h-16 w-16 text-blue-600/50" />
                      <Badge className="absolute top-2 right-2" variant={listing.status === 'active' ? 'default' : 'secondary'}>
                        {listing.status}
                      </Badge>
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-lg truncate">{listing.title || getCropLabel(listing.crop)}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {listing.description || `${listing.quantity} ${getUnitLabel(listing.unit)}`}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {listing.currency === 'EGP' ? 'ج.م' : listing.currency === 'SAR' ? 'ر.س' : '$'}
                          {listing.pricePerUnit}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{getUnitLabel(listing.unit)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {listing.quantity} {getUnitLabel(listing.unit)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 gap-2">
                          <Edit className="h-4 w-4" />
                          {language === 'ar' ? 'تعديل' : 'Edit'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDeleteListing(listing._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

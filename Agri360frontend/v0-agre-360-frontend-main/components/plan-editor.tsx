"use client"

import { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  Sparkles, Send, Loader2, CheckCircle, Download, RefreshCw,
  FileText, Lightbulb, MessageSquare, ThumbsUp, Edit3
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface PlanEditorProps {
  planType: "business" | "farming" | "market" | "crop" | "animal" | "mixed"
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// Plan type configurations
const planTypeConfig: Record<string, { nameEn: string; nameAr: string; icon: string; color: string; description: string; descriptionAr: string }> = {
  farming: { nameEn: 'Farming Plan', nameAr: 'خطة زراعية', icon: '🌱', color: 'green', description: 'Crop cultivation and farm management', descriptionAr: 'زراعة المحاصيل وإدارة المزرعة' },
  crop: { nameEn: 'Crop Plan', nameAr: 'خطة محصول', icon: '🌾', color: 'amber', description: 'Single crop production plan', descriptionAr: 'خطة إنتاج محصول واحد' },
  business: { nameEn: 'Business Plan', nameAr: 'خطة تجارية', icon: '💼', color: 'blue', description: 'Farm business and investment strategy', descriptionAr: 'استراتيجية الأعمال والاستثمار الزراعي' },
  market: { nameEn: 'Market Plan', nameAr: 'خطة تسويقية', icon: '📊', color: 'purple', description: 'Marketing and sales strategy', descriptionAr: 'استراتيجية التسويق والمبيعات' },
  animal: { nameEn: 'Animal Plan', nameAr: 'خطة حيوانية', icon: '🐄', color: 'orange', description: 'Livestock and animal husbandry', descriptionAr: 'تربية الماشية والحيوانات' },
  mixed: { nameEn: 'Mixed Plan', nameAr: 'خطة مختلطة', icon: '🏡', color: 'teal', description: 'Combined farming operations', descriptionAr: 'عمليات زراعية مجمعة' },
}

export function PlanEditor({ planType = "farming" }: PlanEditorProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  
  // Get plan type config
  const config = planTypeConfig[planType] || planTypeConfig.farming
  const title = language === 'ar' ? config.nameAr : config.nameEn
  
  // Plan generation state
  const [userPrompt, setUserPrompt] = useState("")
  const [generatedPlan, setGeneratedPlan] = useState("")
  const [displayedPlan, setDisplayedPlan] = useState("") // For streaming effect
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered')
  
  // Discussion state
  const [discussionInput, setDiscussionInput] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isDiscussing, setIsDiscussing] = useState(false)
  
  // Step tracking
  const [step, setStep] = useState<'input' | 'review' | 'approved'>('input')
  
  // Progress
  const [generationProgress, setGenerationProgress] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  // Streaming effect for plan display
  useEffect(() => {
    if (generatedPlan && generatedPlan !== displayedPlan && !isStreaming) {
      setIsStreaming(true)
      let currentIndex = 0
      const totalLength = generatedPlan.length
      const charsPerTick = Math.max(5, Math.ceil(totalLength / 200)) // Complete in ~200 ticks
      
      const streamInterval = setInterval(() => {
        currentIndex = Math.min(currentIndex + charsPerTick, totalLength)
        setDisplayedPlan(generatedPlan.substring(0, currentIndex))
        if (currentIndex >= totalLength) {
          clearInterval(streamInterval)
          setIsStreaming(false)
        }
      }, 15)
      
      return () => clearInterval(streamInterval)
    }
  }, [generatedPlan])

  const startProgress = () => {
    setGenerationProgress(0)
    progressInterval.current = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.random() * 2, 90))
    }, 500)
  }

  const stopProgress = () => {
    if (progressInterval.current) clearInterval(progressInterval.current)
    setGenerationProgress(100)
    setTimeout(() => setGenerationProgress(0), 500)
  }

  // Generate plan with AI
  const handleGeneratePlan = async () => {
    if (!userPrompt.trim()) return
    
    setIsGenerating(true)
    setGeneratedPlan("")
    setDisplayedPlan("")
    startProgress()
    
    try {
      const chatApi = (await import("@/lib/api")).chat
      
      // Build specific prompt based on plan type
      const prompt = buildPlanPrompt(planType, userPrompt, language)
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(language === 'ar' ? 'انتهت مهلة الطلب' : 'Request timed out')), 150000)
      )
      
      const response = await Promise.race([
        chatApi.send(prompt, { topic: planType, lang: language }),
        timeoutPromise
      ]) as { response: string; suggestions?: string[] }
      
      stopProgress()
      
      if (response?.response) {
        setGeneratedPlan(response.response)
        setStep('review')
      } else {
        throw new Error(language === 'ar' ? 'لم يتم تلقي رد' : 'No response received')
      }
    } catch (err: any) {
      stopProgress()
      const errorMsg = language === 'ar' 
        ? `خطأ: ${err.message}` 
        : `Error: ${err.message}`
      setGeneratedPlan(errorMsg)
      setDisplayedPlan(errorMsg)
      setStep('review')
    } finally {
      setIsGenerating(false)
    }
  }

  // Discuss/modify plan with AI
  const handleDiscuss = async () => {
    if (!discussionInput.trim()) return
    
    const userMessage: ChatMessage = { role: "user", content: discussionInput }
    setChatHistory(prev => [...prev, userMessage])
    const currentRequest = discussionInput
    setDiscussionInput("")
    setIsDiscussing(true)
    
    try {
      const chatApi = (await import("@/lib/api")).chat
      
      // Request modification to the plan - ask AI to return the FULL modified plan
      const context = language === 'ar'
        ? `أنت مساعد زراعي. لديك الخطة التالية:\n\n${generatedPlan}\n\n---\nطلب المستخدم: ${currentRequest}\n\n---\nمهم جداً: قم بتطبيق التعديل المطلوب وأعد كتابة الخطة كاملة مع التعديلات. لا تجيب بنص قصير - أعد الخطة الكاملة المعدلة.`
        : `You are an agricultural assistant. You have the following plan:\n\n${generatedPlan}\n\n---\nUser request: ${currentRequest}\n\n---\nIMPORTANT: Apply the requested modification and rewrite the COMPLETE plan with changes. Do NOT respond with a short answer - return the FULL modified plan.`
      
      // Add timeout of 120 seconds for discussion
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(language === 'ar' ? 'انتهت مهلة الطلب' : 'Request timed out')), 120000)
      )
      
      const response = await Promise.race([
        chatApi.send(context, { topic: planType, lang: language }),
        timeoutPromise
      ]) as { response: string; suggestions?: string[] }
      
      // Always update the main plan with the AI response (it should be the modified plan)
      if (response?.response && response.response.length > 100) {
        setGeneratedPlan(response.response)
        // Add confirmation to chat
        const confirmMessage: ChatMessage = { 
          role: "assistant", 
          content: language === 'ar' 
            ? '✅ تم تحديث الخطة بنجاح. راجع التغييرات في المربع الرئيسي.' 
            : '✅ Plan updated successfully. Review the changes in the main box.'
        }
        setChatHistory(prev => [...prev, confirmMessage])
      } else {
        // If response is short, show it as a chat message
        const aiMessage: ChatMessage = { 
          role: "assistant", 
          content: response?.response || (language === 'ar' ? 'عذراً، لم أتمكن من الرد' : 'Sorry, I could not respond')
        }
        setChatHistory(prev => [...prev, aiMessage])
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = { 
        role: "assistant", 
        content: language === 'ar' 
          ? `خطأ: ${err.message}` 
          : `Error: ${err.message}`
      }
      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setIsDiscussing(false)
    }
  }

  // Parse phases from generated plan text
  const parsePhasesFromPlan = (planText: string): any[] => {
    const phases: any[] = []
    const now = new Date()
    
    // Look for phase patterns like "Phase 1:", "المرحلة 1:", "Week 1-2:", etc.
    const phasePatterns = [
      /(?:Phase|Stage|Step)\s*(\d+)[:\s]*([^\n]+)/gi,
      /(?:المرحلة|الخطوة)\s*(\d+)[:\s]*([^\n]+)/gi,
      /(?:Week|الأسبوع)\s*(\d+)(?:\s*-\s*(\d+))?[:\s]*([^\n]+)/gi,
      /(?:Month|الشهر)\s*(\d+)(?:\s*-\s*(\d+))?[:\s]*([^\n]+)/gi,
    ]
    
    let phaseNum = 0
    for (const pattern of phasePatterns) {
      let match
      while ((match = pattern.exec(planText)) !== null) {
        phaseNum++
        const startWeek = parseInt(match[1]) || phaseNum
        const endWeek = match[2] ? parseInt(match[2]) : startWeek + 1
        const phaseName = match[match.length - 1]?.trim() || `Phase ${phaseNum}`
        
        const startDate = new Date(now)
        startDate.setDate(startDate.getDate() + (startWeek - 1) * 7)
        
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() + endWeek * 7)
        
        phases.push({
          name: phaseName.substring(0, 50),
          nameArabic: phaseName.substring(0, 50),
          description: phaseName,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: phaseNum === 1 ? 'in-progress' : 'pending',
          progress: phaseNum === 1 ? 10 : 0,
          tasks: []
        })
      }
    }
    
    // If no phases found, create default phases based on plan type
    if (phases.length === 0) {
      const defaultPhasesByType: Record<string, { name: string; nameAr: string; weeks: number }[]> = {
        farming: [
          { name: 'Land Preparation', nameAr: 'تجهيز الأرض', weeks: 2 },
          { name: 'Planting', nameAr: 'الزراعة', weeks: 2 },
          { name: 'Growth & Maintenance', nameAr: 'النمو والصيانة', weeks: 8 },
          { name: 'Harvest', nameAr: 'الحصاد', weeks: 2 },
        ],
        crop: [
          { name: 'Seed Selection', nameAr: 'اختيار البذور', weeks: 1 },
          { name: 'Soil Preparation', nameAr: 'تجهيز التربة', weeks: 2 },
          { name: 'Planting & Irrigation', nameAr: 'الزراعة والري', weeks: 3 },
          { name: 'Crop Care', nameAr: 'رعاية المحصول', weeks: 8 },
          { name: 'Harvest & Storage', nameAr: 'الحصاد والتخزين', weeks: 2 },
        ],
        business: [
          { name: 'Planning & Research', nameAr: 'التخطيط والبحث', weeks: 2 },
          { name: 'Setup & Investment', nameAr: 'الإعداد والاستثمار', weeks: 3 },
          { name: 'Operations', nameAr: 'العمليات', weeks: 8 },
          { name: 'Review & Scale', nameAr: 'المراجعة والتوسع', weeks: 2 },
        ],
        market: [
          { name: 'Market Analysis', nameAr: 'تحليل السوق', weeks: 1 },
          { name: 'Product Preparation', nameAr: 'تجهيز المنتج', weeks: 2 },
          { name: 'Marketing & Sales', nameAr: 'التسويق والمبيعات', weeks: 4 },
          { name: 'Delivery & Feedback', nameAr: 'التوصيل والتقييم', weeks: 2 },
        ],
        animal: [
          { name: 'Facility Setup', nameAr: 'إعداد المرافق', weeks: 2 },
          { name: 'Animal Acquisition', nameAr: 'شراء الحيوانات', weeks: 1 },
          { name: 'Feeding & Care', nameAr: 'التغذية والرعاية', weeks: 12 },
          { name: 'Production/Sale', nameAr: 'الإنتاج/البيع', weeks: 4 },
        ],
        mixed: [
          { name: 'Planning', nameAr: 'التخطيط', weeks: 2 },
          { name: 'Setup', nameAr: 'الإعداد', weeks: 3 },
          { name: 'Operations', nameAr: 'العمليات', weeks: 10 },
          { name: 'Harvest/Production', nameAr: 'الحصاد/الإنتاج', weeks: 3 },
        ],
      }
      
      const defaultPhases = defaultPhasesByType[planType] || defaultPhasesByType.farming
      
      let currentDate = new Date(now)
      defaultPhases.forEach((phase, i) => {
        const startDate = new Date(currentDate)
        const endDate = new Date(currentDate)
        endDate.setDate(endDate.getDate() + phase.weeks * 7)
        
        phases.push({
          name: phase.name,
          nameArabic: phase.nameAr,
          description: phase.name,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: i === 0 ? 'in-progress' : 'pending',
          progress: i === 0 ? 10 : 0,
          tasks: []
        })
        
        currentDate = new Date(endDate)
        currentDate.setDate(currentDate.getDate() + 1)
      })
    }
    
    return phases
  }

  // Approve and save plan
  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const plansApi = (await import("@/lib/api")).plans
      
      // Parse phases from the generated plan
      const phases = parsePhasesFromPlan(generatedPlan)
      
      const result = await plansApi.create({
        title: `${title} - ${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}`,
        type: planType,
        content: {
          plan: generatedPlan,
          prompt: userPrompt,
          approvedAt: new Date().toISOString()
        },
        phases: phases
      })
      
      console.log('Plan saved with phases:', result)
      
      setIsApproved(true)
      setStep('approved')
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (err: any) {
      console.error("Approve error:", err)
      alert(language === 'ar' ? `خطأ في حفظ الخطة: ${err.message}` : `Error saving plan: ${err.message}`)
    } finally {
      setIsApproving(false)
    }
  }

  // Export plan
  const handleExport = () => {
    const exportContent = `${title}\n${"=".repeat(title.length)}\n\n${generatedPlan}`
    const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${planType}-plan-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Regenerate plan
  const handleRegenerate = () => {
    setGeneratedPlan("")
    setDisplayedPlan("")
    setChatHistory([])
    setStep('input')
  }

  // Skip streaming
  const handleSkipStreaming = () => {
    setDisplayedPlan(generatedPlan)
    setIsStreaming(false)
  }

  // Get placeholder text based on plan type
  const getPlanPlaceholder = () => {
    const placeholders: Record<string, { en: string; ar: string }> = {
      farming: {
        en: 'Example: I want a plan for a 50-acre wheat farm in Upper Egypt, with modern irrigation and export capability...',
        ar: 'مثال: أريد خطة لمزرعة قمح على مساحة 50 فدان في صعيد مصر، مع نظام ري حديث وتصدير للخارج...'
      },
      crop: {
        en: 'Example: I want to grow tomatoes on 10 acres with drip irrigation, starting next season...',
        ar: 'مثال: أريد زراعة طماطم على 10 فدان مع ري بالتنقيط، بدءاً من الموسم القادم...'
      },
      business: {
        en: 'Example: I want to buy 2 cows for dairy production, or start a poultry business with 5000 chickens...',
        ar: 'مثال: أريد شراء بقرتين لإنتاج الألبان، أو بدء مشروع دواجن مع 5000 دجاجة...'
      },
      market: {
        en: 'Example: I have 100 tons of rice to sell, looking for best markets, pricing strategy, and buyers...',
        ar: 'مثال: لدي 100 طن أرز للبيع، أبحث عن أفضل الأسواق واستراتيجية التسعير والمشترين...'
      },
      animal: {
        en: 'Example: I want to raise 50 cattle for beef production, with organic feed...',
        ar: 'مثال: أريد تربية 50 رأس ماشية لإنتاج اللحوم، مع علف عضوي...'
      },
      mixed: {
        en: 'Example: I want a mixed farm with vegetables, chickens, and goats on 20 acres...',
        ar: 'مثال: أريد مزرعة مختلطة مع خضروات ودجاج وماعز على 20 فدان...'
      },
    }
    const placeholder = placeholders[planType] || placeholders.farming
    return language === 'ar' ? placeholder.ar : placeholder.en
  }

  // Build specific AI prompt based on plan type
  const buildPlanPrompt = (type: string, userInput: string, lang: string): string => {
    const prompts: Record<string, { en: string; ar: string }> = {
      farming: {
        en: `You are an expert agricultural consultant. Create a detailed FARMING PLAN for crop cultivation based on: "${userInput}"

Include these sections with markdown formatting:
## Executive Summary
Brief overview of the farming plan

## Crop Selection & Analysis
- Recommended crops and varieties
- Land requirements and preparation
- Climate and soil considerations

## Timeline & Phases
| Phase | Week | Activities |
|-------|------|------------|
(List all phases with specific weeks)

## Financial Analysis
| Item | Cost (EGP) |
|------|------------|
(Seeds, fertilizer, labor, irrigation, etc.)

### Expected Returns
- Estimated yield per acre
- Market price projections
- Total expected revenue
- Net profit

## Risk Assessment
- Weather risks
- Pest/disease risks
- Market risks
- Mitigation strategies

## Recommendations
Specific actionable advice for success`,

        ar: `أنت مستشار زراعي خبير. أنشئ خطة زراعية مفصلة لزراعة المحاصيل بناءً على: "${userInput}"

قم بتضمين هذه الأقسام بتنسيق markdown:
## الملخص التنفيذي
نظرة عامة موجزة على الخطة الزراعية

## اختيار المحصول والتحليل
- المحاصيل والأصناف الموصى بها
- متطلبات الأرض والتجهيز
- اعتبارات المناخ والتربة

## الجدول الزمني والمراحل
| المرحلة | الأسبوع | الأنشطة |
|---------|---------|---------|
(قائمة بجميع المراحل مع أسابيع محددة)

## التحليل المالي
| البند | التكلفة (جنيه) |
|-------|----------------|
(البذور، السماد، العمالة، الري، إلخ)

### العوائد المتوقعة
- الإنتاج المتوقع للفدان
- توقعات أسعار السوق
- إجمالي الإيرادات المتوقعة
- صافي الربح

## تقييم المخاطر
- مخاطر الطقس
- مخاطر الآفات/الأمراض
- مخاطر السوق
- استراتيجيات التخفيف

## التوصيات
نصائح عملية محددة للنجاح`
      },
      business: {
        en: `You are an expert agricultural business consultant. Create a detailed BUSINESS INVESTMENT PLAN based on: "${userInput}"

This is NOT a farming/crop plan. This is a BUSINESS STRATEGY for agricultural investment (buying animals, equipment, starting operations, etc.)

Include these sections with markdown formatting:
## Business Overview
- What is being purchased/invested in
- Business objectives and goals

## Investment Analysis
| Investment Item | Quantity | Unit Cost | Total Cost |
|-----------------|----------|-----------|------------|
(List all items to purchase)

### Total Investment Required
Summary of capital needed

## Operations Plan
- How the business will operate
- Daily/weekly management tasks
- Required resources and labor

## Revenue Model
| Product/Service | Monthly Output | Price | Monthly Revenue |
|-----------------|----------------|-------|-----------------|
(Expected income sources)

## Financial Projections
| Month | Expenses | Revenue | Net Profit |
|-------|----------|---------|------------|
(12-month projection)

### Break-even Analysis
When will the investment pay off?

### ROI Calculation
Expected return on investment

## Risk Analysis
- Market risks
- Operational risks
- Financial risks
- Contingency plans

## Recommendations
Step-by-step action plan`,

        ar: `أنت مستشار أعمال زراعية خبير. أنشئ خطة استثمار تجارية مفصلة بناءً على: "${userInput}"

هذه ليست خطة زراعة محاصيل. هذه استراتيجية عمل للاستثمار الزراعي (شراء حيوانات، معدات، بدء عمليات، إلخ)

قم بتضمين هذه الأقسام بتنسيق markdown:
## نظرة عامة على العمل
- ما الذي سيتم شراؤه/الاستثمار فيه
- أهداف وغايات العمل

## تحليل الاستثمار
| بند الاستثمار | الكمية | سعر الوحدة | التكلفة الإجمالية |
|---------------|--------|------------|-------------------|
(قائمة بجميع البنود للشراء)

### إجمالي الاستثمار المطلوب
ملخص رأس المال المطلوب

## خطة العمليات
- كيف سيعمل المشروع
- المهام اليومية/الأسبوعية
- الموارد والعمالة المطلوبة

## نموذج الإيرادات
| المنتج/الخدمة | الإنتاج الشهري | السعر | الإيراد الشهري |
|---------------|----------------|-------|----------------|
(مصادر الدخل المتوقعة)

## التوقعات المالية
| الشهر | المصروفات | الإيرادات | صافي الربح |
|-------|-----------|-----------|------------|
(توقعات 12 شهر)

### تحليل نقطة التعادل
متى سيسترد الاستثمار؟

### حساب العائد على الاستثمار
العائد المتوقع على الاستثمار

## تحليل المخاطر
- مخاطر السوق
- مخاطر التشغيل
- مخاطر مالية
- خطط الطوارئ

## التوصيات
خطة عمل خطوة بخطوة`
      },
      market: {
        en: `You are an expert agricultural marketing consultant. Create a detailed MARKETING & SALES PLAN based on: "${userInput}"

This plan is specifically for SELLING agricultural products. Focus on finding markets, pricing, and sales strategies.

Include these sections with markdown formatting:
## Product Analysis
- Product type and quantity available
- Quality grades
- Storage and shelf life

## Market Research
### Target Markets
| Market Type | Location | Demand Level | Typical Price |
|-------------|----------|--------------|---------------|
(Wholesale, retail, export, direct, restaurants, etc.)

### Competition Analysis
- Main competitors
- Their pricing
- Your competitive advantage

## Pricing Strategy
| Quality Grade | Suggested Price | Market Price Range |
|---------------|-----------------|-------------------|
(Pricing recommendations)

### Price Negotiation Tips
Best practices for getting good prices

## Sales Channels
1. **Wholesale Markets** - Pros, cons, contacts
2. **Direct to Retailers** - Requirements, margins
3. **Export Opportunities** - Requirements, procedures
4. **Online/Digital Sales** - Platforms, logistics

## Marketing Actions
| Week | Action | Target | Expected Result |
|------|--------|--------|-----------------|
(Specific marketing timeline)

## Logistics & Delivery
- Packaging requirements
- Transportation options
- Delivery schedules

## Financial Projections
| Scenario | Price/Unit | Total Revenue | Costs | Net Profit |
|----------|------------|---------------|-------|------------|
(Best, expected, worst case)

## Recommendations
Top 5 actionable steps to maximize sales`,

        ar: `أنت مستشار تسويق زراعي خبير. أنشئ خطة تسويق ومبيعات مفصلة بناءً على: "${userInput}"

هذه الخطة مخصصة لبيع المنتجات الزراعية. ركز على إيجاد الأسواق والتسعير واستراتيجيات البيع.

قم بتضمين هذه الأقسام بتنسيق markdown:
## تحليل المنتج
- نوع المنتج والكمية المتاحة
- درجات الجودة
- التخزين ومدة الصلاحية

## بحث السوق
### الأسواق المستهدفة
| نوع السوق | الموقع | مستوى الطلب | السعر النموذجي |
|-----------|--------|-------------|----------------|
(الجملة، التجزئة، التصدير، المباشر، المطاعم، إلخ)

### تحليل المنافسة
- المنافسون الرئيسيون
- أسعارهم
- ميزتك التنافسية

## استراتيجية التسعير
| درجة الجودة | السعر المقترح | نطاق سعر السوق |
|-------------|---------------|-----------------|
(توصيات التسعير)

### نصائح التفاوض على الأسعار
أفضل الممارسات للحصول على أسعار جيدة

## قنوات البيع
1. **أسواق الجملة** - المزايا، العيوب، جهات الاتصال
2. **مباشرة لتجار التجزئة** - المتطلبات، الهوامش
3. **فرص التصدير** - المتطلبات، الإجراءات
4. **البيع الإلكتروني** - المنصات، اللوجستيات

## إجراءات التسويق
| الأسبوع | الإجراء | الهدف | النتيجة المتوقعة |
|---------|---------|-------|------------------|
(جدول تسويق محدد)

## اللوجستيات والتوصيل
- متطلبات التعبئة
- خيارات النقل
- جداول التوصيل

## التوقعات المالية
| السيناريو | السعر/الوحدة | إجمالي الإيرادات | التكاليف | صافي الربح |
|-----------|-------------|-----------------|---------|------------|
(أفضل، متوقع، أسوأ حالة)

## التوصيات
أهم 5 خطوات عملية لتعظيم المبيعات`
      },
      animal: {
        en: `You are an expert livestock consultant. Create a detailed ANIMAL HUSBANDRY PLAN based on: "${userInput}"

Include these sections with markdown formatting:
## Overview
- Animal type and breed
- Number of animals
- Purpose (dairy, meat, eggs, breeding)

## Facility Requirements
| Facility | Specifications | Estimated Cost |
|----------|----------------|----------------|
(Housing, fencing, water, feed storage)

## Animal Acquisition
- Recommended sources
- Selection criteria
- Health checks required
- Transport considerations

## Feeding Program
| Stage | Feed Type | Daily Amount | Cost/Day |
|-------|-----------|--------------|----------|
(Complete feeding schedule)

## Health Management
- Vaccination schedule
- Common diseases and prevention
- Veterinary care requirements

## Production Timeline
| Month | Expected Output | Market Value |
|-------|-----------------|--------------|

## Financial Analysis
### Investment Costs
### Operating Costs (Monthly)
### Expected Revenue
### Profitability Analysis

## Recommendations`,

        ar: `أنت مستشار ثروة حيوانية خبير. أنشئ خطة تربية حيوانات مفصلة بناءً على: "${userInput}"

قم بتضمين هذه الأقسام بتنسيق markdown:
## نظرة عامة
- نوع الحيوان والسلالة
- عدد الحيوانات
- الغرض (ألبان، لحوم، بيض، تربية)

## متطلبات المرافق
| المرفق | المواصفات | التكلفة المقدرة |
|--------|-----------|-----------------|
(المساكن، الأسوار، المياه، تخزين الأعلاف)

## شراء الحيوانات
- المصادر الموصى بها
- معايير الاختيار
- الفحوصات الصحية المطلوبة
- اعتبارات النقل

## برنامج التغذية
| المرحلة | نوع العلف | الكمية اليومية | التكلفة/يوم |
|---------|----------|----------------|-------------|
(جدول تغذية كامل)

## إدارة الصحة
- جدول التطعيمات
- الأمراض الشائعة والوقاية
- متطلبات الرعاية البيطرية

## جدول الإنتاج
| الشهر | الإنتاج المتوقع | القيمة السوقية |
|-------|-----------------|----------------|

## التحليل المالي
### تكاليف الاستثمار
### تكاليف التشغيل (شهرياً)
### الإيرادات المتوقعة
### تحليل الربحية

## التوصيات`
      },
      mixed: {
        en: `You are an expert integrated farming consultant. Create a detailed MIXED FARMING PLAN based on: "${userInput}"

Include sections for both crop and animal integration, synergies, and combined financial analysis.`,
        ar: `أنت مستشار زراعة متكاملة خبير. أنشئ خطة زراعة مختلطة مفصلة بناءً على: "${userInput}"

قم بتضمين أقسام لتكامل المحاصيل والحيوانات، والتآزر، والتحليل المالي المشترك.`
      }
    }

    const promptTemplate = prompts[type] || prompts.farming
    return lang === 'ar' ? promptTemplate.ar : promptTemplate.en
  }

  return (
    <div className="space-y-6">
      {/* Plan Type Header */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border">
        <div className="text-4xl">{config.icon}</div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? config.descriptionAr : config.description}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto">
          {planType.toUpperCase()}
        </Badge>
      </div>

      {/* Step 1: Input - Describe what you want */}
      {step === 'input' && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{language === 'ar' ? 'إنشاء خطة بالذكاء الاصطناعي' : 'AI Plan Generator'}</CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? 'صف ما تريده وسيقوم الذكاء الاصطناعي بإنشاء خطة كاملة لك'
                    : 'Describe what you need and AI will generate a complete plan for you'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">
                {language === 'ar' ? 'صف مشروعك أو احتياجاتك:' : 'Describe your project or needs:'}
              </Label>
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={getPlanPlaceholder()}
                className="min-h-[150px] text-base"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              {language === 'ar' 
                ? 'كلما كان الوصف أكثر تفصيلاً، كانت الخطة أفضل'
                : 'The more detailed your description, the better the plan'}
            </div>
            
            <Button 
              onClick={handleGeneratePlan} 
              disabled={isGenerating || !userPrompt.trim()}
              size="lg"
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {language === 'ar' ? 'جاري إنشاء الخطة... (قد يستغرق 30-60 ثانية)' : 'Generating plan... (may take 30-60 seconds)'}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {language === 'ar' ? 'إنشاء الخطة' : 'Generate Plan'}
                </>
              )}
            </Button>
            
            {isGenerating && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {generationProgress < 30 
                      ? (language === 'ar' ? '🔍 تحليل المتطلبات...' : '🔍 Analyzing requirements...')
                      : generationProgress < 60 
                      ? (language === 'ar' ? '📝 إنشاء الهيكل...' : '📝 Creating structure...')
                      : generationProgress < 90 
                      ? (language === 'ar' ? '✍️ كتابة التفاصيل...' : '✍️ Writing details...')
                      : (language === 'ar' ? '✅ مراجعة نهائية...' : '✅ Final review...')
                    }
                  </span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review - View and discuss the plan */}
      {step === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Plan Display */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>{title}</CardTitle>
                    {isStreaming && (
                      <Badge variant="secondary" className="animate-pulse">
                        {language === 'ar' ? 'يكتب...' : 'Typing...'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isStreaming && (
                      <Button variant="ghost" size="sm" onClick={handleSkipStreaming}>
                        {language === 'ar' ? 'تخطي' : 'Skip'}
                      </Button>
                    )}
                    <Button 
                      variant={viewMode === 'rendered' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setViewMode(viewMode === 'rendered' ? 'raw' : 'rendered')}
                    >
                      {viewMode === 'rendered' ? (language === 'ar' ? 'تحرير' : 'Edit') : (language === 'ar' ? 'عرض' : 'Preview')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRegenerate}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'إعادة' : 'Regenerate'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'rendered' ? (
                  <div 
                    className="min-h-[500px] p-4 rounded-lg border bg-card overflow-auto"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <MarkdownRenderer 
                      content={displayedPlan || generatedPlan} 
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                    {isStreaming && (
                      <span className="inline-block w-2 h-5 bg-primary animate-pulse" />
                    )}
                  </div>
                ) : (
                  <Textarea
                    value={generatedPlan}
                    onChange={(e) => {
                      setGeneratedPlan(e.target.value)
                      setDisplayedPlan(e.target.value)
                    }}
                    className="min-h-[500px] text-base leading-relaxed font-mono"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                )}
              </CardContent>
            </Card>
            
            {/* Approve Button */}
            <Card className="border-2 border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {language === 'ar' ? 'هل أنت راضٍ عن الخطة؟' : 'Are you satisfied with the plan?'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' 
                        ? 'عند الموافقة، ستُحفظ الخطة في لوحة التحكم الخاصة بك'
                        : 'When approved, the plan will be saved to your dashboard'}
                    </p>
                  </div>
                  <Button 
                    onClick={handleApprove} 
                    disabled={isApproving || isStreaming}
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="h-5 w-5" />
                        {language === 'ar' ? 'موافقة وحفظ' : 'Approve & Save'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Discussion Sidebar */}
          <div className="space-y-4">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'مناقشة وتعديل' : 'Discuss & Modify'}
                  </CardTitle>
                </div>
                <CardDescription>
                  {language === 'ar' 
                    ? 'اطلب تعديلات أو اسأل عن أي جزء في الخطة'
                    : 'Request changes or ask about any part of the plan'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chat History */}
                <div className="max-h-[300px] overflow-y-auto space-y-3">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      {language === 'ar' 
                        ? 'اكتب طلبك لتعديل الخطة أو طرح سؤال'
                        : 'Write your request to modify the plan or ask a question'}
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-4"
                          : "bg-muted mr-4"
                      )}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isDiscussing && (
                    <div className="p-3 rounded-lg bg-muted mr-4 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={discussionInput}
                    onChange={(e) => setDiscussionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleDiscuss()
                      }
                    }}
                    placeholder={language === 'ar' ? 'اكتب طلبك...' : 'Type your request...'}
                    disabled={isDiscussing}
                  />
                  <Button 
                    onClick={handleDiscuss} 
                    disabled={isDiscussing || !discussionInput.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    {language === 'ar' ? 'اقتراحات سريعة:' : 'Quick suggestions:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(language === 'ar' ? [
                      'أضف المزيد من التفاصيل',
                      'اختصر الخطة',
                      'أضف جدول زمني',
                      'أضف تقدير التكاليف'
                    ] : [
                      'Add more details',
                      'Make it shorter',
                      'Add timeline',
                      'Add cost estimate'
                    ]).map((suggestion, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setDiscussionInput(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Approved - Success message */}
      {step === 'approved' && (
        <Card className="border-2 border-green-500 bg-green-500/10">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-green-700">
                {language === 'ar' ? 'تم حفظ الخطة بنجاح!' : 'Plan Saved Successfully!'}
              </h2>
              <p className="text-muted-foreground">
                {language === 'ar' 
                  ? 'جاري تحويلك إلى لوحة التحكم...'
                  : 'Redirecting to dashboard...'}
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

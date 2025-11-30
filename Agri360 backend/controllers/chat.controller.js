/**
 * Agri360 - Chat Controller
 * Handles conversational AI interactions
 */

import aiService from "../services/aiService.js";
import ChatMessage from "../models/ChatMessage.js";
import Farm from "../models/Farm.js";
import { t } from "../utils/translator.js";

/**
 * Extract farm details from user message
 */
function extractFarmDetails(message) {
  const details = {};

  // Extract area (feddans or acres)
  const areaMatch = message.match(
    /(\d+(?:\.\d+)?)\s*(?:فدان|feddan|فدانات|acre|acres|هكتار|hectare)/i
  );
  if (areaMatch) {
    details.area = parseFloat(areaMatch[1]);
  }

  // Alternative: just numbers followed by common patterns
  if (!details.area) {
    const numMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:acre|فدان)/i);
    if (numMatch) {
      details.area = parseFloat(numMatch[1]);
    }
  }

  // Extract Egyptian governorates (Arabic and English)
  const governorates = {
    "كفر الشيخ": "Kafr El Sheikh",
    "kafr el sheikh": "Kafr El Sheikh",
    "kafer al shake": "Kafr El Sheikh",
    الدقهلية: "Dakahlia",
    dakahlia: "Dakahlia",
    mansoura: "Dakahlia",
    الشرقية: "Sharkia",
    sharkia: "Sharkia",
    zagazig: "Sharkia",
    الغربية: "Gharbia",
    gharbia: "Gharbia",
    tanta: "Gharbia",
    المنوفية: "Menoufia",
    menoufia: "Menoufia",
    shebin: "Menoufia",
    البحيرة: "Beheira",
    beheira: "Beheira",
    damanhur: "Beheira",
    الإسكندرية: "Alexandria",
    alexandria: "Alexandria",
    alex: "Alexandria",
    القاهرة: "Cairo",
    cairo: "Cairo",
    الجيزة: "Giza",
    giza: "Giza",
    الفيوم: "Fayoum",
    fayoum: "Fayoum",
    faiyum: "Fayoum",
    "بني سويف": "Beni Suef",
    "beni suef": "Beni Suef",
    المنيا: "Minya",
    minya: "Minya",
    أسيوط: "Asyut",
    asyut: "Asyut",
    assiut: "Asyut",
    سوهاج: "Sohag",
    sohag: "Sohag",
    قنا: "Qena",
    qena: "Qena",
    الأقصر: "Luxor",
    luxor: "Luxor",
    أسوان: "Aswan",
    aswan: "Aswan",
    "البحر الأحمر": "Red Sea",
    "red sea": "Red Sea",
    "الوادي الجديد": "New Valley",
    "new valley": "New Valley",
    مطروح: "Matrouh",
    matrouh: "Matrouh",
    "شمال سيناء": "North Sinai",
    "north sinai": "North Sinai",
    "جنوب سيناء": "South Sinai",
    "south sinai": "South Sinai",
    السويس: "Suez",
    suez: "Suez",
    الإسماعيلية: "Ismailia",
    ismailia: "Ismailia",
    بورسعيد: "Port Said",
    "port said": "Port Said",
    دمياط: "Damietta",
    damietta: "Damietta",
  };

  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(governorates)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      details.governorate = value;
      break;
    }
  }

  // Extract crops
  const crops = {
    قمح: "Wheat",
    wheat: "Wheat",
    أرز: "Rice",
    rice: "Rice",
    ذرة: "Corn",
    corn: "Corn",
    maize: "Corn",
    قطن: "Cotton",
    cotton: "Cotton",
    برسيم: "Clover",
    clover: "Clover",
    berseem: "Clover",
    بطاطس: "Potato",
    potato: "Potato",
    potatoes: "Potato",
    طماطم: "Tomato",
    tomato: "Tomato",
    tomatoes: "Tomato",
    بصل: "Onion",
    onion: "Onion",
    onions: "Onion",
    ثوم: "Garlic",
    garlic: "Garlic",
    فول: "Fava Beans",
    fava: "Fava Beans",
    beans: "Fava Beans",
    عدس: "Lentils",
    lentils: "Lentils",
    فلفل: "Pepper",
    pepper: "Pepper",
    باذنجان: "Eggplant",
    eggplant: "Eggplant",
    خيار: "Cucumber",
    cucumber: "Cucumber",
    كوسة: "Zucchini",
    zucchini: "Zucchini",
    بطيخ: "Watermelon",
    watermelon: "Watermelon",
    شمام: "Cantaloupe",
    cantaloupe: "Cantaloupe",
    عنب: "Grapes",
    grapes: "Grapes",
    مانجو: "Mango",
    mango: "Mango",
    موز: "Banana",
    banana: "Banana",
    برتقال: "Orange",
    orange: "Orange",
    citrus: "Citrus",
    زيتون: "Olive",
    olive: "Olive",
    نخيل: "Date Palm",
    dates: "Date Palm",
    palm: "Date Palm",
  };

  for (const [key, value] of Object.entries(crops)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      details.crop = value;
      break;
    }
  }

  return details;
}

/**
 * Get recommended crops based on Egyptian governorate and season
 */
function getRecommendedCrops(governorate) {
  const currentMonth = new Date().getMonth() + 1;
  const isWinterSeason = currentMonth >= 10 || currentMonth <= 3;

  const deltaGovernorates = [
    "Kafr El Sheikh",
    "Dakahlia",
    "Sharkia",
    "Gharbia",
    "Menoufia",
    "Beheira",
    "Damietta",
  ];
  const upperEgypt = ["Minya", "Asyut", "Sohag", "Qena", "Luxor", "Aswan"];

  if (deltaGovernorates.includes(governorate)) {
    return isWinterSeason
      ? { primary: "Wheat", secondary: "Clover", tertiary: "Fava Beans" }
      : { primary: "Rice", secondary: "Cotton", tertiary: "Corn" };
  } else if (upperEgypt.includes(governorate)) {
    return isWinterSeason
      ? { primary: "Wheat", secondary: "Sugarcane", tertiary: "Fava Beans" }
      : { primary: "Corn", secondary: "Sugarcane", tertiary: "Vegetables" };
  } else {
    return isWinterSeason
      ? { primary: "Wheat", secondary: "Vegetables", tertiary: "Clover" }
      : { primary: "Corn", secondary: "Vegetables", tertiary: "Fruits" };
  }
}

/**
 * Generate detailed fallback farming plan in English
 */
function generateFallbackPlanEnglish(userMessage, topic) {
  const details = extractFarmDetails(userMessage);
  const area = details.area || 2;
  const location = details.governorate || "Nile Delta";
  const crops = getRecommendedCrops(location);
  const recommendedCrop = details.crop || crops.primary;

  const currentMonth = new Date().toLocaleString("en", { month: "long" });
  const currentYear = new Date().getFullYear();

  return `# 🌾 Comprehensive Farming Plan for ${location}

## 📍 Farm Overview
- **Location:** ${location}, Egypt
- **Total Area:** ${area} feddan(s)
- **Primary Crop:** ${recommendedCrop}
- **Alternative Crops:** ${crops.secondary}, ${crops.tertiary}
- **Plan Generated:** ${currentMonth} ${currentYear}

---

## 🎯 Goals & Objectives

### Primary Goals
1. Maximize yield per feddan using modern techniques
2. Optimize water usage with efficient irrigation
3. Achieve profitable returns in the first season

### Success Metrics
| Metric | Target |
|--------|--------|
| Yield | 18-20 ardeb/feddan (wheat) |
| Water Efficiency | 20% savings with drip irrigation |
| Net Profit Margin | 25-30% |

---

## 📊 Financial Projections

### Startup Costs (First Season)
| Item | Cost (EGP) |
|------|------------|
| Land Preparation | ${(area * 2500).toLocaleString()} |
| Seeds/Seedlings | ${(area * 3000).toLocaleString()} |
| Fertilizers | ${(area * 4000).toLocaleString()} |
| Irrigation System | ${(area * 8000).toLocaleString()} |
| Labor (Season) | ${(area * 5000).toLocaleString()} |
| Pesticides/Herbicides | ${(area * 2000).toLocaleString()} |
| **Total Investment** | **${(area * 24500).toLocaleString()} EGP** |

### Revenue Projections
- Expected Yield: 18-20 ardeb/feddan
- Market Price: 1,500 EGP/ardeb
- **Gross Revenue:** ${(area * 35000).toLocaleString()} - ${(
    area * 45000
  ).toLocaleString()} EGP
- **Net Profit:** ${(area * 10000).toLocaleString()} - ${(
    area * 20000
  ).toLocaleString()} EGP

---

## 📅 Implementation Timeline

### Phase 1: Preparation (Weeks 1-2)
- [ ] Soil testing and analysis
- [ ] Land clearing and plowing
- [ ] Irrigation system installation
- [ ] Purchase seeds and fertilizers

### Phase 2: Planting (Weeks 3-4)
- [ ] Final soil preparation
- [ ] Apply base fertilizer
- [ ] Sow seeds/transplant seedlings
- [ ] Initial irrigation

### Phase 3: Growth Management (Weeks 5-16)
- [ ] Regular irrigation schedule
- [ ] Pest and disease monitoring
- [ ] Supplementary fertilization
- [ ] Weed management

### Phase 4: Harvest (Weeks 17-20)
- [ ] Assess harvest timing
- [ ] Harvest operations
- [ ] Post-harvest handling
- [ ] Marketing and sales

---

## 💧 Water Management

### Irrigation Requirements
- **Total Water Needed:** 2,500 - 3,000 m³/feddan/season
- **Recommended System:** Drip irrigation (saves 30-40% water)
- **Schedule:** Every 7-10 days (adjust based on weather)

### Water Sources in ${location}
- Canal irrigation from Nile distributaries
- Groundwater wells (if available)
- Consider water storage tanks for dry periods

---

## 🌱 Crop-Specific Recommendations for ${recommendedCrop}

### Planting Guidelines
- **Best Planting Time:** November-December (winter crops)
- **Seed Rate:** 50-60 kg/feddan
- **Row Spacing:** 20 cm between rows
- **Soil Type:** Well-drained loamy soil preferred

### Fertilizer Schedule
| Stage | Type | Amount per Feddan |
|-------|------|-------------------|
| Base | NPK 15-15-15 | 100 kg |
| First Top | Urea 46% | 50 kg (30 days) |
| Second Top | Urea 46% | 50 kg (60 days) |

---

## ⚠️ Risk Management

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Water shortage | Medium | Install water storage, drip irrigation |
| Pest outbreak | Medium | Regular monitoring, IPM practices |
| Price fluctuation | High | Contract farming, diversification |
| Weather extremes | Low | Crop insurance, weather monitoring |

---

## 📞 Local Resources

### Agricultural Extension Services
- Contact your local Agricultural Directorate in ${location}
- Egyptian Agricultural Bank for loans
- Agricultural Cooperatives for bulk purchasing

### Recommended Suppliers
- Local seed distributors
- Fertilizer cooperatives
- Irrigation equipment dealers

---

**💡 Pro Tips for ${location}:**
1. Join local farmer cooperatives for better input prices
2. Consider crop rotation to maintain soil health
3. Use weather apps for irrigation scheduling
4. Keep detailed records for tax and loan purposes

---
*This plan is generated based on your location and farm size. For personalized AI-powered recommendations, please try again when our AI service is available.*`;
}

/**
 * Generate detailed fallback farming plan in Arabic
 */
function generateFallbackPlanArabic(userMessage, topic) {
  const details = extractFarmDetails(userMessage);
  const area = details.area || 2;
  const location = details.governorate || "Nile Delta";

  // Arabic location names
  const arabicLocations = {
    "Kafr El Sheikh": "كفر الشيخ",
    Dakahlia: "الدقهلية",
    Sharkia: "الشرقية",
    Gharbia: "الغربية",
    Menoufia: "المنوفية",
    Beheira: "البحيرة",
    Alexandria: "الإسكندرية",
    Cairo: "القاهرة",
    Giza: "الجيزة",
    Fayoum: "الفيوم",
    "Beni Suef": "بني سويف",
    Minya: "المنيا",
    Asyut: "أسيوط",
    Sohag: "سوهاج",
    Qena: "قنا",
    Luxor: "الأقصر",
    Aswan: "أسوان",
    "Nile Delta": "دلتا النيل",
  };

  const locationAr = arabicLocations[location] || location;
  const crops = getRecommendedCrops(location);

  // Arabic crop names
  const cropNamesAr = {
    Wheat: "القمح",
    Rice: "الأرز",
    Corn: "الذرة",
    Cotton: "القطن",
    Clover: "البرسيم",
    Potato: "البطاطس",
    Tomato: "الطماطم",
    "Fava Beans": "الفول",
    Sugarcane: "قصب السكر",
    Vegetables: "الخضروات",
    Fruits: "الفواكه",
    Onion: "البصل",
    Garlic: "الثوم",
  };

  const recommendedCrop = details.crop || crops.primary;
  const cropNameAr = cropNamesAr[recommendedCrop] || "القمح";
  const crop2Ar = cropNamesAr[crops.secondary] || crops.secondary;
  const crop3Ar = cropNamesAr[crops.tertiary] || crops.tertiary;

  const currentMonth = new Date().toLocaleString("ar-EG", { month: "long" });
  const currentYear = new Date().getFullYear();

  return `# 🌾 خطة زراعية شاملة لـ ${locationAr}

## 📍 نظرة عامة على المزرعة
- **الموقع:** ${locationAr}، مصر
- **المساحة الكلية:** ${area} فدان
- **المحصول الرئيسي:** ${cropNameAr}
- **المحاصيل البديلة:** ${crop2Ar}، ${crop3Ar}
- **تاريخ إعداد الخطة:** ${currentMonth} ${currentYear}

---

## 🎯 الأهداف والغايات

### الأهداف الرئيسية
1. تحقيق أقصى إنتاجية للفدان باستخدام التقنيات الحديثة
2. ترشيد استهلاك المياه بأنظمة الري الفعالة
3. تحقيق عائد مربح خلال الموسم الأول

### مقاييس النجاح
| المقياس | الهدف |
|---------|-------|
| الإنتاجية | 18-20 أردب/فدان (قمح) |
| كفاءة المياه | توفير 20% باستخدام الري بالتنقيط |
| هامش الربح الصافي | 25-30% |

---

## 📊 التوقعات المالية

### تكاليف البدء (الموسم الأول)
| البند | التكلفة (جنيه مصري) |
|-------|---------------------|
| تجهيز الأرض | ${(area * 2500).toLocaleString("ar-EG")} |
| البذور/الشتلات | ${(area * 3000).toLocaleString("ar-EG")} |
| الأسمدة | ${(area * 4000).toLocaleString("ar-EG")} |
| نظام الري | ${(area * 8000).toLocaleString("ar-EG")} |
| العمالة (الموسم) | ${(area * 5000).toLocaleString("ar-EG")} |
| المبيدات | ${(area * 2000).toLocaleString("ar-EG")} |
| **إجمالي الاستثمار** | **${(area * 24500).toLocaleString("ar-EG")} جنيه** |

### توقعات الإيرادات
- الإنتاج المتوقع: 18-20 أردب/فدان
- سعر السوق: 1,500 جنيه/أردب
- **الإيرادات الإجمالية المتوقعة:** ${(area * 35000).toLocaleString(
    "ar-EG"
  )} - ${(area * 45000).toLocaleString("ar-EG")} جنيه
- **صافي الربح المتوقع:** ${(area * 10000).toLocaleString("ar-EG")} - ${(
    area * 20000
  ).toLocaleString("ar-EG")} جنيه

---

## 📅 الجدول الزمني للتنفيذ

### المرحلة الأولى: التحضير (الأسابيع 1-2)
- [ ] تحليل التربة
- [ ] تنظيف الأرض والحرث
- [ ] تركيب نظام الري
- [ ] شراء البذور والأسمدة

### المرحلة الثانية: الزراعة (الأسابيع 3-4)
- [ ] التحضير النهائي للتربة
- [ ] إضافة السماد الأساسي
- [ ] بذر البذور/الشتل
- [ ] الري الأولي

### المرحلة الثالثة: إدارة النمو (الأسابيع 5-16)
- [ ] جدول الري المنتظم
- [ ] مراقبة الآفات والأمراض
- [ ] التسميد التكميلي
- [ ] مكافحة الحشائش

### المرحلة الرابعة: الحصاد (الأسابيع 17-20)
- [ ] تقييم موعد الحصاد
- [ ] عمليات الحصاد
- [ ] معاملات ما بعد الحصاد
- [ ] التسويق والبيع

---

## 💧 إدارة المياه

### متطلبات الري
- **إجمالي المياه المطلوبة:** 2,500 - 3,000 متر مكعب/فدان/موسم
- **النظام الموصى به:** الري بالتنقيط (يوفر 30-40% من المياه)
- **الجدول:** كل 7-10 أيام (يُعدل حسب الطقس)

### مصادر المياه في ${locationAr}
- الري من ترع النيل
- الآبار الجوفية (إن وجدت)
- خزانات لتخزين المياه للفترات الجافة

---

## 🌱 توصيات خاصة بـ ${cropNameAr}

### إرشادات الزراعة
- **أفضل وقت للزراعة:** نوفمبر-ديسمبر (المحاصيل الشتوية)
- **معدل البذور:** 50-60 كجم/فدان
- **المسافة بين الصفوف:** 20 سم
- **نوع التربة:** التربة الطينية جيدة الصرف

### جدول التسميد
| المرحلة | النوع | الكمية للفدان |
|---------|-------|---------------|
| أساسي | NPK 15-15-15 | 100 كجم |
| تكميلي أول | يوريا 46% | 50 كجم (30 يوم) |
| تكميلي ثاني | يوريا 46% | 50 كجم (60 يوم) |

---

## ⚠️ إدارة المخاطر

| الخطر | الاحتمالية | التخفيف |
|-------|-----------|---------|
| نقص المياه | متوسط | تخزين المياه، الري بالتنقيط |
| انتشار الآفات | متوسط | المراقبة المنتظمة، المكافحة المتكاملة |
| تقلب الأسعار | مرتفع | الزراعة التعاقدية، التنويع |
| الظروف الجوية | منخفض | التأمين الزراعي |

---

## 📞 الموارد المحلية

### خدمات الإرشاد الزراعي
- مديرية الزراعة في ${locationAr}
- البنك الزراعي المصري للقروض
- الجمعيات التعاونية الزراعية

### الموردون المحليون
- موزعو البذور المحليون
- تعاونيات الأسمدة
- تجار معدات الري

---

**💡 نصائح لـ ${locationAr}:**
1. انضم للجمعيات التعاونية للحصول على أسعار أفضل للمدخلات
2. طبق الدورة الزراعية للحفاظ على صحة التربة
3. استخدم تطبيقات الطقس لجدولة الري
4. احتفظ بسجلات مفصلة للضرائب والقروض

---
*هذه الخطة مُعدة بناءً على موقعك ومساحة مزرعتك. للحصول على توصيات مخصصة بالذكاء الاصطناعي، يرجى المحاولة مرة أخرى عندما تكون خدمة الذكاء الاصطناعي متاحة.*`;
}

/**
 * Simple chat endpoint
 */
export const chat = async (req, res) => {
  try {
    const { message, mode, topic } = req.body;
    const lang = req.lang || req.body.lang || "en";
    const userId = req.user?.id || req.user?._id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Check if this is a plan request (needs more time)
    const isPlanRequest =
      message.toLowerCase().includes("plan") ||
      message.includes("خطة") ||
      topic === "business" ||
      topic === "farming" ||
      topic === "market";

    // Use longer timeout for plan requests (120s), shorter for simple chat (60s)
    const timeoutMs = isPlanRequest ? 120000 : 60000;

    let reply;

    try {
      console.log(
        `Processing ${isPlanRequest ? "plan" : "chat"} request with ${
          timeoutMs / 1000
        }s timeout...`
      );

      // Try to get reply from AI with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI service timeout")), timeoutMs)
      );

      // Use topic as mode for the AI service (topic=farming should trigger plan generation)
      const aiMode = mode || topic || "chat";

      reply = await Promise.race([
        aiService.chat(message, aiMode, lang),
        timeoutPromise,
      ]);
    } catch (aiErr) {
      console.error("AI Service Error:", aiErr.message);

      // Provide a helpful fallback response
      if (isPlanRequest) {
        console.log("Generating fallback plan for:", message, "lang:", lang);
        reply =
          lang === "ar"
            ? generateFallbackPlanArabic(message, topic)
            : generateFallbackPlanEnglish(message, topic);
      } else {
        reply =
          lang === "ar"
            ? "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً."
            : "Sorry, AI service is temporarily unavailable. Please try again later.";
      }
    }

    // Optionally save to database for history
    if (userId) {
      await ChatMessage.create([
        { user: userId, role: "user", content: message },
        { user: userId, role: "assistant", content: reply },
      ]);
    }

    res.json({ reply, message: "Chat response received" });
  } catch (err) {
    console.error("Chat Error:", err.message || err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

/**
 * Advanced chat with farm context
 */
export const chatWithContext = async (req, res) => {
  try {
    const { message, mode, farmId, conversationId } = req.body;
    const lang = req.lang || req.body.lang || "en";
    const userId = req.user?.id || req.user?._id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get farm context if provided
    let farmContext = null;
    if (farmId) {
      farmContext = await Farm.findById(farmId).lean();
    } else if (req.user?.farm) {
      farmContext = await Farm.findById(req.user.farm).lean();
    }

    // Get conversation history
    let conversationHistory = [];
    if (conversationId) {
      const history = await ChatMessage.find({
        conversationId,
        user: userId,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      conversationHistory = history.reverse().map((m) => ({
        role: m.role,
        content: m.content,
      }));
    }

    // Check if this is a plan request
    const isPlanRequest =
      message.toLowerCase().includes("plan") ||
      message.includes("خطة") ||
      mode === "planning";

    // Use longer timeout for plan requests (120s), shorter for simple chat (60s)
    const timeoutMs = isPlanRequest ? 120000 : 60000;

    let response;

    try {
      console.log(
        `Processing contextual ${
          isPlanRequest ? "plan" : "chat"
        } request with ${timeoutMs / 1000}s timeout...`
      );

      // Call AI with context and timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI service timeout")), timeoutMs)
      );

      response = await Promise.race([
        aiService.chatWithContext(
          {
            message,
            mode: mode || "chat",
            farmContext,
            conversationHistory,
          },
          lang
        ),
        timeoutPromise,
      ]);
    } catch (aiErr) {
      console.error("AI Service Error in chatWithContext:", aiErr.message);

      // Generate fallback response
      const fallbackReply = isPlanRequest
        ? lang === "ar"
          ? generateFallbackPlanArabic(message, mode)
          : generateFallbackPlanEnglish(message, mode)
        : lang === "ar"
        ? "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً."
        : "Sorry, AI service is temporarily unavailable. Please try again later.";

      response = {
        reply: fallbackReply,
        suggestedActions: [],
      };
    }

    // Generate conversation ID if needed
    const newConversationId = conversationId || `conv_${Date.now()}_${userId}`;

    // Save messages
    if (userId) {
      await ChatMessage.create([
        {
          user: userId,
          role: "user",
          content: message,
          conversationId: newConversationId,
        },
        {
          user: userId,
          role: "assistant",
          content: response.reply,
          conversationId: newConversationId,
          metadata: {
            suggestedActions: response.suggestedActions,
          },
        },
      ]);
    }

    res.json({
      reply: response.reply,
      replyArabic: response.replyArabic,
      suggestedActions: response.suggestedActions,
      conversationId: newConversationId,
      message: "Chat response received",
    });
  } catch (err) {
    console.error("Chat with context error:", err.message || err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

/**
 * Get chat history for a user
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { conversationId, limit = 50 } = req.query;

    const filter = { user: userId };
    if (conversationId) {
      filter.conversationId = conversationId;
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      messages: messages.reverse(),
      count: messages.length,
    });
  } catch (err) {
    console.error("Get chat history error:", err.message || err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

/**
 * Get list of conversations
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    // Get unique conversation IDs with latest message
    const conversations = await ChatMessage.aggregate([
      { $match: { user: userId, conversationId: { $exists: true } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$content" },
          lastDate: { $first: "$createdAt" },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastDate: -1 } },
      { $limit: 20 },
    ]);

    res.json({ conversations });
  } catch (err) {
    console.error("Get conversations error:", err.message || err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { conversationId } = req.params;

    await ChatMessage.deleteMany({
      user: userId,
      conversationId,
    });

    res.json({ message: "Conversation deleted" });
  } catch (err) {
    console.error("Delete conversation error:", err.message || err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export default {
  chat,
  chatWithContext,
  getChatHistory,
  getConversations,
  deleteConversation,
};

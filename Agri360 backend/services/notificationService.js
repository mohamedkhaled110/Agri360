import Notification from "../models/Notification.js";
import User from "../models/User.js";
import HarvestPlan from "../models/HarvestPlan.js";
import BusinessPlan from "../models/BusinessPlan.js";
import Farm from "../models/Farm.js";
import weatherService from "./weatherService.js";
import priceService from "./priceService.js";

/**
 * Notification Service
 * Handles creating smart notifications based on plans, weather, market, etc.
 */

// ========== CREATE NOTIFICATIONS ==========

export const createNotification = async ({
  userId,
  type,
  title,
  titleArabic,
  message,
  messageArabic,
  priority = "medium",
  data = {},
  linkedPlan = null,
  actionRequired = false,
  expiresAt = null,
}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      titleArabic,
      message,
      messageArabic,
      priority,
      data,
      linkedPlan,
      actionRequired,
      expiresAt,
    });

    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
};

// ========== PLAN NOTIFICATIONS ==========

export const checkPlanReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find harvest plans with upcoming tasks or harvest dates
    const harvestPlans = await HarvestPlan.find({
      status: "active",
      $or: [
        { harvestDate: { $gte: now, $lte: nextWeek } },
        { plantingDate: { $gte: now, $lte: tomorrow } },
      ],
    }).populate("user farm");

    for (const plan of harvestPlans) {
      const userId = plan.user?._id || plan.farm?.owner;
      if (!userId) continue;

      // Check if harvest is coming up
      if (plan.harvestDate && plan.harvestDate <= nextWeek) {
        const daysUntil = Math.ceil(
          (plan.harvestDate - now) / (1000 * 60 * 60 * 24)
        );

        await createNotification({
          userId,
          type: "harvest_reminder",
          title: `Harvest in ${daysUntil} days`,
          titleArabic: `الحصاد بعد ${daysUntil} أيام`,
          message: `Your ${plan.crop} is ready for harvest in ${daysUntil} days. Prepare equipment and labor.`,
          messageArabic: `محصول ${plan.crop} جاهز للحصاد بعد ${daysUntil} أيام. جهّز المعدات والعمالة.`,
          priority: daysUntil <= 3 ? "high" : "medium",
          linkedPlan: { planType: "HarvestPlan", planId: plan._id },
          actionRequired: true,
          expiresAt: plan.harvestDate,
        });
      }

      // Check upcoming planting
      if (
        plan.plantingDate &&
        plan.plantingDate <= tomorrow &&
        plan.plantingDate >= now
      ) {
        await createNotification({
          userId,
          type: "plan_reminder",
          title: "Planting Day Tomorrow",
          titleArabic: "موعد الزراعة غداً",
          message: `Tomorrow is the scheduled planting day for ${plan.crop}. Ensure seeds and soil are ready.`,
          messageArabic: `غداً هو موعد زراعة ${plan.crop}. تأكد من جاهزية البذور والتربة.`,
          priority: "high",
          linkedPlan: { planType: "HarvestPlan", planId: plan._id },
          actionRequired: true,
        });
      }
    }

    console.log(`Checked ${harvestPlans.length} plans for reminders`);
  } catch (err) {
    console.error("Error checking plan reminders:", err);
  }
};

// ========== WEATHER NOTIFICATIONS ==========

export const checkWeatherAlerts = async () => {
  try {
    // Get all farms with active plans
    const farms = await Farm.find({
      "location.lat": { $exists: true },
      "location.lon": { $exists: true },
    });

    for (const farm of farms) {
      try {
        const weather = await weatherService.getForecastForFarm(farm);
        if (!weather) continue;

        // Check for weather alerts
        if (weather.alerts && weather.alerts.length > 0) {
          for (const alert of weather.alerts) {
            await createNotification({
              userId: farm.owner,
              type: "weather_alert",
              title: `Weather Alert: ${alert.event || "Warning"}`,
              titleArabic: `تحذير طقس: ${alert.event || "تنبيه"}`,
              message:
                alert.description || "Severe weather conditions expected",
              messageArabic: alert.description || "متوقع ظروف جوية قاسية",
              priority: "urgent",
              data: { alert, farmId: farm._id },
              actionRequired: true,
              expiresAt: alert.expires ? new Date(alert.expires) : null,
            });
          }
        }

        // Check for extreme conditions
        const current = weather.current;
        if (current) {
          // High temperature warning
          if (current.temp > 42) {
            await createNotification({
              userId: farm.owner,
              type: "weather_alert",
              title: "Extreme Heat Warning",
              titleArabic: "تحذير من الحرارة الشديدة",
              message: `Temperature is ${current.temp}°C. Consider additional irrigation and shade for crops.`,
              messageArabic: `درجة الحرارة ${current.temp}°م. يُنصح بزيادة الري وتوفير الظل للمحاصيل.`,
              priority: "high",
              data: { temp: current.temp, farmId: farm._id },
            });
          }

          // Frost warning
          if (current.temp < 5) {
            await createNotification({
              userId: farm.owner,
              type: "weather_alert",
              title: "Frost Warning",
              titleArabic: "تحذير من الصقيع",
              message: `Temperature is ${current.temp}°C. Protect sensitive crops from frost damage.`,
              messageArabic: `درجة الحرارة ${current.temp}°م. احمِ المحاصيل الحساسة من الصقيع.`,
              priority: "high",
              data: { temp: current.temp, farmId: farm._id },
            });
          }

          // High humidity warning (disease risk)
          if (current.humidity > 90) {
            await createNotification({
              userId: farm.owner,
              type: "pest_alert",
              title: "High Humidity - Disease Risk",
              titleArabic: "رطوبة عالية - خطر الأمراض",
              message: `Humidity is ${current.humidity}%. Monitor crops for fungal diseases.`,
              messageArabic: `الرطوبة ${current.humidity}%. راقب المحاصيل للأمراض الفطرية.`,
              priority: "medium",
              data: { humidity: current.humidity, farmId: farm._id },
            });
          }
        }
      } catch (err) {
        console.error(`Error checking weather for farm ${farm._id}:`, err);
      }
    }
  } catch (err) {
    console.error("Error checking weather alerts:", err);
  }
};

// ========== MARKET NOTIFICATIONS ==========

export const checkPriceAlerts = async () => {
  try {
    // Get users with active harvest plans
    const activePlans = await HarvestPlan.find({ status: "active" }).populate(
      "user farm"
    );

    const cropsToCheck = [...new Set(activePlans.map((p) => p.crop))];

    for (const crop of cropsToCheck) {
      try {
        const priceData = await priceService.fetchMahsolyPrices(crop);
        if (!priceData || !priceData.prices) continue;

        // Check for significant price changes
        const priceChange = priceData.priceChange || 0;

        if (Math.abs(priceChange) > 10) {
          // >10% change
          const affectedPlans = activePlans.filter((p) => p.crop === crop);

          for (const plan of affectedPlans) {
            const userId = plan.user?._id || plan.farm?.owner;
            if (!userId) continue;

            await createNotification({
              userId,
              type: "price_alert",
              title:
                priceChange > 0
                  ? `${crop} Price Up ${Math.abs(priceChange).toFixed(1)}%`
                  : `${crop} Price Down ${Math.abs(priceChange).toFixed(1)}%`,
              titleArabic:
                priceChange > 0
                  ? `سعر ${crop} ارتفع ${Math.abs(priceChange).toFixed(1)}%`
                  : `سعر ${crop} انخفض ${Math.abs(priceChange).toFixed(1)}%`,
              message:
                priceChange > 0
                  ? `Market price for ${crop} has increased. Consider selling soon.`
                  : `Market price for ${crop} has decreased. Consider holding if possible.`,
              messageArabic:
                priceChange > 0
                  ? `سعر ${crop} في السوق ارتفع. فكر في البيع قريباً.`
                  : `سعر ${crop} في السوق انخفض. فكر في الانتظار إن أمكن.`,
              priority: Math.abs(priceChange) > 20 ? "high" : "medium",
              linkedPlan: { planType: "HarvestPlan", planId: plan._id },
              data: { crop, priceChange, currentPrice: priceData.prices[0] },
            });
          }
        }
      } catch (err) {
        console.error(`Error checking prices for ${crop}:`, err);
      }
    }
  } catch (err) {
    console.error("Error checking price alerts:", err);
  }
};

// ========== ANIMAL CARE NOTIFICATIONS ==========

export const checkAnimalCareReminders = async () => {
  try {
    const farms = await Farm.find({
      "animals.0": { $exists: true },
    });

    for (const farm of farms) {
      for (const animal of farm.animals) {
        // Check if health check is overdue (more than 30 days)
        if (animal.lastHealthCheck) {
          const daysSinceCheck = Math.floor(
            (new Date() - new Date(animal.lastHealthCheck)) /
              (1000 * 60 * 60 * 24)
          );

          if (daysSinceCheck > 30) {
            await createNotification({
              userId: farm.owner,
              type: "animal_care",
              title: `Health Check Overdue - ${animal.type}`,
              titleArabic: `فحص صحي متأخر - ${
                animal.typeArabic || animal.type
              }`,
              message: `It's been ${daysSinceCheck} days since the last health check for your ${animal.type}. Schedule a veterinary visit.`,
              messageArabic: `مر ${daysSinceCheck} يوماً منذ آخر فحص صحي لـ ${
                animal.typeArabic || animal.type
              }. حدد موعد زيارة بيطرية.`,
              priority: daysSinceCheck > 60 ? "high" : "medium",
              data: {
                animalId: animal._id,
                animalType: animal.type,
                daysSinceCheck,
              },
              actionRequired: true,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error checking animal care reminders:", err);
  }
};

// ========== TASK REMINDERS ==========

export const checkTaskReminders = async () => {
  try {
    // Check harvest plans with tasks
    const plans = await HarvestPlan.find({
      status: "active",
      "tasks.0": { $exists: true },
    }).populate("user farm");

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const plan of plans) {
      const userId = plan.user?._id || plan.farm?.owner;
      if (!userId) continue;

      for (const task of plan.tasks || []) {
        if (task.completed) continue;

        const dueDate = new Date(task.dueDate);
        if (dueDate <= tomorrow && dueDate >= now) {
          await createNotification({
            userId,
            type: "task_due",
            title: `Task Due: ${task.title}`,
            titleArabic: `مهمة مستحقة: ${task.titleArabic || task.title}`,
            message: `Task "${task.title}" for your ${plan.crop} plan is due tomorrow.`,
            messageArabic: `المهمة "${task.titleArabic || task.title}" لخطة ${
              plan.crop
            } مستحقة غداً.`,
            priority: "medium",
            linkedPlan: { planType: "HarvestPlan", planId: plan._id },
            data: { taskId: task._id, taskTitle: task.title },
            actionRequired: true,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error checking task reminders:", err);
  }
};

// ========== RUN ALL CHECKS ==========

export const runAllNotificationChecks = async () => {
  console.log("Running notification checks...");

  await Promise.all([
    checkPlanReminders(),
    checkWeatherAlerts(),
    checkPriceAlerts(),
    checkAnimalCareReminders(),
    checkTaskReminders(),
  ]);

  console.log("Notification checks complete");
};

// ========== CLEANUP OLD NOTIFICATIONS ==========

export const cleanupExpiredNotifications = async () => {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    console.log(`Cleaned up ${result.deletedCount} expired notifications`);
  } catch (err) {
    console.error("Error cleaning up notifications:", err);
  }
};

export default {
  createNotification,
  checkPlanReminders,
  checkWeatherAlerts,
  checkPriceAlerts,
  checkAnimalCareReminders,
  checkTaskReminders,
  runAllNotificationChecks,
  cleanupExpiredNotifications,
};

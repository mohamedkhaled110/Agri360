// Test Arabic + Animals support
import "dotenv/config";
import fs from "fs";
import { chat } from "./ai/agent/index.js";

async function test() {
  try {
    console.log("🧪 Testing Arabic with Animals support...");
    console.log("API Key:", process.env.AI_API_KEY?.substring(0, 10) + "...");

    const result = await chat(
      {
        message: "ما هي أفضل خطة للمزرعة التي تحتوي على قمح وأبقار؟",
        farmContext: {
          name: "مزرعة النيل",
          fieldSizeHectares: 2,
          location: {
            governorate: "كفر الشيخ",
            lat: 31.1,
            lon: 30.9,
          },
          animals: [
            {
              type: "cattle",
              breed: "Friesian",
              count: 10,
              purpose: "dairy",
              healthStatus: "good",
            },
          ],
        },
      },
      "ar"
    );

    console.log("\n✅ SUCCESS!");
    console.log("Response type:", typeof result);

    if (typeof result === "string") {
      console.log("Response length:", result.length, "characters");

      // Write full result to file
      fs.writeFileSync("test-result.txt", result, "utf8");
      console.log("Full result written to test-result.txt");

      console.log("\n--- Preview (first 3000 chars) ---");
      console.log(result.substring(0, 3000));

      // Check for Arabic sections
      const hasArabicSections =
        result.includes("الملخص") ||
        result.includes("التحليل") ||
        result.includes("الخطة");
      console.log("\n✅ Contains Arabic sections:", hasArabicSections);

      // Check for animal sections
      const hasAnimalSection =
        result.includes("🐄") ||
        result.includes("حيوان") ||
        result.includes("أبقار") ||
        result.includes("ماشية");
      console.log("✅ Contains Animal section:", hasAnimalSection);
    } else {
      console.log(
        "Result:",
        JSON.stringify(result, null, 2)?.substring(0, 2000)
      );
    }
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    console.error(err.stack);
  }
}

test();

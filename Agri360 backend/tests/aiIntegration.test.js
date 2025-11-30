import assert from "assert";
import aiService from "../ai/aiService.js";
import * as businessPlanService from "../services/businessPlan.service.js";
import * as harvestPlanService from "../services/harvestPlan.service.js";

// Mock AI client for these tests
const mockAiClient = {
  callDeepSeek: async (prompt) => {
    mockAiClient.lastPrompt = prompt;
    return {
      choices: [{ message: { content: JSON.stringify({ plan: "مخطط" }) } }],
    };
  },
  callQwen: async (prompt) => {
    mockAiClient.lastPrompt = prompt;
    return {
      choices: [{ message: { content: "رد من Qwen" } }],
    };
  },
};

// Test crop planning AI with Arabic
export async function testCropPlanningArabicInstruction() {
  const origSet = aiService.__setAiClient;
  aiService.__setAiClient(mockAiClient);

  try {
    const result = await aiService.planCrops({ crop: "wheat" }, "ar");
    assert.ok(
      mockAiClient.lastPrompt.startsWith("Respond in Arabic."),
      "Crop plan prompt should include Arabic instruction"
    );
  } finally {
    aiService.__setAiClient(aiService.default || aiService);
  }
}

// Test business plan AI with Arabic
export async function testBusinessPlanArabicInstruction() {
  const origSet = aiService.__setAiClient;
  aiService.__setAiClient(mockAiClient);

  try {
    const context = {
      farm: "farm-123",
      crop: "wheat",
      marketData: { mahsoly: [] },
    };
    const result = await aiService.generateBusinessPlan(context, "ar");
    assert.ok(
      mockAiClient.lastPrompt.startsWith("Respond in Arabic."),
      "Business plan prompt should include Arabic instruction"
    );
  } finally {
    aiService.__setAiClient(aiService.default || aiService);
  }
}

// Test chat with planning mode in Arabic
export async function testChatPlanningModeArabic() {
  const origSet = aiService.__setAiClient;
  aiService.__setAiClient(mockAiClient);

  try {
    const result = await aiService.chat("Plan my farm", "plan", "ar");
    assert.ok(
      mockAiClient.lastPrompt.startsWith("Respond in Arabic."),
      "Chat plan mode should include Arabic instruction"
    );
  } finally {
    aiService.__setAiClient(aiService.default || aiService);
  }
}

// Test chat with regular chat mode in Arabic
export async function testChatChatModeArabic() {
  const origSet = aiService.__setAiClient;
  aiService.__setAiClient(mockAiClient);

  try {
    const result = await aiService.chat("What is a tractor?", "chat", "ar");
    assert.ok(
      mockAiClient.lastPrompt.startsWith("Respond in Arabic."),
      "Chat mode should include Arabic instruction"
    );
  } finally {
    aiService.__setAiClient(aiService.default || aiService);
  }
}

// Ensure English still works (default)
export async function testAiEnglishDefault() {
  const origSet = aiService.__setAiClient;
  aiService.__setAiClient(mockAiClient);

  try {
    const result = await aiService.chat("Hello", "chat", "en");
    assert.ok(
      !mockAiClient.lastPrompt.startsWith("Respond in Arabic."),
      "English mode should NOT include Arabic instruction"
    );
  } finally {
    aiService.__setAiClient(aiService.default || aiService);
  }
}

// Test Arabic variant language code (ar-SA, ar-EG, etc.)
export async function testArabicVariantCode() {
  const origSet = aiService.__setAiClient;
  aiService.__setAiClient(mockAiClient);

  try {
    const result = await aiService.chat("Hello", "chat", "ar-SA");
    assert.ok(
      mockAiClient.lastPrompt.startsWith("Respond in Arabic."),
      "Arabic variant (ar-SA) should trigger Arabic instruction"
    );
  } finally {
    aiService.__setAiClient(aiService.default || aiService);
  }
}

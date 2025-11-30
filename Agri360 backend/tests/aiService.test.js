import assert from "assert";
import * as aiService from "../ai/aiService.js";
import * as aiClient from "../ai/aiClient.js";
import fs from "fs";

export async function testChatUsesArabicInstruction() {
  // stub prompt files
  const origRead = fs.readFileSync;
  fs.readFileSync = () => "CHAT_PROMPT_TEMPLATE";

  // inject mock client
  const mockClient = {
    callQwen: async (prompt) => {
      mockClient.captured = prompt;
      return { choices: [{ message: { content: "رد بالعربية" } }] };
    },
  };
  const origClientSetter = aiService.__setAiClient;
  aiService.__setAiClient(mockClient);

  try {
    const resp = await aiService.chat("Hello", "chat", "ar");
    assert.ok(mockClient.captured, "Qwen was called");
    assert.ok(
      mockClient.captured.startsWith("Respond in Arabic."),
      "Prompt begins with Respond in Arabic."
    );
  } finally {
    fs.readFileSync = origRead;
    aiService.__setAiClient(aiClient.default || aiClient);
  }
}

export async function testGenerateBusinessPlanArabicInstruction() {
  const origRead = fs.readFileSync;
  fs.readFileSync = () => "BP_PROMPT";

  let mockClient = {
    callDeepSeek: async (prompt) => {
      mockClient.captured = prompt;
      return { choices: [{ message: { content: "خطة عمل" } }] };
    },
  };
  const origRead2 = fs.readFileSync;
  fs.readFileSync = () => "BP_PROMPT";
  aiService.__setAiClient(mockClient);

  try {
    const resp = await aiService.generateBusinessPlan({ farm: "X" }, "ar");
    assert.ok(mockClient.captured, "DeepSeek was called");
    assert.ok(
      mockClient.captured.startsWith("Respond in Arabic."),
      "BP prompt begins with Respond in Arabic."
    );
  } finally {
    fs.readFileSync = origRead2;
    aiService.__setAiClient(aiClient.default || aiClient);
  }
}

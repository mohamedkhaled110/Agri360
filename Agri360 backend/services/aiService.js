/**
 * Agri360 - AI Service (Legacy Wrapper)
 * Re-exports from the new AI module for backward compatibility
 */

import aiService from "../ai/index.js";

export const generateBusinessPlan = aiService.generateBusinessPlan;
export const chat = aiService.chat;
export const planCrops = aiService.planCrops;
export const chatWithContext = aiService.chatWithContext;

export default aiService;

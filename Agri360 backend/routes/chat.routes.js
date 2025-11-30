import express from "express";
import chatController from "../controllers/chat.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Simple chat
router.post("/", protect, chatController.chat);

// Chat with farm context
router.post("/context", protect, chatController.chatWithContext);

// Get chat history
router.get("/history", protect, chatController.getChatHistory);

// Get list of conversations
router.get("/conversations", protect, chatController.getConversations);

// Delete a conversation
router.delete(
  "/conversations/:conversationId",
  protect,
  chatController.deleteConversation
);

export default router;

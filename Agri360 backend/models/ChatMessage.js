import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Role in conversation (user, assistant, system)
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
      default: "user",
    },

    // Message content
    content: {
      type: String,
      required: true,
    },

    // Conversation grouping
    conversationId: {
      type: String,
      index: true,
    },

    // Optional context references
    planContext: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "contextModel",
    },

    contextModel: {
      type: String,
      enum: ["HarvestPlan", "BusinessPlan", "Farm"],
    },

    // Metadata for assistant messages
    metadata: {
      suggestedActions: [
        {
          action: String,
          description: String,
          endpoint: String,
        },
      ],
      toolsUsed: [String],
      confidence: String,
    },

    // Legacy field mapping
    sender: {
      type: String,
      enum: ["user", "ai"],
    },
    message: String,
  },
  { timestamps: true }
);

// Index for efficient queries
chatMessageSchema.index({ user: 1, createdAt: -1 });
chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

// Pre-save middleware to handle legacy fields
chatMessageSchema.pre("save", function (next) {
  // Map legacy 'sender' to 'role'
  if (this.sender && !this.role) {
    this.role = this.sender === "ai" ? "assistant" : "user";
  }
  // Map legacy 'message' to 'content'
  if (this.message && !this.content) {
    this.content = this.message;
  }
  next();
});

export default mongoose.model("ChatMessage", chatMessageSchema);

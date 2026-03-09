import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  admins: defineTable({
    firebaseUid: v.string(),
    email: v.string(),
    createdAt: v.number(),
  }).index("by_firebaseUid", ["firebaseUid"])
   .index("by_email", ["email"]),

  quizzes: defineTable({
    title: v.string(),
    description: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(), // in minutes
    createdBy: v.string(), // Firebase UID instead of admin ID
    createdAt: v.number(),
    randomizeQuestions: v.optional(v.boolean()),
    randomizeChoices: v.optional(v.boolean()),
    questionsPerParticipant: v.optional(v.number()), // Number of questions to show per participant
  }).index("by_createdBy", ["createdBy"]),

  questions: defineTable({
    quizId: v.id("quizzes"),
    questionText: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
  }).index("by_quizId", ["quizId"]),

  participants: defineTable({
    firebaseUid: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_firebaseUid", ["firebaseUid"]),

  submissions: defineTable({
    quizId: v.id("quizzes"),
    participantId: v.id("participants"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedOption: v.number(),
      })
    ),
    score: v.number(),
    submittedAt: v.number(),
  }).index("by_quizId", ["quizId"])
    .index("by_participantId", ["participantId"])
    .index("by_quiz_participant", ["quizId", "participantId"]),
});

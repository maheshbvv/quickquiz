import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrUpdateAdmin = mutation({
  args: {
    firebaseUid: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    if (existingAdmin) {
      return existingAdmin._id;
    }

    // Create new admin
    const adminId = await ctx.db.insert("admins", {
      firebaseUid: args.firebaseUid,
      email: args.email,
      createdAt: Date.now(),
    });

    return adminId;
  },
});

export const getAdminByFirebaseUid = query({
  args: {
    firebaseUid: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    return admin;
  },
});

export const createQuiz = mutation({
  args: {
    firebaseUid: v.string(),
    title: v.string(),
    description: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    randomizeQuestions: v.optional(v.boolean()),
    randomizeChoices: v.optional(v.boolean()),
    questionsPerParticipant: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get admin by Firebase UID
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    if (!admin) {
      throw new Error("Admin not found");
    }

    const quizId = await ctx.db.insert("quizzes", {
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: args.duration,
      createdBy: args.firebaseUid, // Use Firebase UID instead of admin._id
      createdAt: Date.now(),
      randomizeQuestions: args.randomizeQuestions ?? false,
      randomizeChoices: args.randomizeChoices ?? false,
      questionsPerParticipant: args.questionsPerParticipant,
    });

    return quizId;
  },
});

export const getQuizzes = query({
  args: {
    firebaseUid: v.string(),
  },
  handler: async (ctx, args) => {
    // Get admin by Firebase UID
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    if (!admin) {
      return [];
    }

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", args.firebaseUid))
      .collect();

    return quizzes;
  },
});

export const getQuiz = query({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    return {
      ...quiz,
      questions,
    };
  },
});

export const addQuestion = mutation({
  args: {
    firebaseUid: v.string(),
    quizId: v.id("quizzes"),
    questionText: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
  },
  handler: async (ctx, args) => {
    // Get admin by Firebase UID
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Verify user owns the quiz
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.createdBy !== args.firebaseUid) {
      throw new Error("Not authorized");
    }

    const questionId = await ctx.db.insert("questions", {
      quizId: args.quizId,
      questionText: args.questionText,
      options: args.options,
      correctAnswer: args.correctAnswer,
    });

    return questionId;
  },
});

export const getQuizQuestions = query({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    return questions;
  },
});

export const getQuizResults = query({
  args: {
    firebaseUid: v.optional(v.string()),
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    // Get the quiz to make sure it exists
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    const results = await Promise.all(
      submissions.map(async (submission) => {
        let participant = null;
        try {
          if (submission.participantId) {
            participant = await ctx.db.get(submission.participantId);
          }
        } catch (e) {
          console.error("Failed to fetch participant for submission", submission._id, e);
        }

        // Get the questions this participant actually answered
        const answeredQuestionIds = submission.answers.map(a => a.questionId);
        
        // Determine total questions for this participant
        let totalQuestions = answeredQuestionIds.length;
        
        // If quiz has questionsPerParticipant, use that as the total
        if (quiz.questionsPerParticipant && quiz.questionsPerParticipant > answeredQuestionIds.length) {
          totalQuestions = quiz.questionsPerParticipant;
        } else {
          // Otherwise, get all questions for the quiz
          const allQuestions = await ctx.db
            .query("questions")
            .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
            .collect();
          
          // If participant answered fewer than all questions, use the number they answered
          // Otherwise, use the total questions in the quiz
          totalQuestions = Math.min(answeredQuestionIds.length, allQuestions.length);
        }

        // Calculate correct answers from the submission score
        // submission.score is a decimal (0.0 to 1.0), so correct = score * totalQuestions
        const correctAnswers = Math.round((submission.score || 0) * totalQuestions);

        return {
          name: participant?.name || "Anonymous",
          email: participant?.email || "N/A",
          score: Math.round((submission.score || 0) * 100), // percentage for display
          correct: correctAnswers,
          total: totalQuestions,
          submittedAt: submission.submittedAt || Date.now(),
        };
      })
    );

    return {
      quiz: {
        title: quiz.title,
        description: quiz.description,
      },
      results,
    };
  },
});

export const getActiveQuizzes = query({
  handler: async (ctx) => {
    const now = Date.now();

    const quizzes = await ctx.db
      .query("quizzes")
      .collect();

    return quizzes.filter(quiz =>
      quiz.startTime <= now && quiz.endTime >= now
    );
  },
});

export const updateQuiz = mutation({
  args: {
    firebaseUid: v.string(),
    quizId: v.id("quizzes"),
    title: v.string(),
    description: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    randomizeQuestions: v.optional(v.boolean()),
    randomizeChoices: v.optional(v.boolean()),
    questionsPerParticipant: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify the admin owns this quiz
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.createdBy !== args.firebaseUid) {
      throw new Error("Quiz not found or access denied");
    }

    // Update the quiz
    await ctx.db.patch(args.quizId, {
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: args.duration,
      randomizeQuestions: args.randomizeQuestions ?? false,
      randomizeChoices: args.randomizeChoices ?? false,
      questionsPerParticipant: args.questionsPerParticipant,
    });

    return args.quizId;
  },
});

export const updateQuestion = mutation({
  args: {
    firebaseUid: v.string(),
    questionId: v.id("questions"),
    questionText: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify the admin owns this question
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const quiz = await ctx.db.get(question.quizId);
    if (!quiz || quiz.createdBy !== args.firebaseUid) {
      throw new Error("Access denied");
    }

    // Update the question
    await ctx.db.patch(args.questionId, {
      questionText: args.questionText,
      options: args.options,
      correctAnswer: args.correctAnswer,
    });

    return args.questionId;
  },
});

export const deleteQuestion = mutation({
  args: {
    firebaseUid: v.string(),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    // Verify the admin owns this question
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const quiz = await ctx.db.get(question.quizId);
    if (!quiz || quiz.createdBy !== args.firebaseUid) {
      throw new Error("Access denied");
    }

    // Delete the question
    await ctx.db.delete(args.questionId);

    return args.questionId;
  },
});

export const addQuestionToQuiz = mutation({
  args: {
    firebaseUid: v.string(),
    quizId: v.id("quizzes"),
    questionText: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify the admin owns this quiz
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.createdBy !== args.firebaseUid) {
      throw new Error("Quiz not found or access denied");
    }

    // Add the question
    const questionId = await ctx.db.insert("questions", {
      quizId: args.quizId,
      questionText: args.questionText,
      options: args.options,
      correctAnswer: args.correctAnswer,
    });

    return questionId;
  },
});

export const deleteQuiz = mutation({
  args: {
    firebaseUid: v.string(),
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    // Verify the admin owns this quiz
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.createdBy !== args.firebaseUid) {
      throw new Error("Quiz not found or access denied");
    }

    // Delete all questions for this quiz
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    // Delete all submissions for this quiz
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const submission of submissions) {
      await ctx.db.delete(submission._id);
    }

    // Delete the quiz
    await ctx.db.delete(args.quizId);

    return args.quizId;
  },
});

export const getSubmissionsDebug = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();
    return submissions;
  }
});

export const getAllSubmissionsDebug = query({
  handler: async (ctx) => {
    const submissions = await ctx.db.query("submissions").collect();
    return submissions;
  }
});

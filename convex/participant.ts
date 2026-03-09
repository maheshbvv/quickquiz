import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or fetch a participant without requiring phone number (for Google Auth)
export const createParticipant = mutation({
  args: {
    quizId: v.id("quizzes"),
    firebaseUid: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if participant already exists by Firebase UID
    const existingParticipant = await ctx.db
      .query("participants")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    if (existingParticipant) {
      // Update name or email if they changed
      if (existingParticipant.name !== args.name || existingParticipant.email !== args.email) {
        await ctx.db.patch(existingParticipant._id, {
          name: args.name,
          email: args.email,
        });
      }
      return existingParticipant._id;
    }

    // Create new participant
    const participantId = await ctx.db.insert("participants", {
      firebaseUid: args.firebaseUid,
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
    });

    return participantId;
  },
});

export const getParticipantByFirebaseUid = query({
  args: {
    firebaseUid: v.string(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();

    return participant;
  },
});

export const getQuizByStringId = query({
  args: {
    quizId: v.string(),
  },
  handler: async (ctx, args) => {
    // Try to find quiz by string ID (this might be the Convex ID as string)
    let quiz;
    try {
      // Try to parse as Convex ID
      quiz = await ctx.db.get(args.quizId as any);
    } catch (error) {
      // If that fails, we need to search by some other field
      // For now, let's return null
      return null;
    }

    if (!quiz) {
      throw new Error("Sorry, we couldn't find that quiz. Please try again or contact support.");
    }

    // Ensure this is a quiz object with the right properties
    if (!('startTime' in quiz) || !('endTime' in quiz)) {
      throw new Error("Sorry, there's an issue with this quiz. Please contact support for help.");
    }

    const now = Date.now();
    const canStart = now >= quiz.startTime && now <= quiz.endTime;

    return {
      ...quiz,
      canStart,
      status: now < quiz.startTime ? "upcoming" :
        now > quiz.endTime ? "ended" : "active",
    };
  },
});

export const getQuiz = query({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error("Sorry, we couldn't find that quiz. Please try again or contact support.");
    }

    const now = Date.now();
    const canStart = now >= quiz.startTime && now <= quiz.endTime;

    return {
      ...quiz,
      canStart,
      status: now < quiz.startTime ? "upcoming" :
        now > quiz.endTime ? "ended" : "active",
    };
  },
});

export const startQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error("Sorry, we couldn't find that quiz. Please try again or contact support.");
    }

    const now = Date.now();
    if (now < quiz.startTime || now > quiz.endTime) {
      throw new Error("Sorry, this quiz is not available right now. Please check the schedule and try again.");
    }

    // Check if participant already submitted
    const existingSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_quiz_participant", (q) =>
        q.eq("quizId", args.quizId).eq("participantId", args.participantId)
      )
      .first();

    if (existingSubmission) {
      throw new Error("You've already taken this quiz. If you think this is a mistake, please contact support.");
    }

    // Get questions
    const allQuestions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    // Determine how many questions to show
    const questionsPerParticipant = quiz.questionsPerParticipant;
    let selectedQuestions = allQuestions;

    if (questionsPerParticipant && questionsPerParticipant < allQuestions.length) {
      // Randomly select questionsPerParticipant questions
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      selectedQuestions = shuffled.slice(0, questionsPerParticipant);
    } else if (quiz.randomizeQuestions) {
      // If randomizeQuestions is enabled, shuffle all questions
      selectedQuestions = [...allQuestions].sort(() => 0.5 - Math.random());
    }

    return {
      quiz: {
        title: quiz.title,
        duration: quiz.duration,
      },
      questions: selectedQuestions.map(q => ({
        id: q._id,
        questionText: q.questionText,
        options: q.options,
      })),
      startTime: now,
    };
  },
});

export const getQuizResults = query({
  args: {
    quizId: v.id("quizzes"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    // Get the submission
    const submission = await ctx.db
      .query("submissions")
      .withIndex("by_quiz_participant", (q) =>
        q.eq("quizId", args.quizId).eq("participantId", args.participantId)
      )
      .first();

    if (!submission) {
      return null;
    }

    // Get questions for this quiz
    const allQuestions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    // Get quiz to check if split questions is enabled
    const quiz = await ctx.db.get(args.quizId);
    let questions = allQuestions;

    if (quiz?.questionsPerParticipant && quiz.questionsPerParticipant < allQuestions.length) {
      // For split quizzes, only include questions that were actually answered
      const answeredQuestionIds = submission.answers.map(a => a.questionId);
      questions = allQuestions.filter(q => answeredQuestionIds.includes(q._id));
    }

    // Combine questions with user answers and correct answers
    const questionResults = questions.map(question => {
      const userAnswer = submission.answers.find(
        answer => answer.questionId === question._id
      );

      return {
        questionId: question._id,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userSelectedOption: userAnswer?.selectedOption || null,
        isCorrect: userAnswer?.selectedOption === question.correctAnswer,
      };
    });

    return {
      submission,
      questionResults,
      quizId: args.quizId,
      quiz: quiz ? {
        title: quiz.title,
        description: quiz.description,
      } : null,
    };
  },
});

export const submitQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    participantId: v.id("participants"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedOption: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    console.log("Received quiz submission:", args);

    // Rate limiting: Check if already submitted
    const existingSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_quiz_participant", (q) =>
        q.eq("quizId", args.quizId).eq("participantId", args.participantId)
      )
      .first();

    if (existingSubmission) {
      throw new Error("You've already submitted this quiz. If you think this is a mistake, please contact support.");
    }

    // Rate limiting: Check if participant has submitted too many quizzes recently (last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_participantId", (q) => q.eq("participantId", args.participantId))
      .collect();

    const recentCount = recentSubmissions.filter(
      submission => submission.submittedAt > oneHourAgo
    ).length;

    if (recentCount >= 5) {
      throw new Error("You have reached the quiz attempt limit. Please wait before trying again.");
    }

    // Get all questions to calculate score
    const allQuestions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    // Get quiz to check if split questions is enabled
    const quiz = await ctx.db.get(args.quizId);
    let scoringQuestions = allQuestions;

    if (quiz?.questionsPerParticipant && quiz.questionsPerParticipant < allQuestions.length) {
      // For split quizzes, we need to calculate score based on the questions the participant actually saw
      // Since we don't store which questions were selected, we'll calculate based on all submitted answers
      const answeredQuestionIds = args.answers.map(a => a.questionId);
      scoringQuestions = allQuestions.filter(q => answeredQuestionIds.includes(q._id));
    }

    let correctCount = 0;
    for (const answer of args.answers) {
      const question = scoringQuestions.find(q => q._id === answer.questionId);
      if (question && question.correctAnswer === answer.selectedOption) {
        correctCount++;
      }
    }

    const score = correctCount / scoringQuestions.length;

    await ctx.db.insert("submissions", {
      quizId: args.quizId,
      participantId: args.participantId,
      answers: args.answers,
      score,
      submittedAt: Date.now(),
    });

    return {
      score,
      correct: correctCount,
      total: scoringQuestions.length,
    };
  },
});

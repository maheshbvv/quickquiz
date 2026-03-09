"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import convex from "@/lib/convex";
import { onGoogleAuthStateChanged, signInWithGoogle } from "@/lib/gmail-auth";

interface Question {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  questions: Question[];
  randomizeQuestions?: boolean;
  randomizeChoices?: boolean;
  canStart?: boolean;
  status?: string;
}

interface ProcessedQuestion extends Question {
  originalIndex: number;
  shuffledOptions?: { text: string; originalIndex: number }[];
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function QuizAttemptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('id');

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [processedQuestions, setProcessedQuestions] = useState<ProcessedQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({}); // questionIndex -> originalOptionIndex
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        router.push('/');
        return;
      }

      try {
        const quizData = await convex.query("participant:getQuizByStringId" as any, { quizId });

        if (quizData) {
          // Fetch total questions count for display
          const questionsData = await convex.query("admin:getQuizQuestions" as any, { quizId: quizData._id });
          const totalCount = questionsData ? questionsData.length : 0;
          
          // Show the lesser of total questions or questionsPerParticipant limit
          const displayCount = quizData.questionsPerParticipant && quizData.questionsPerParticipant < totalCount 
            ? quizData.questionsPerParticipant 
            : totalCount;
          
          setQuiz(quizData);
          setTotalQuestions(displayCount);
          setTimeRemaining(quizData.duration * 60); // Convert to seconds
        } else {
          router.push('/');
        }
      } catch (error: any) {
        console.error("Failed to load quiz:", error);
        // Don't expose technical errors to user, just redirect
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    // Check user auth state
    const unsubscribe = onGoogleAuthStateChanged((authUser) => {
      setUser(authUser);
    });

    loadQuiz();
    return unsubscribe;
  }, [quizId, router]);

  useEffect(() => {
    if (timeRemaining > 0 && quiz) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);

      if (timeRemaining === 0) {
        handleSubmitQuiz();
      }

      return () => clearTimeout(timer);
    }
  }, [timeRemaining, quiz]);

  const handleAnswerSelect = (questionIndex: number, originalOptionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: originalOptionIndex,
    });
  };

  const handleStartQuiz = async () => {
    if (!quiz || !user) return;

    try {
      // Create participant - use proper Convex ID and Firebase Auth details
      const participant = await convex.mutation("participant:createParticipant" as any, {
        quizId: quiz._id,
        firebaseUid: user.uid,
        name: user.displayName || user.email || "Anonymous User",
        email: user.email || undefined,
      });
      setParticipantId(participant);
      localStorage.setItem('participantId', participant);

      // Start quiz to get the properly limited questions
      const quizStartData = await convex.mutation("participant:startQuiz" as any, {
        quizId: quiz._id,
        participantId: participant,
      });

      // Process the questions returned by startQuiz (which respects the split questions logic)
      let questions: ProcessedQuestion[] = (quizStartData.questions || []).map((q: any, index: number) => ({
        ...q,
        _id: q.id, // Map 'id' to '_id' for consistency
        originalIndex: index
      }));

      if (quiz.randomizeChoices) {
        questions = questions.map(q => {
          const shuffledOptions = shuffleArray(q.options.map((opt: string, idx: number) => ({
            text: opt,
            originalIndex: idx
          })));
          return {
            ...q,
            shuffledOptions
          };
        });
      }

      setProcessedQuestions(questions);
      setIsTakingQuiz(true);
      setTimeRemaining(quiz.duration * 60); // Reset timer
    } catch (err: any) {
      console.error("Failed to start quiz", err);
      let errorMessage = err.message || "Failed to start quiz";
      
      // Clean up the error message
      errorMessage = errorMessage
        .replace(/\[Request ID: [^\]]+\]/g, '') // Remove Request ID
        .replace(/ at handler \(.*\)/g, '') // Remove handler info
        .replace(/Server Error Uncaught Error: /g, '') // Remove prefix
        .replace(/Uncaught Error: /g, '') // Remove any remaining Uncaught Error prefix
        .replace(/Failed to start quiz: /g, '') // Remove Failed to start quiz prefix
        .replace(/\s+/g, ' ') // Clean up multiple spaces
        .trim();
      
      setError(errorMessage);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !participantId || !processedQuestions.length) return;

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(selectedAnswers).map(
        ([questionIndex, originalOptionIndex]) => ({
          questionId: processedQuestions[parseInt(questionIndex)]._id,
          selectedOption: originalOptionIndex,
        })
      );

      await convex.mutation("participant:submitQuiz" as any, {
        quizId,
        participantId,
        answers: formattedAnswers,
      });

      // Store participant ID for results page
      localStorage.setItem('resultsParticipantId', participantId);

      router.push(`/quiz/results?id=${quizId}&score=${calculateScore()}&correct=${calculateCorrect()}&total=${processedQuestions.length}`);
    } catch (error: any) {
      console.error("Failed to submit quiz:", error);
      let errorMessage = error.message || "Failed to submit quiz";
      
      // Extract only the user-friendly part of the error message
      if (errorMessage.includes("Uncaught Error: ")) {
        errorMessage = errorMessage.split("Uncaught Error: ")[1].split("\n")[0];
      }
      
      // Remove any remaining file path, request ID, or handler information
      errorMessage = errorMessage
        .replace(/\[Request ID: [^\]]+\]/g, '') // Remove Request ID
        .replace(/ at handler \(.*\)/g, '') // Remove handler info
        .replace(/Server Error Uncaught Error: /g, '') // Remove prefix
        .replace(/Uncaught Error: /g, '') // Remove any remaining Uncaught Error prefix
        .replace(/Failed to submit quiz: /g, '') // Remove Failed to submit quiz prefix
        .replace(/\s+/g, ' ') // Clean up multiple spaces
        .trim();
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScore = () => {
    if (!processedQuestions.length) return 0;
    const correct = Object.entries(selectedAnswers).filter(
      ([questionIndex, originalOptionIndex]) => 
        processedQuestions[parseInt(questionIndex)].correctAnswer === originalOptionIndex
    ).length;
    return Math.round((correct / processedQuestions.length) * 100);
  };

  const calculateCorrect = () => {
    if (!processedQuestions.length) return 0;
    return Object.entries(selectedAnswers).filter(
      ([questionIndex, originalOptionIndex]) => 
        processedQuestions[parseInt(questionIndex)].correctAnswer === originalOptionIndex
    ).length;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  // Show start screen if quiz hasn't started
  if (!isTakingQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
            <p className="text-gray-600 mb-6">{quiz.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{quiz.duration} minutes</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Questions</p>
                <p className="font-semibold">{isTakingQuiz ? processedQuestions.length : totalQuestions}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <AlertCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold capitalize">{quiz.status}</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {!user ? (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">Please sign in to start the quiz</p>
              </div>
            ) : !quiz.canStart && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  {quiz.status === 'upcoming' ? 'Quiz has not started yet' : 'Quiz has ended'}
                </p>
              </div>
            )}

            <button
              onClick={handleStartQuiz}
              disabled={!user || !quiz.canStart}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (Object.keys(selectedAnswers).length / processedQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-red-600">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-600">
              {Object.keys(selectedAnswers).length} of {processedQuestions.length} questions answered
            </p>
            {Object.keys(selectedAnswers).length === processedQuestions.length && (
              <span className="text-sm text-green-600 font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> All answered
              </span>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-8 mb-8">
          {processedQuestions.map((question, qIndex) => {
            const displayOptions = question.shuffledOptions 
              ? question.shuffledOptions 
              : question.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));

            return (
              <div key={question._id} className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-start mb-6">
                  <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
                    {qIndex + 1}
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {question.questionText}
                  </h2>
                </div>

                <div className="space-y-3 ml-12">
                  {displayOptions.map((option, oIndex) => (
                    <button
                      key={oIndex}
                      onClick={() => handleAnswerSelect(qIndex, option.originalIndex)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedAnswers[qIndex] === option.originalIndex
                        ? "bg-blue-50 border-blue-600 text-blue-900"
                        : "bg-white border-gray-100 hover:border-blue-300 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${selectedAnswers[qIndex] === option.originalIndex
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-500"
                        }`}>
                          {String.fromCharCode(65 + oIndex)}
                        </div>
                        <span className="text-lg">{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">
            {Object.keys(selectedAnswers).length < processedQuestions.length 
              ? `You have answered ${Object.keys(selectedAnswers).length} out of ${processedQuestions.length} questions.`
              : "All questions answered! Ready to submit?"}
          </p>
          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
            className="bg-green-600 text-white py-3 px-12 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizAttemptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <QuizAttemptContent />
    </Suspense>
  );
}

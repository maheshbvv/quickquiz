"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import convex from "@/lib/convex";
import { Train, Users, Clock, AlertCircle, CheckCircle, Shield, Mail } from "lucide-react";
import { signInWithGoogle, extractUserInfo, onGoogleAuthStateChanged, signOutGoogle } from "@/lib/gmail-auth";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  canStart: boolean;
  status: string;
}

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('id');

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onGoogleAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        setError("Quiz ID not provided");
        setIsLoading(false);
        return;
      }

      try {
        const quizData = await convex.query("participant:getQuizByStringId" as any, { quizId });
        if (quizData) {
          setQuiz(quizData);
        } else {
          setError("Quiz not found");
        }
      } catch (error: any) {
        console.error("Failed to load quiz:", error);
        setError("Failed to load quiz: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  const handleStartQuiz = async () => {
    if (!user) {
      const authResult = await signInWithGoogle();
      if (authResult.success) {
        router.push(`/quiz/attempt?id=${quizId}`);
      }
      return;
    }
    router.push(`/quiz/attempt?id=${quizId}`);
  };

  const isQuizActive = quiz.canStart && Date.now() >= quiz.startTime && Date.now() <= quiz.endTime;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            <p className="text-gray-600">{quiz.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Duration</span>
              </div>
              <p className="text-gray-600">{quiz.duration} minutes</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Train className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900">Status</span>
              </div>
              <p className="text-gray-600 capitalize">{quiz.status}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Participants</span>
              </div>
              <p className="text-gray-600">Live tracking</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {isQuizActive
                    ? "Quiz is now active! Click below to start."
                    : "Quiz is not currently active. Please check back during the scheduled time."
                  }
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Start: {new Date(quiz.startTime).toLocaleString()}<br />
                  End: {new Date(quiz.endTime).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleStartQuiz}
              disabled={!isQuizActive}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center ${isQuizActive
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {user ? 'Start Quiz' : 'Sign in with Google to Start'}
            </button>

            <button
              onClick={() => router.push('/')}
              className="bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}

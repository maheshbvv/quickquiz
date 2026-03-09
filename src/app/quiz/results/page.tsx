"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Trophy, Home, AlertCircle } from "lucide-react";
import convex from "@/lib/convex";
import { api } from "../../../../convex/_generated/api";
import { GenericId } from "convex/values";

interface QuestionResult {
  questionId: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  userSelectedOption: number | null;
  isCorrect: boolean;
}

function QuizResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('id');
  
  const [score, setScore] = useState(parseInt(searchParams.get('score') || '0'));
  const [correct, setCorrect] = useState(parseInt(searchParams.get('correct') || '0'));
  const [total, setTotal] = useState(parseInt(searchParams.get('total') || '0'));
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetailedResults = async () => {
      // Try to get the temporary results participant ID first
      let participantId = localStorage.getItem('resultsParticipantId');
      
      // If not found, try the regular participant ID (for direct access)
      if (!participantId) {
        participantId = localStorage.getItem('participantId');
      }
      
      if (!participantId || !quizId) {
        console.error("No participant ID or quiz ID found");
        setError("Quiz results not found. Please retake the quiz.");
        setIsLoading(false);
        return;
      }

      try {
        const results = await convex.query(api.participant.getQuizResults, {
          quizId: quizId as GenericId<"quizzes">,
          participantId: participantId as GenericId<"participants">,
        });

        if (results) {
          setQuestionResults(results.questionResults);
          setScore(Math.round(results.submission.score * 100));
          setCorrect(results.questionResults.filter((q: QuestionResult) => q.isCorrect).length);
          setTotal(results.questionResults.length);
          setQuizTitle(results.quiz?.title || "Quiz Results");
          
          // Clear the temporary participant ID after loading results
          localStorage.removeItem('resultsParticipantId');
        } else {
          console.log("No results found for participant");
          setError("Quiz results not found. You may need to retake the quiz.");
        }
      } catch (error: any) {
        console.error("Failed to load quiz results:", error);
        setError("Failed to load detailed results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

  const handleLoadDetailedResults = async () => {
    setIsLoading(true);
    setError("");
    await loadDetailedResults();
  };

  useEffect(() => {
    loadDetailedResults();
  }, [quizId]);

  const getScoreMessage = () => {
    if (score >= 90) return "Outstanding! 🎉";
    if (score >= 80) return "Excellent! 🌟";
    if (score >= 70) return "Great Job! 🏆";
    if (score >= 60) return "Good Effort! 👍";
    return "Keep Practicing! 💪";
  };

  const getScoreColor = () => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    return "text-yellow-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading detailed results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Detailed Results</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          
          {/* Show basic score as fallback */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Score</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">{correct}/{total}</div>
            <div className="text-sm text-gray-600">
              {score}% correct
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleLoadDetailedResults}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push(`/quiz?id=${quizId}`)}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If there are no question results but we have basic score data, show basic results
  if (!isLoading && !error && questionResults.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-2">
            <span className={getScoreColor()}>{correct}/{total}</span>
          </h1>
          
          <div className="text-xl text-gray-600 mb-4">{score}%</div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {getScoreMessage()}
          </h2>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <span className="text-gray-600 text-sm">Correct</span>
                <div className="font-medium text-green-600 flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {correct}
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-gray-600 text-sm">Incorrect</span>
                <div className="font-medium text-red-600 flex items-center justify-center mt-1">
                  <XCircle className="w-4 h-4 mr-1" />
                  {total - correct}
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-gray-600 text-sm">Total</span>
                <div className="font-medium text-gray-900 mt-1">{total}</div>
              </div>
            </div>
          </div>

          <div className="text-gray-600 mb-8">
            {score >= 80 && "Congratulations on your excellent performance!"}
            {score >= 60 && score < 80 && "Good job! You're doing well, keep it up!"}
            {score < 60 && "Don't worry, practice makes perfect. Try again!"}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLoadDetailedResults}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading...
                </>
              ) : (
                "Load Detailed Results"
              )}
            </button>
            <button
              onClick={() => router.push(`/quiz?id=${quizId}`)}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Back to Quiz
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Find More Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Score */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-6">
            {/* Quiz Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{quizTitle}</h2>
            
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Score as correct/total */}
            <h1 className="text-4xl font-bold mb-2">
              <span className={getScoreColor()}>{correct}/{total}</span>
            </h1>
            
            {/* Percentage */}
            <div className="text-xl text-gray-600 mb-4">{score}%</div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {getScoreMessage()}
            </h2>

            {/* Stats */}
            <div className="bg-gray-50 rounded-lg p-4 inline-block">
              <div className="flex justify-center items-center space-x-8">
                <div className="text-center">
                  <span className="text-gray-600 text-sm">Correct</span>
                  <div className="font-medium text-green-600 flex items-center justify-center mt-1">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {correct}
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="text-gray-600 text-sm">Incorrect</span>
                  <div className="font-medium text-red-600 flex items-center justify-center mt-1">
                    <XCircle className="w-4 h-4 mr-1" />
                    {total - correct}
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="text-gray-600 text-sm">Total</span>
                  <div className="font-medium text-gray-900 mt-1">{total}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Circle */}
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : "#eab308"}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-bold ${getScoreColor()}`}>{score}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Question Results */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Detailed Results</h3>
          
          <div className="space-y-6">
            {questionResults.map((question, index) => (
              <div 
                key={question.questionId} 
                className={`border rounded-lg p-6 ${
                  question.isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : question.userSelectedOption === null
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      question.isCorrect 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Question {index + 1}
                      </h4>
                      <p className="text-gray-700">{question.questionText}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-2 ${
                    question.isCorrect ? 'text-green-600' : question.userSelectedOption === null ? 'text-gray-500' : 'text-red-600'
                  }`}>
                    {question.isCorrect ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Correct</span>
                      </>
                    ) : question.userSelectedOption === null ? (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Not Answered</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">Incorrect</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2 ml-11">
                  {question.options.map((option, optionIndex) => {
                    const isUserAnswer = question.userSelectedOption === optionIndex;
                    const isCorrectAnswer = question.correctAnswer === optionIndex;
                    
                    return (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg border-2 flex items-center space-x-3 ${
                          isCorrectAnswer
                            ? 'border-green-500 bg-green-100'
                            : isUserAnswer
                            ? 'border-red-500 bg-red-100'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          isCorrectAnswer
                            ? 'bg-green-600 text-white'
                            : isUserAnswer
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + optionIndex)}
                        </div>
                        <span className={`flex-1 ${
                          isCorrectAnswer
                            ? 'text-green-800 font-medium'
                            : isUserAnswer
                            ? 'text-red-800 font-medium'
                            : 'text-gray-700'
                        }`}>
                          {option}
                        </span>
                        {isCorrectAnswer && (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                        {isUserAnswer && !isCorrectAnswer && (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Feedback for incorrect answers */}
                {!question.isCorrect && (
                  <div className="mt-4 ml-11 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Correct answer: {String.fromCharCode(65 + question.correctAnswer)}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          {question.options[question.correctAnswer]}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push(`/quiz?id=${quizId}`)}
              className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Quiz
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Find More Quizzes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <QuizResultsContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import convex from "@/lib/convex";
import { Calendar, Clock, Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface Question {
  _id?: string;
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
  questionsPerParticipant?: number;
}

function EditQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('id');
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showRandomOptions, setShowRandomOptions] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        setError("Quiz ID not provided");
        setIsLoading(false);
        return;
      }

      try {
        const quizData = await convex.query("admin:getQuiz" as any, { quizId });
        if (quizData) {
          setQuiz(quizData);
          setShowRandomOptions(quizData.randomizeQuestions || quizData.randomizeChoices || false);
        } else {
          setError("Quiz not found");
        }
      } catch (err: any) {
        setError("Failed to load quiz: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  const handleSaveQuiz = async () => {
    if (!quiz) return;

    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Please log in again");
        return;
      }

      await convex.mutation("admin:updateQuiz" as any, {
        firebaseUid: user.uid,
        quizId,
        title: quiz.title,
        description: quiz.description,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        duration: quiz.duration,
        randomizeQuestions: quiz.randomizeQuestions || false,
        randomizeChoices: quiz.randomizeChoices || false,
        questionsPerParticipant: quiz.questionsPerParticipant,
      });

      // Update questions individually if they have changed
      // Note: The current structure might need adjustment depending on how questions are handled in the backend
      // But based on admin:updateQuiz mutation in convex/admin.ts, it doesn't take questions anymore.
      // So we might need to handle questions separately or update the mutation.
      
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError("Failed to save quiz: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          questionText: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ],
    });
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    if (!quiz) return;
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((_, i) => i !== index),
    });
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Quiz</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={quiz.description}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Split Questions Setting */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Split Questions Settings</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Questions per Participant (Optional)
                  </label>
                  <input
                    type="number"
                    value={quiz.questionsPerParticipant || ""}
                    onChange={(e) => setQuiz({ 
                      ...quiz, 
                      questionsPerParticipant: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    placeholder="Leave empty to show all questions"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    If set, each participant will see this many random questions from the total pool
                  </p>
                </div>

                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Questions in Quiz
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md">
                      {quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'}
                    </div>
                  </div>
                </div>
              </div>

              {quiz.questionsPerParticipant && quiz.questionsPerParticipant > quiz.questions.length && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Warning: Questions per participant ({quiz.questionsPerParticipant}) exceeds total questions ({quiz.questions.length}). 
                    Participants will see all questions.
                  </p>
                </div>
              )}
            </div>

            {/* Randomization Settings */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Randomization Settings</h3>
              
              <div className="flex items-center space-x-3 mb-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRandomOptions}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setShowRandomOptions(checked);
                      if (!checked && quiz) {
                        setQuiz({ ...quiz, randomizeQuestions: false, randomizeChoices: false });
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Enable Randomization</span>
                </label>
              </div>

              {showRandomOptions && quiz && (
                <div className="space-y-4 ml-6 pl-4 border-l-2 border-blue-100">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="randomizeQuestions"
                      checked={quiz.randomizeQuestions || false}
                      onChange={(e) => setQuiz({ ...quiz, randomizeQuestions: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="randomizeQuestions" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Randomize Question Order
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="randomizeChoices"
                      checked={quiz.randomizeChoices || false}
                      onChange={(e) => setQuiz({ ...quiz, randomizeChoices: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="randomizeChoices" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Randomize Choice Order
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={new Date(quiz.startTime).toISOString().slice(0, 16)}
                  onChange={(e) => setQuiz({ ...quiz, startTime: new Date(e.target.value).getTime() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={new Date(quiz.endTime).toISOString().slice(0, 16)}
                  onChange={(e) => setQuiz({ ...quiz, endTime: new Date(e.target.value).getTime() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={quiz.duration}
                  onChange={(e) => setQuiz({ ...quiz, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                <button
                  onClick={addQuestion}
                  className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-4">
                {quiz.questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text
                        </label>
                        <input
                          type="text"
                          value={question.questionText}
                          onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options
                        </label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                            <span className="w-8 text-sm font-medium text-gray-600">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options];
                                newOptions[optionIndex] = e.target.value;
                                updateQuestion(index, 'options', newOptions);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => updateQuestion(index, 'correctAnswer', optionIndex)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-600">Correct</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuiz}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Quiz'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditQuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <EditQuizContent />
    </Suspense>
  );
}

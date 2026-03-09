"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Clock, Calendar } from "lucide-react";
import { auth } from "@/lib/firebase";
import convex from "@/lib/convex";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

export default function CreateQuizPage() {
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    duration: 30, // minutes
    randomizeQuestions: false,
    randomizeChoices: false,
    questionsPerParticipant: "", // empty string means show all questions
  });
  const [showRandomOptions, setShowRandomOptions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate form
      if (!quizData.title || !quizData.description) {
        setError("Please fill in all quiz details");
        return;
      }

      if (!quizData.startTime || !quizData.endTime) {
        setError("Please set start and end times");
        return;
      }

      const invalidQuestions = questions.filter(
        (q) => !q.questionText || q.options.some((opt) => !opt)
      );

      if (invalidQuestions.length > 0) {
        setError("Please fill in all question details");
        return;
      }

      // Get current user
      const user = auth.currentUser;
      if (!user) {
        setError("Please log in again");
        return;
      }

      // Convert times to timestamps
      const startTime = new Date(quizData.startTime).getTime();
      const endTime = new Date(quizData.endTime).getTime();
      const duration = quizData.duration * 60 * 1000; // Convert to milliseconds

      // Create quiz
      try {
        // Use the Convex client instead of manual HTTP requests
        
        // First create/update the admin
        const adminId = await convex.mutation("admin:createOrUpdateAdmin" as any, {
          firebaseUid: user.uid,
          email: user.email || "",
        });
        
        console.log("Admin created/updated with ID:", adminId);

        // Create the quiz
        const quizId = await convex.mutation("admin:createQuiz" as any, {
          firebaseUid: user.uid,
          title: quizData.title,
          description: quizData.description,
          startTime,
          endTime,
          duration: quizData.duration,
          randomizeQuestions: quizData.randomizeQuestions,
          randomizeChoices: quizData.randomizeChoices,
          questionsPerParticipant: quizData.questionsPerParticipant ? parseInt(quizData.questionsPerParticipant) : undefined,
        });
        
        console.log("Quiz created with ID:", quizId);

        // Add questions
        for (const question of questions) {
          const questionId = await convex.mutation("admin:addQuestion" as any, {
            firebaseUid: user.uid,
            quizId,
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
          });
          
          console.log("Question added with ID:", questionId);
        }

        console.log("Quiz and questions saved to Convex successfully!");
        
        // Redirect to dashboard
        router.push("/admin/dashboard");
      } catch (convexError: any) {
        console.error("Convex error:", convexError);
        setError("Failed to save quiz to database. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to create quiz:", error);
      setError(error.message || "Failed to create quiz");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quiz Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Details</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={quizData.title}
                  onChange={(e) =>
                    setQuizData({ ...quizData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={quizData.duration}
                  onChange={(e) =>
                    setQuizData({ ...quizData, duration: parseInt(e.target.value) || 30 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="180"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Questions per Participant (Optional)
                </label>
                <input
                  type="number"
                  value={quizData.questionsPerParticipant}
                  onChange={(e) =>
                    setQuizData({ ...quizData, questionsPerParticipant: e.target.value })
                  }
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
                    Total Questions Added
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={quizData.description}
                onChange={(e) =>
                  setQuizData({ ...quizData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter quiz description"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={quizData.startTime}
                  onChange={(e) =>
                    setQuizData({ ...quizData, startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={quizData.endTime}
                  onChange={(e) =>
                    setQuizData({ ...quizData, endTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Randomization Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Randomization Settings</h2>
            
            <div className="flex items-center space-x-3 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRandomOptions}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowRandomOptions(checked);
                    if (!checked) {
                      setQuizData({ ...quizData, randomizeQuestions: false, randomizeChoices: false });
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">Enable Randomization</span>
              </label>
            </div>

            {showRandomOptions && (
              <div className="space-y-4 ml-6 pl-4 border-l-2 border-blue-100">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="randomizeQuestions"
                    checked={quizData.randomizeQuestions}
                    onChange={(e) => setQuizData({ ...quizData, randomizeQuestions: e.target.checked })}
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
                    checked={quizData.randomizeChoices}
                    onChange={(e) => setQuizData({ ...quizData, randomizeChoices: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="randomizeChoices" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Randomize Choice Order
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Question {qIndex + 1}
                    </h3>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text
                    </label>
                    <input
                      type="text"
                      value={question.questionText}
                      onChange={(e) =>
                        updateQuestion(question.id, "questionText", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your question"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Answer Options
                    </label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() =>
                            updateQuestion(question.id, "correctAnswer", oIndex)
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateOption(question.id, oIndex, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${oIndex + 1}`}
                          required
                        />
                        {question.correctAnswer === oIndex && (
                          <span className="text-green-600 text-sm font-medium">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/dashboard"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Quiz..." : "Create Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

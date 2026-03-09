"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { extractUserInfo, onGoogleAuthStateChanged, signOutGoogle } from "@/lib/gmail-auth";
import convex from "@/lib/convex";
import Link from "next/link";
import { Calendar, Users, Share2, Clock, Eye, Train, Settings, BarChart3, Edit, Trash2, ClipboardList } from "lucide-react";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  createdAt: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [notification, setNotification] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const router = useRouter();

  const loadQuizzes = async (firebaseUid: string) => {
    console.log("Loading quizzes for Firebase UID:", firebaseUid);
    setQuizzesLoading(true);
    try {
      // Add timeout to prevent infinite loading
      const quizzesPromise = convex.query("admin:getQuizzes" as any, { firebaseUid });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Load quizzes timeout")), 10000)
      );

      const userQuizzes = await Promise.race([quizzesPromise, timeoutPromise]);
      console.log("Found quizzes:", userQuizzes);
      setQuizzes(userQuizzes || []);
    } catch (error: any) {
      console.error("Failed to load quizzes:", error);
      setQuizzes([]);
    } finally {
      setQuizzesLoading(false);
    }
  };

  useEffect(() => {
    console.log("Dashboard useEffect mounting");
    // Check if we have stored user info first
    const storedUser = localStorage.getItem('firebaseUser');
    console.log("Stored user found:", !!storedUser);

    if (storedUser) {
      try {
        const userInfo = JSON.parse(storedUser);
        console.log("Parsed stored user UID:", userInfo.uid);
        setUser(userInfo);
        loadQuizzes(userInfo.uid);
        setIsLoading(false);
        // We still subscribe to auth changes to stay in sync
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('firebaseUser');
      }
    }

    console.log("Setting up auth state listener...");
    // Use Firebase auth check
    const unsubscribe = onGoogleAuthStateChanged((firebaseUser) => {
      console.log("Dashboard auth state changed:", firebaseUser ? `User logged in: ${firebaseUser.uid}` : "No user");

      if (firebaseUser) {
        const userInfo = extractUserInfo(firebaseUser);
        setUser(userInfo);
        localStorage.setItem('firebaseUser', JSON.stringify(userInfo));
        loadQuizzes(userInfo.uid);
        setIsLoading(false);
      } else {
        console.log("No firebase user, checking redirect logic...");
        // Only redirect if we don't have stored user and this isn't a redirect loop
        if (!localStorage.getItem('firebaseUser')) {
          console.log("No stored user either, redirecting to /admin");
          window.location.href = "/admin?redirected=true";
        } else {
          console.log("Have stored user, keeping state for now");
        }
        // If we don't have a user, we still want to stop the loading state 
        // after some time to avoid being stuck if Firebase fails to respond
      }
    });

    // Safety timeout: if after 5 seconds we're still loading, something is stuck
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Auth check safety timeout reached");
        if (!localStorage.getItem('firebaseUser')) {
          router.push("/admin");
        }
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      console.log("Dashboard useEffect cleanup");
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutGoogle();
      router.push("/admin");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const shareQuiz = (quizId: string) => {
    const shareUrl = `${window.location.origin}/quiz?id=${quizId}`;
    navigator.clipboard.writeText(shareUrl);
    setNotification("Quiz link copied to clipboard!");
    // Clear notification after 3 seconds
    setTimeout(() => setNotification(""), 3000);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      return;
    }

    console.log("Attempting to delete quiz:", quizId);
    console.log("With Firebase UID:", user.uid);

    setDeleteLoading(quizId);
    try {
      await convex.mutation("admin:deleteQuiz" as any, {
        firebaseUid: user.uid,
        quizId,
      });

      setNotification("Quiz deleted successfully!");
      setQuizzes(quizzes.filter(quiz => quiz._id !== quizId));
      setTimeout(() => setNotification(""), 3000);
    } catch (error: any) {
      console.error("Failed to delete quiz:", error);

      // Extract the actual error message from Convex error
      let errorMessage = "Failed to delete quiz";
      if (error.message) {
        if (error.message.includes("[Request ID:") && error.message.includes("Server Error")) {
          // This is likely a permission error
          errorMessage = "You don't have permission to delete this quiz. You can only delete quizzes that you created.";
        } else {
          errorMessage = error.message;
        }
      }

      setNotification(errorMessage);
      setTimeout(() => setNotification(""), 3000);
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const isQuizActive = (startTime: number, endTime: number) => {
    const now = Date.now();
    return now >= startTime && now <= endTime;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ns-gray-50 flex items-center justify-center">
        <div className="ns-card text-center">
          <div className="w-8 h-8 border-2 border-ns-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="ns-body-text">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ns-gray-50 flex items-center justify-center">
        <div className="ns-card text-center">
          <span className="ns-body-text">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ns-gray-50">
      {/* Header */}
      <header className="bg-ns-white border-b border-ns-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-ns-primary rounded-lg flex items-center justify-center">
                <Train className="w-6 h-6 text-ns-white" />
              </div>
              <div>
                <h1 className="ns-heading-1 mb-0">Admin Dashboard</h1>
                <p className="ns-caption text-ns-gray-400 mt-1">Welcome, {user?.displayName || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <button
                onClick={handleSignOut}
                className="ns-button-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Notification */}
        {notification && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{notification}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setNotification("")}
                    className="inline-flex bg-green-50 p-1.5 rounded-md text-green-500 hover:bg-green-100"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/create-quiz" className="ns-card ns-card-hover block">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-ns-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Train className="w-6 h-6 text-ns-white" />
              </div>
              <div>
                <h2 className="ns-heading-3 mb-2">Create Quiz</h2>
                <p className="ns-body-text mb-4">Create a new quiz with questions and timing</p>
                <span className="text-ns-primary font-medium">Create New Quiz →</span>
              </div>
            </div>
          </Link>

          <div className="ns-card">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-ns-success rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-ns-white" />
              </div>
              <div>
                <h2 className="ns-heading-3 mb-2">Quick Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="ns-body-text">Total Quizzes</span>
                    <span className="ns-heading-3 text-ns-primary">{quizzes.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="ns-body-text">Active Quizzes</span>
                    <span className="ns-heading-3 text-ns-success">
                      {quizzes.filter(q => isQuizActive(q.startTime, q.endTime)).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ns-card">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-ns-info rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="w-6 h-6 text-ns-white" />
              </div>
              <div>
                <h2 className="ns-heading-3 mb-2">System Status</h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-ns-success rounded-full mr-2"></div>
                    <span className="ns-caption">Database Connected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-ns-success rounded-full mr-2"></div>
                    <span className="ns-caption">Production Mode</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Quizzes */}
        <div className="ns-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="ns-heading-2">My Quizzes</h2>
            <div className="flex items-center space-x-2 text-ns-gray-400">
              <Train className="w-4 h-4" />
              <span className="ns-caption">Manage your quizzes</span>
            </div>
          </div>

          {quizzesLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-ns-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ns-body-text">Loading quizzes...</span>
              </div>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-ns-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Train className="w-8 h-8 text-ns-gray-400" />
              </div>
              <h3 className="ns-heading-3 mb-2">No Quizzes Created</h3>
              <p className="ns-body-text mb-6">You haven't created any quizzes yet</p>
              <Link href="/admin/create-quiz" className="ns-button-primary">
                Create Your First Quiz
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="ns-card border border-ns-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="ns-heading-3 mb-2">{quiz.title}</h3>
                      <p className="ns-body-text mb-3">{quiz.description}</p>

                      <div className="flex flex-wrap gap-4 mb-3">
                        <div className="flex items-center space-x-1 text-ns-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span className="ns-caption">Start: {formatDate(quiz.startTime)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-ns-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span className="ns-caption">End: {formatDate(quiz.endTime)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-ns-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="ns-caption">Duration: {Math.round(quiz.duration / 60000)} min</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        {isQuizActive(quiz.startTime, quiz.endTime) ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-ns-success text-ns-white">
                            Active
                          </span>
                        ) : Date.now() < quiz.startTime ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-ns-warning text-ns-white">
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-ns-gray-300 text-ns-gray-500">
                            Ended
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => shareQuiz(quiz._id)}
                        className="ns-button-secondary p-2"
                        title="Share Quiz"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/quiz?id=${quiz._id}`, '_blank')}
                        className="ns-button-secondary p-2"
                        title="Preview Quiz"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/edit-quiz?id=${quiz._id}`)}
                        className="ns-button-secondary p-2"
                        title="Edit Quiz"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/results?id=${quiz._id}`)}
                        className="ns-button-secondary p-2"
                        title="View Results"
                      >
                        <ClipboardList className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        disabled={deleteLoading === quiz._id}
                        className="ns-button-secondary p-2 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Quiz"
                      >
                        {deleteLoading === quiz._id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

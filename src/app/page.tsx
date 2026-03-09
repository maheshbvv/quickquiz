"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import convex from "@/lib/convex";
import { Clock, Users, Play, Train } from "lucide-react";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  questionCount: number;
}

export default function Home() {
  const [activeQuizzes, setActiveQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveQuizzes();
    
    // Fallback timeout to ensure loading is cleared
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 15000);
    
    return () => clearTimeout(fallbackTimeout);
  }, []);

  const loadActiveQuizzes = async () => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );
      
      const quizzesPromise = convex.query("admin:getActiveQuizzes" as any);
      
      const quizzes = await Promise.race([quizzesPromise, timeoutPromise]);
      setActiveQuizzes(quizzes || []);
    } catch (error) {
      console.error("Failed to load active quizzes:", error);
      // Set empty array on error to prevent infinite loading
      setActiveQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (durationMs: number) => {
    const minutes = Math.round(durationMs / 60000);
    return `${minutes}m`;
  };

  const formatEndTime = (timestamp: number) => {
    const now = Date.now();
    const end = timestamp;
    const diff = end - now;
    
    if (diff < 0) return "Ended";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m left`;
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m left`;
  };

  return (
    <div className="min-h-screen bg-ns-gray-50">
      {/* Header */}
      <header className="bg-ns-white border-b border-ns-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-ns-primary rounded-lg flex items-center justify-center">
              <Train className="w-6 h-6 text-ns-white" />
            </div>
            <h1 className="ns-heading-1 mb-0">QuickQuiz</h1>
          </div>
          <p className="ns-body-text mt-2 mb-0">
            A lightweight platform for creating and sharing quizzes with instant results
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* User Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="ns-card ns-card-hover">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-ns-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Train className="w-6 h-6 text-ns-white" />
              </div>
              <div>
                <h2 className="ns-heading-3 mb-2">For Admins</h2>
                <p className="ns-body-text mb-4">
                  Create quizzes, set time limits, and view real-time results
                </p>
                <Link 
                  href="/admin"
                  className="ns-button-primary inline-block"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
          
          <div className="ns-card ns-card-hover">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-ns-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-ns-white" />
              </div>
              <div>
                <h2 className="ns-heading-3 mb-2">For Participants</h2>
                <p className="ns-body-text mb-4">
                  Join quizzes with phone verification and get instant scores
                </p>
                <p className="ns-caption">
                  Enter a quiz link to participate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Quizzes Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="ns-heading-2">Active Quizzes</h2>
            <div className="flex items-center space-x-2 text-ns-gray-400">
              <Clock className="w-4 h-4" />
              <span className="ns-caption">Real-time updates</span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="ns-card text-center py-12">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-ns-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ns-body-text">Loading active quizzes...</span>
              </div>
            </div>
          ) : activeQuizzes.length === 0 ? (
            <div className="ns-card text-center py-12">
              <div className="w-16 h-16 bg-ns-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-ns-gray-400" />
              </div>
              <h3 className="ns-heading-3 mb-2">No Active Quizzes</h3>
              <p className="ns-body-text mb-4">
                No quizzes are currently available. Check back later or ask an admin to create a new quiz.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeQuizzes.map((quiz) => (
                <div key={quiz._id} className="ns-card ns-card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="ns-heading-3 mb-2">{quiz.title}</h3>
                      <p className="ns-body-text line-clamp-2">{quiz.description}</p>
                    </div>
                    <div className="w-8 h-8 bg-ns-accent rounded-full flex items-center justify-center ml-3">
                      <Play className="w-4 h-4 text-ns-white" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-ns-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="ns-caption">{quiz.questionCount} questions</span>
                      </div>
                      <div className="flex items-center space-x-1 text-ns-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="ns-caption">{formatDuration(quiz.duration)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="ns-caption text-ns-warning">
                      {formatEndTime(quiz.endTime)}
                    </span>
                    <Link 
                      href={`/quiz?id=${quiz._id}`}
                      className="ns-button-primary text-sm"
                    >
                      Start Quiz
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* How it works */}
        <section className="ns-card">
          <h2 className="ns-heading-2 mb-6">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-ns-primary rounded-full flex items-center justify-center text-ns-white font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h3 className="ns-heading-3 mb-2">Create Quiz</h3>
              <p className="ns-body-text">
                Admin creates questions and sets time limits
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-ns-primary rounded-full flex items-center justify-center text-ns-white font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h3 className="ns-heading-3 mb-2">Share Link</h3>
              <p className="ns-body-text">
                Share the unique quiz link with participants
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-ns-primary rounded-full flex items-center justify-center text-ns-white font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h3 className="ns-heading-3 mb-2">Get Results</h3>
              <p className="ns-body-text">
                Participants get instant scores, admins view detailed results
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithGoogle, extractUserInfo, onGoogleAuthStateChanged, signOutGoogle, AuthResult } from "@/lib/gmail-auth";
import convex from "@/lib/convex";
import { Mail, Shield, AlertCircle } from "lucide-react";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  const handleAdminLogin = async (userInfo: any) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Create or update admin in Convex
      const adminData = await convex.mutation("admin:createOrUpdateAdmin" as any, {
        firebaseUid: userInfo.uid,
        email: userInfo.email,
      });
      
      // Use window.location for redirect instead of Next.js router
      window.location.href = "/admin/dashboard";
    } catch (convexError: any) {
      console.error("Convex error:", convexError);
      setError("Failed to authenticate as admin. Please check your permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 3000);

    // Add fallback in case auth state doesn't change
    const fallbackTimeout = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 2000);

    // Only check auth state, don't auto-login to prevent errors
    const unsubscribe = onGoogleAuthStateChanged((firebaseUser) => {
      clearTimeout(authTimeout);
      clearTimeout(fallbackTimeout);
      
      if (firebaseUser) {
        const userInfo = extractUserInfo(firebaseUser);
        setUser(userInfo);
        // Call handleAdminLogin to process the admin authentication
        handleAdminLogin(userInfo);
      } else {
        setUser(null);
      }
      setIsCheckingAuth(false);
    });

    return () => {
      clearTimeout(authTimeout);
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Add timeout to prevent infinite loading
      const signInPromise = signInWithGoogle();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Sign-in timeout")), 15000)
      );
      
      const result = await Promise.race([signInPromise, timeoutPromise]) as AuthResult;
      
      if (result.success && result.user) {
        const userInfo = extractUserInfo(result.user);
        setUser(userInfo);
        await handleAdminLogin(userInfo);
      } else {
        setError(result.error || "Failed to sign in with Google");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {isCheckingAuth ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
              <p className="text-gray-600">Sign in with Google to manage your quizzes</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-red-600 text-sm ml-2">{error}</p>
                </div>
              </div>
            )}

            {!user ? (
          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 rounded-md py-3 px-4 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Sign in with Google</span>
                </>
              )}
            </button>

            <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Secure Admin Access</p>
                <p>Use your Google account to securely access the admin dashboard.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-800">{user.displayName}</p>
                <p className="text-sm text-green-600">{user.email}</p>
                <p className="text-xs text-green-500 mt-1">Authenticated as Admin</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">Redirecting to dashboard...</p>
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

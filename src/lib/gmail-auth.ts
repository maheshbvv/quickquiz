import { auth } from "./firebase";
import { 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from "firebase/auth";

export interface AuthResult {
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}

// Google Sign In with Popup
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const provider = new GoogleAuthProvider();
    
    // Configure additional permissions if needed
    provider.addScope('email');
    provider.addScope('profile');
    
    // Use popup for better UX
    const result = await signInWithPopup(auth, provider);
    
    return {
      success: true,
      user: result.user,
    };
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    
    // Handle specific errors
    if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: "Sign-in was cancelled"
      };
    } else if (error.code === 'auth/popup-blocked') {
      return {
        success: false,
        error: "Pop-up was blocked. Please allow pop-ups and try again."
      };
    } else if (error.code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        error: "Sign-in was cancelled"
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to sign in with Google"
    };
  }
}

// Google Sign In with Redirect (fallback for mobile)
export async function signInWithGoogleRedirect(): Promise<AuthResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    await signInWithRedirect(auth, provider);
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Google redirect sign-in error:", error);
    return {
      success: false,
      error: error.message || "Failed to sign in with Google"
    };
  }
}

// Handle redirect result
export async function handleGoogleRedirect(): Promise<AuthResult> {
  try {
    const result = await getRedirectResult(auth);
    
    if (result?.user) {
      return {
        success: true,
        user: result.user,
      };
    } else {
      return {
        success: false,
        error: "No user found after redirect"
      };
    }
  } catch (error: any) {
    console.error("Google redirect result error:", error);
    return {
      success: false,
      error: error.message || "Failed to complete sign-in"
    };
  }
}

// Get current user
export function getCurrentGoogleUser(): FirebaseUser | null {
  return auth.currentUser;
}

// Sign out
export async function signOutGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error("Google sign-out error:", error);
    return {
      success: false,
      error: error.message || "Failed to sign out"
    };
  }
}

// Listen to auth state changes
export function onGoogleAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  return auth.onAuthStateChanged(callback);
}

// Extract user information
export function extractUserInfo(user: FirebaseUser) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    provider: user.providerData[0]?.providerId || 'google.com',
    createdAt: user.metadata.creationTime,
    lastSignInAt: user.metadata.lastSignInTime,
  };
}

// Check if user is authenticated
export function isGoogleAuthenticated(): boolean {
  return !!auth.currentUser && !!auth.currentUser.emailVerified;
}

// Refresh user token
export async function refreshGoogleUser(): Promise<AuthResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: "No user to refresh"
      };
    }
    
    await user.reload();
    
    return {
      success: true,
      user: user,
    };
  } catch (error: any) {
    console.error("User refresh error:", error);
    return {
      success: false,
      error: error.message || "Failed to refresh user"
    };
  }
}

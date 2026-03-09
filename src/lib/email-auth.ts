import { auth } from "./firebase";
import { 
  sendPasswordResetEmail, 
  signInWithEmailLink,
  applyActionCode 
} from "firebase/auth";

export async function sendEmailVerification(email: string) {
  try {
    const actionCodeSettings = {
      url: `${window.location.origin}/quiz/verify`,
      handleCodeInApp: true,
      iOS: {
        bundleId: 'com.quickquiz.app'
      },
      android: {
        packageName: 'com.quickquiz.app',
        installApp: true
      }
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    
    return {
      success: true,
      message: "Verification email sent! Check your inbox."
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function verifyEmailLink(email: string, emailLink: string) {
  try {
    // Check if the link is a sign-in with email link
    const result = await signInWithEmailLink(auth, email, emailLink);
    
    return {
      success: true,
      user: result.user,
      message: "Email verified successfully!"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function signOutEmailUser() {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

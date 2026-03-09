import { auth } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

export async function signInAdmin(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      user: userCredential.user,
      success: true,
    };
  } catch (error: any) {
    return {
      error: error.message,
      success: false,
    };
  }
}

export async function signUpAdmin(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      user: userCredential.user,
      success: true,
    };
  } catch (error: any) {
    return {
      error: error.message,
      success: false,
    };
  }
}

export async function resetAdminPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      error: error.message,
      success: false,
    };
  }
}

export async function signOutAdmin() {
  try {
    await auth.signOut();
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      error: error.message,
      success: false,
    };
  }
}

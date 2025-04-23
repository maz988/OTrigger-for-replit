import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { InsertQuizResponse } from "@shared/schema";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase (commented out for demo)
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// Mock database for demo
// Using explicit type declaration to avoid TypeScript 'any' error
interface MockDb {
  collection: (name: string) => {
    add: (data: Record<string, unknown>) => Promise<{ id: string }>;
  };
}

const mockDb: MockDb = {
  collection: () => ({
    add: async () => ({ id: "mock-id-" + Date.now() }),
  }),
};

export const saveQuizResponse = async (quizResponse: InsertQuizResponse, aiResponse: string) => {
  try {
    // For demo purposes, just log and return success without actual Firebase submission
    console.log("Demo mode: Saving quiz response", { ...quizResponse, aiResponse });
    
    // Return mock response
    return { success: true, id: "mock-id-" + Date.now() };
    
    // Original implementation for when Firebase is configured:
    /*
    const docRef = await addDoc(collection(db, "quiz-responses"), {
      ...quizResponse,
      aiResponse,
      createdAt: serverTimestamp(),
    });
    
    console.log("Document written with ID: ", docRef.id);
    return { success: true, id: docRef.id };
    */
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, error: e };
  }
};

// Export mock DB for demo purposes
export default mockDb;

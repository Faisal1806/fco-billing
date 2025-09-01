
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Initialize Firebase app
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Lazy-loaded client-side services
let db: Firestore | null = null;
let auth: Auth | null = null;
let messaging: Messaging | null = null;

/**
 * Gets the Firestore instance, initializing it only on the client-side.
 * On the server, it returns null to prevent crashes during SSR.
 */
export function getClientDb(): Firestore | null {
  if (typeof window !== 'undefined') {
    if (!db) {
      db = getFirestore(app);
    }
    return db;
  }
  return null;
}


/**
 * Gets the Auth instance, initializing it only on the client-side.
 * On the server, it returns null to prevent crashes during SSR.
 */
export function getClientAuth(): Auth | null {
  if (typeof window !== 'undefined') {
    if (!auth) {
      auth = getAuth(app);
    }
    return auth;
  }
  return null;
}

/**
 * Gets the Messaging instance, initializing it only on the client-side.
 * On the server, it returns null.
 */
export function getClientMessaging(): Messaging | null {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (!messaging) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.error("Firebase Messaging not supported in this browser:", e);
        messaging = null;
      }
    }
    return messaging;
  }
  return null;
}

export { app };

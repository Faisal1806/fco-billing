
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AlZaSyDrev3-idwKsbpZI8UL9MT-GHssblaEuo4",
  authDomain: "myf.cobillingsystemapp.firebaseapp.com",
  projectId: "myf.cobillingsystemapp",
  storageBucket: "myf.cobillingsystemapp.appspot.com",
  messagingSenderId: "693507183352",
  appId: "1:693507183352:web:7a8b3e8d0e9c6a4f5d6e7f",
};

// Initialize Firebase app
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Lazy-loaded client-side services
let db: Firestore | null = null;
let auth: Auth | null = null;
let messaging: Messaging | null = null;

/**
 * Gets the Firestore instance, initializing it only on the client-side.
 * On the server, it returns a mock object to prevent crashes during SSR.
 */
export function getClientDb(): Firestore {
  if (typeof window !== 'undefined') {
    if (!db) {
      db = getFirestore(app);
    }
    return db;
  }
  // Return a mock/dummy object for server-side rendering
  return {} as Firestore;
}

/**
 * Gets the Auth instance, initializing it only on the client-side.
 * On the server, it returns a mock object to prevent crashes during SSR.
 */
export function getClientAuth(): Auth {
  if (typeof window !== 'undefined') {
    if (!auth) {
      auth = getAuth(app);
    }
    return auth;
  }
  // Return a mock/dummy object for server-side rendering
  return {} as Auth;
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

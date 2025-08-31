
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AlZaSyDrev3-idwKsbpZI8UL9MT-GHssblaEuo4",
  authDomain: "myf.cobillingsystemapp.firebaseapp.com",
  projectId: "myf.cobillingsystemapp",
  storageBucket: "myf.cobillingsystemapp.appspot.com",
  messagingSenderId: "693507183352",
  appId: "1:693507183352:web:7a8b3e8d0e9c6a4f5d6e7f",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);

// Lazy initialization for client-side services
let auth: Auth;
let messaging: Messaging | null;

function getClientAuth() {
  if (typeof window !== 'undefined') {
    if (!auth) {
      auth = getAuth(app);
    }
    return auth;
  }
  return {} as Auth; // Return a dummy object for server-side
}

function getClientMessaging() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        if (!messaging) {
            messaging = getMessaging(app);
        }
        return messaging;
    }
    return null;
}


export { app, db, getClientAuth, getClientMessaging };

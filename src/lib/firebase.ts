
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "swiftsale-ewd7o.firebaseapp.com",
  projectId: "swiftsale-ewd7o",
  storageBucket: "swiftsale-ewd7o.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};


const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let db: Firestore | null = null;

export function getClientDb(): Firestore | null {
  if (typeof window !== 'undefined') {
    if (!db) {
      db = getFirestore(app);
    }
    return db;
  }
  return null;
}

export const getClientMessaging = () => {
    if (typeof window !== 'undefined' && typeof self.indexedDB !== 'undefined') {
        return getMessaging(app);
    }
    return null;
}


export { app };

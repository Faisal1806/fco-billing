
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "swiftsale-ewd7o.firebaseapp.com",
  projectId: "swiftsale-ewd7o",
  storageBucket: "swiftsale-ewd7o.appspot.com",
  messagingSenderId: "596325992913",
  appId: "1:596325992913:web:e37529452a3637a898b31d",
};


const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let db: Firestore | null = null;

export function getClientDb(): Firestore {
    if (!db) {
      db = getFirestore(app);
    }
    return db;
}

export const getClientMessaging = () => {
    if (typeof window !== 'undefined' && typeof self.indexedDB !== 'undefined') {
        return getMessaging(app);
    }
    return null;
}


export { app };

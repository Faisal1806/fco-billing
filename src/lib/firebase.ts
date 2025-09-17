
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getMessaging, Messaging } from 'firebase/messaging';
import { getDatabase, Database } from "firebase/database";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "swiftsale-ewd7o",
  "appId": "1:693507183352:web:62935a0e75eb4a261e610d",
  "storageBucket": "swiftsale-ewd7o.appspot.com",
  "apiKey": "AIzaSyDreV3-idwKsbpZI8UL9MT_GHssbLaEUo4",
  "authDomain": "swiftsale-ewd7o.firebaseapp.com",
  "measurementId": "G-F7TTL0TYRC",
  "messagingSenderId": "693507183352"
};


const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let db: Firestore | null = null;
let rtdb: Database | null = null;
let messaging: Messaging | null = null;
let storage: FirebaseStorage | null = null;


export function getClientDb(): Firestore {
    if (!db) {
      db = getFirestore(app);
    }
    return db;
}

export function getClientStorage(): FirebaseStorage {
    if (!storage) {
        storage = getStorage(app);
    }
    return storage;
}

export function getRealtimeDb(): Database {
    if (!rtdb) {
      rtdb = getDatabase(app);
    }
    return rtdb;
}

export const getClientMessaging = () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        if (!messaging) {
            messaging = getMessaging(app);
        }
        return messaging;
    }
    return null;
}


export { app, firebaseConfig };


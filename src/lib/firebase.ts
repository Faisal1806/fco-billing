
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

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

const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;


export { auth, db, messaging };

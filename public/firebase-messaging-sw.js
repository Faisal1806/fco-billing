// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  "projectId": "swiftsale-ewd7o",
  "appId": "1:693507183352:web:62935a0e75eb4a261e610d",
  "storageBucket": "swiftsale-ewd7o.appspot.com",
  "apiKey": "AIzaSyDreV3-idwKsbpZI8UL9MT_GHssbLaEUo4",
  "authDomain": "swiftsale-ewd7o.firebaseapp.com",
  "measurementId": "G-F7TTL0TYRC",
  "messagingSenderId": "693507183352"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
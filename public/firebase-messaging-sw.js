
// This file is intentionally left almost empty.
// It's required for Firebase Cloud Messaging to work in the background.

// Scripts for Firebase products will be imported and initialized automatically
// by the Firebase JS SDKs if they are needed.

// For example, if you use Firebase Analytics, the SDK will automatically
// import and initialize the necessary scripts for you.

// You can add custom service worker logic here if needed.
// See: https://firebase.google.com/docs/cloud-messaging/js/receive

console.log("Firebase Messaging Service Worker registered.");

// In a real application, you would import the firebase scripts and initialize
// importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// const firebaseConfig = {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...",
//   appId: "..."
// };

// firebase.initializeApp(firebaseConfig);
// const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//   console.log('[firebase-messaging-sw.js] Received background message ', payload);
//   // Customize notification here
//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/firebase-logo.png'
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

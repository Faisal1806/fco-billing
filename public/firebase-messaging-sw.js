
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// "Default" Firebase configuration (prevents errors)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "swiftsale-ewd7o.firebaseapp.com",
  projectId: "swiftsale-ewd7o",
  storageBucket: "swiftsale-ewd7o.appspot.com",
  messagingSenderId: "596325992913",
  appId: "1:596325992913:web:e37529452a3637a898b31d",
  databaseURL: "https://swiftsale-ewd7o-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Make sure you have a logo.png in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

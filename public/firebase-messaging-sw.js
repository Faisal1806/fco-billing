// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDreV3-idwKsbpZI8UL9MT_GHssbLaEUo4",
  authDomain: "swiftsale-ewd7o.firebaseapp.com",
  projectId: "swiftsale-ewd7o",
  storageBucket: "swiftsale-ewd7o.appspot.com",
  messagingSenderId: "693507183352",
  appId: "1:693507183352:web:62935a0e75eb4a261e610d",
  measurementId: "G-F7TTL0TYRC",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

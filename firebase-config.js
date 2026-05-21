// =========================================================================
// FIREBASE CONFIGURATION
// =========================================================================
// TODO: Replace the 'firebaseConfig' object below with the one from your 
// Firebase Console (Project Settings > General > Web App).
const firebaseConfig = {
    apiKey: "AIzaSyCk2jNvtHuSJz4dKETnBENb_e0CYNKLZxQ",
    authDomain: "helainvest-platform.firebaseapp.com",
    projectId: "helainvest-platform",
    storageBucket: "helainvest-platform.firebasestorage.app",
    messagingSenderId: "446896860107",
    appId: "1:446896860107:web:c173bd621a489f2ee1a44e",
    measurementId: "G-NBQDM01JSX"
};

// Check if the user has replaced the placeholder
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

if (isFirebaseConfigured) {
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} else {
    console.warn("Firebase is not configured yet. Please update firebase-config.js with your credentials.");
}

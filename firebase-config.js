// =========================================================================
// FIREBASE CONFIGURATION
// =========================================================================
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

let db = null;
let auth = null;

try {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured) {
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        auth = firebase.auth();
        // Configure firestore to allow offline caching (optional but good)
        db.settings({
          cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        });
    } else {
        console.warn("Firebase is not loaded or not configured. Running in local fallback mode.");
    }
} catch (e) {
    console.error("Error initializing Firebase:", e);
}

// Make them available globally
window.db = db;
window.auth = auth;

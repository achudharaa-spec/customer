import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, serverTimestamp, connectFirestoreEmulator } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

function validateUserFirebaseConfig(cfg) {
  const missing = [];
  if (!cfg.apiKey || cfg.apiKey.includes('your_')) missing.push('VITE_FIREBASE_API_KEY');
  if (!cfg.projectId || cfg.projectId.includes('your_')) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!cfg.authDomain || cfg.authDomain.includes('your_')) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!cfg.appId || cfg.appId.includes('your_')) missing.push('VITE_FIREBASE_APP_ID');

  if (missing.length > 0) {
    console.warn(
      `🚨 [Customer Portal] Missing or unconfigured credentials in surya-tex-user/.env:\n` +
      missing.map((v) => `   - ${v}`).join('\n') +
      `\nPlease paste your Firebase Web App keys into surya-tex-user/.env.`
    );
  }
}
validateUserFirebaseConfig(firebaseConfig);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Connect to local Firestore emulator only when explicitly enabled in local development
if (typeof window !== "undefined" && import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch (e) {
    // Ignore already connected warnings
  }
}

// Initialize App Check for Domain & Bot Protection if site key present
if (typeof window !== "undefined" && window.location.hostname !== "localhost" && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn("App Check initialization notice:", err.message);
  }
}

export { collection, onSnapshot, addDoc, doc, setDoc, serverTimestamp };
export default app;

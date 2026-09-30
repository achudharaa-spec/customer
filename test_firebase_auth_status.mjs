import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCSVAnZjVWMBbLxXTZnVgDMewBRzZK_guA",
  authDomain: "sirsuryatex.firebaseapp.com",
  projectId: "sirsuryatex",
  storageBucket: "sirsuryatex.firebasestorage.app",
  messagingSenderId: "57502203829",
  appId: "1:57502203829:web:4b7696fab4db9b3a4063fc",
  measurementId: "G-VD24YT7TL7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function diagnose() {
  console.log("🔍 Checking Firebase Auth & Firestore on project 'sirsuryatex'...\n");

  // 1. Try Signing in with email & password
  console.log("1. Attempting signInWithEmailAndPassword with achudharaa@gmail.com...");
  try {
    const cred = await signInWithEmailAndPassword(auth, "achudharaa@gmail.com", "SriSuryaTex@2026");
    console.log("   ✅ User signed in! UID:", cred.user.uid);
  } catch (err) {
    console.log("   ❌ signIn failed:", err.code, "-", err.message);

    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      console.log("\n2. User does not exist yet. Attempting to create user with createUserWithEmailAndPassword...");
      try {
        const newCred = await createUserWithEmailAndPassword(auth, "achudharaa@gmail.com", "SriSuryaTex@2026");
        console.log("   ✅ Created new user in Firebase Auth! UID:", newCred.user.uid);
      } catch (createErr) {
        console.log("   ❌ createUser failed:", createErr.code, "-", createErr.message);
      }
    }
  }

  // 2. Try anonymous sign in
  console.log("\n3. Testing anonymous authentication...");
  try {
    const anon = await signInAnonymously(auth);
    console.log("   ✅ Anonymous auth allowed! UID:", anon.user.uid);
  } catch (anonErr) {
    console.log("   ❌ Anonymous auth failed:", anonErr.code, "-", anonErr.message);
  }

  // 3. Try Firestore with current auth state
  console.log("\n4. Testing Firestore read with current auth state (User:", auth.currentUser?.email || auth.currentUser?.uid || "None", ")...");
  try {
    const snap = await getDocs(collection(db, "products"));
    console.log("   ✅ Firestore read succeeded! Documents found:", snap.size);
    
    // Try adding a test doc
    const newDoc = await addDoc(collection(db, "products"), {
      title: "Diagnostic Test Mat",
      createdAt: new Date().toISOString()
    });
    console.log("   ✅ Firestore write succeeded! Doc ID:", newDoc.id);
  } catch (fsErr) {
    console.log("   ❌ Firestore operation failed:", fsErr.code, "-", fsErr.message);
  }
}

diagnose();

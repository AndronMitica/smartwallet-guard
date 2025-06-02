import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBc9GXXGrq2WGk2aa3ybtnrDzjX9Cb8FNc",
    authDomain: "smartwallet-guard.firebaseapp.com",
    projectId: "smartwallet-guard",
    storageBucket: "smartwallet-guard.firebasestorage.app",
    messagingSenderId: "1058901399161",
    appId: "1:1058901399161:web:b3039c800f77dc26b5a6a8"
  };

// Inițializează Firebase
const app = initializeApp(firebaseConfig);

// Inițializează autentificarea și baza de date
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Export corect
export { auth, db };

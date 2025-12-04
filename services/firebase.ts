// @ts-ignore
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración directa con las credenciales proporcionadas.
// Esto soluciona el error "auth/invalid-api-key" inmediatamente.
const firebaseConfig = {
  apiKey: "AIzaSyDZ0tu9CZfUhbLtsm8G2D2K_C4GH0Aahfc",
  authDomain: "sigha-4f6d6.firebaseapp.com",
  projectId: "sigha-4f6d6",
  storageBucket: "sigha-4f6d6.firebasestorage.app",
  messagingSenderId: "820284445392",
  appId: "1:820284445392:web:78671ff06e6a6ef582c4d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);
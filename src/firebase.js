import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjjEBoZlwGRiK--liHYZR9gfDK4CG4tC0",
  authDomain: "fintrack-1d6b2.firebaseapp.com",
  projectId: "fintrack-1d6b2",
  storageBucket: "fintrack-1d6b2.firebasestorage.app",
  messagingSenderId: "265893100569",
  appId: "1:265893100569:web:da3ea51053cf106ed97e88",
  measurementId: "G-LXQ834JF13"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

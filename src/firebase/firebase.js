// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔴 YOUR FIREBASE CONFIG (same as old project)
const firebaseConfig = {
  apiKey: "AIzaSyCJp0P15cONlPzzfO8oextNscd6JMucPD8",
  authDomain: "warehouse-inventory-mana-9ac21.firebaseapp.com", 
  projectId: "warehouse-inventory-mana-9ac21",
  storageBucket: "warehouse-inventory-mana-9ac21.firebasestorage.app",
  messagingSenderId: "716351494692",
  appId: "1:716351494692:web:e3732375d25234cc8a56b1",
  measurementId: "G-T2LTTR3ZF4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const db = getFirestore(app);
export const auth = getAuth(app);

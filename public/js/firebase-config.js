import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0X7b7HPO1nCgCNfSgDqvynM4PxIirGds",
  authDomain: "ledmessager-87e29.firebaseapp.com",
  databaseURL: "https://ledmessager-87e29-default-rtdb.firebaseio.com",
  projectId: "ledmessager-87e29",
  storageBucket: "ledmessager-87e29.firebasestorage.app",
  messagingSenderId: "438243290514",
  appId: "1:438243290514:web:239cac7412dceafc25a54b",
  measurementId: "G-T8PZQ43GG1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
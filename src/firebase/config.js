import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC66GPvdwaPu7Zulcp-xcAQPzvLuVfvHH0",
  authDomain: "claog-a7cf5.firebaseapp.com",
  projectId: "claog-a7cf5",
  storageBucket: "claog-a7cf5.firebasestorage.app",
  messagingSenderId: "876741238848",
  appId: "1:876741238848:web:e00f74a99a6c0bbaa0ffa5",
  measurementId: "G-5MFFY7PV5Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;

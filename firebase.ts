import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC7WpqfMdGwiT9DPCHZYZxupnT4a2uPEYI",
  authDomain: "kelimeci-53b57.firebaseapp.com",
  projectId: "kelimeci-53b57",
  storageBucket: "kelimeci-53b57.firebasestorage.app",
  messagingSenderId: "583469597201",
  appId: "1:583469597201:web:0ac6e908cdbe345e0b27b0",
  measurementId: "G-6CV8V6VVXG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);

export default app;
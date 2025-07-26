import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDsPa9C_gqsF_XBvPRmfIqQCXhauZPxQwM",
  authDomain: "temple-website-7015b.firebaseapp.com",
  projectId: "temple-website-7015b",
  storageBucket: "temple-website-7015b.appspot.com",
  messagingSenderId: "898288185097",
  appId: "1:898288185097:web:a55f533b46da2ae3ce6dd8",
  measurementId: "G-6W2MMNRMWJ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
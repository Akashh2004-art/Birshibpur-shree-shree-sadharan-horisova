import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDsPa9C_gqsF_XBvPRmfIqQCXhauZPxQwM",
  authDomain: "temple-website-7015b.firebaseapp.com",
  projectId: "temple-website-7015b",
  storageBucket: "temple-website-7015b.appspot.com",
  messagingSenderId: "898288185097",
  appId: "1:898288185097:web:a55f533b46da2ae3ce6dd8",
  measurementId: "G-6W2MMNRMWJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export { RecaptchaVerifier, signInWithPhoneNumber };

export default app;
import { FC } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface GoogleSignInButtonProps {
  onSuccess: (userData: any) => void;
  onError: (error: any) => void;
}

const signUpWithGoogle: FC<GoogleSignInButtonProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  
  const handleGoogleSignIn = async () => {
    try {
      console.log("1️⃣ Starting Google Sign In...");

      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);
      const { email, displayName } = result.user;
      console.log("2️⃣ Google Sign In Success:", { email, name: displayName });

      // Get the ID token
      const idToken = await result.user.getIdToken();
      console.log("3️⃣ 🔑 ID Token Received");

      // Backend API URL
      const apiUrl = "http://localhost:5000/api/user/google-signup";
      console.log("4️⃣ Sending request to:", apiUrl);
      
      const response = await axios.post(
        apiUrl,
        { token: idToken },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("5️⃣ 📩 Server Response:", response.data);
      const { success, user, tempUser, token, needsPassword } = response.data;

      if (success) {
        console.log("✅ Authentication successful, proceeding...");
        
        if (needsPassword) {
          // Store temporary user data in localStorage or sessionStorage
          sessionStorage.setItem("tempUserData", JSON.stringify(tempUser || user));
          
          // Redirect to set password page
          navigate('/set-password');
        } else {
          // User already exists and has a password
          // Store token in localStorage for persistent login (1 year)
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("loginTime", Date.now().toString());
          onSuccess({ user, token });
        }
      } else {
        throw new Error(response.data.message || "Google সাইন আপ ব্যর্থ হয়েছে");
      }
    } catch (error: any) {
      console.error("❌ Google sign-in error:", error);
      const errorMessage = error.response?.data?.message || "Google সাইন আপ ব্যর্থ হয়েছে। আবার চেষ্টা করুন!";
      onError(errorMessage);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
    >
      <svg
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      Google দিয়ে সাইন ইন করুন
    </button>
  );
};

export default signUpWithGoogle;
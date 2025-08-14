import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SignUpWithGoogle from "../components/signUpWithGoogle";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithGoogleToken } = useAuth(); // ✅ Use the new method
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (userData: any) => {
    try {
      console.log("✅ Google login successful:", userData);
      setError("");
      setLoading(true);
      
      // Use the AuthContext method to store user data
      await loginWithGoogleToken(userData.token, userData.user);
      
      navigate("/");
    } catch (err) {
      console.error("❌ Error in handleGoogleSuccess:", err);
      setError("লগইন সম্পূর্ণ করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("❌ Google login error:", error);
    setError(typeof error === 'string' ? error : "Google লগইন ব্যর্থ হয়েছে");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">লগইন করুন</h2>
          <p className="mt-2 text-gray-600">
            Google অ্যাকাউন্ট দিয়ে সহজেই লগইন করুন
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            লগইন সম্পূর্ণ করা হচ্ছে...
          </div>
        )}

        <div className="space-y-6">
          <SignUpWithGoogle 
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            নতুন user হলে automatically account তৈরি হয়ে যাবে! 🎉
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
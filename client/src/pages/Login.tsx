import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "", // Email বা Phone এখানে আসবে
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to true for 1-year login
  const [showPassword, setShowPassword] = useState(false); // Password show/hide state

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError("");
  
    if (!formData.identifier || !formData.password) {
      setError("ইমেইল/ফোন এবং পাসওয়ার্ড দরকার");
      return;
    }
  
    try {
      setLoading(true);
      await login(formData.identifier.trim(), formData.password);
      navigate("/");
    } catch (err) {
      setError("লগইন তথ্য সঠিক নয়");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">🕉️</div>
        <div className="absolute top-32 right-20 text-4xl">🪔</div>
        <div className="absolute bottom-32 left-20 text-5xl">🏛️</div>
        <div className="absolute bottom-10 right-10 text-4xl">🙏</div>
        <div className="absolute top-1/2 left-1/4 text-3xl">🌸</div>
        <div className="absolute top-1/4 right-1/3 text-4xl">📿</div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo/Header Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg mb-4">
              <span className="text-4xl">🏛️</span>
            </div>
            <p className="text-gray-600">আপনার অ্যাকাউন্টে লগইন করুন</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
            {/* Decorative Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400"></div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">স্বাগতম</h3>
              <p className="text-gray-600">
                নতুন ব্যবহারকারী?{" "}
                <Link 
                  to="/signup" 
                  className="text-orange-500 hover:text-orange-600 font-medium transition-colors duration-200 hover:underline"
                >
                  এখানে নিবন্ধন করুন
                </Link>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center animate-pulse">
                <span className="text-xl mr-2">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="identifier" className="block text-gray-700 mb-2 font-medium">
                    📧 ইমেইল বা ফোন নম্বর
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    required
                    placeholder="example@example.com অথবা +919XXXXXXXXX"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 bg-white/50"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-gray-700 mb-2 font-medium">
                    🔒 পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="আপনার পাসওয়ার্ড দিন"
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 bg-white/50"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <span className="text-xl">👁️</span>
                      ) : (
                        <span className="text-xl">👁️‍🗨️</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember_me"
                    type="checkbox"
                    className="h-4 w-4 text-orange-500 focus:ring-orange-400 border-gray-300 rounded transition-colors duration-200"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="remember_me" className="ml-2 block text-gray-700 font-medium">
                    মনে রাখুন
                  </label>
                </div>

                <Link 
                  to="/forgot-password" 
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors duration-200 hover:underline"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform
                  ${loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-lg active:scale-95'
                  } 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
              >
                <div className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>লগইন হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚪</span>
                      লগইন করুন
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Decorative Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
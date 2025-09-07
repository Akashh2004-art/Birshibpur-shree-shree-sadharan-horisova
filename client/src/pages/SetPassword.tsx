import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface TempUserData {
  name: string;
  email: string;
  [key: string]: any;
}

const SetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [tempUserData, setTempUserData] = useState<TempUserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const tempData = sessionStorage.getItem('tempUserData');
    if (!tempData) {
      navigate('/login');
      return;
    }
    try {
      setTempUserData(JSON.parse(tempData));
    } catch (err) {
      console.error('Invalid temp user data:', err);
      navigate('/login');
    }
  }, [navigate]);

  const checkPhoneNumber = async (number: string) => {
    if (number.length === 10) {
      setCheckingPhone(true);

      try {
        const response = await axios.post('http://localhost:5000/api/user-auth/check-phone', {
          phone: `+91${number}`
        });
        setPhoneValid(!response.data.exists);

        if (response.data.exists) {
          setError('This phone number is already in use.');
        } else {
          setError('');
        }
      } catch (err: any) {
        setPhoneValid(false);
        if (err.response?.status !== 404) {
          setError('There was a problem verifying the phone number.');
        }
      } finally {
        setCheckingPhone(false);
      }
    } else {
      setPhoneValid(false);
      setError('');
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password.length < 6) {
      setError('Password should be at least 6 characters ');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password does not match');
      return;
    }
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      if (!tempUserData || !tempUserData.email) {
        throw new Error('No email found');
      }

      const response = await axios.post('http://localhost:5000/api/user-auth/complete-google-signup', {
        ...tempUserData,
        phone: `+91${phone}`,
        password
      });

      if (response.data.success) {
        sessionStorage.removeItem('tempUserData');
        setSuccessMessage('🎉 Password set successfully! Login now.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'There was a problem completing signup');
      }
    } catch (err: any) {
      console.error('Password setup error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'There was a problem setting the password.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!tempUserData) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">🔐</div>
        <div className="absolute top-32 right-20 text-4xl">🪔</div>
        <div className="absolute bottom-32 left-20 text-5xl">🏛️</div>
        <div className="absolute bottom-10 right-10 text-4xl">🙏</div>
        <div className="absolute top-1/2 left-1/4 text-3xl">🌸</div>
        <div className="absolute top-1/4 right-1/3 text-4xl">📿</div>
        <div className="absolute top-3/4 right-1/4 text-3xl">🕉️</div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo/Header Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg mb-4">
              <span className="text-4xl">🔐</span>
            </div>
            <p className="text-gray-600">আপনার অ্যাকাউন্ট সুরক্ষিত করুন</p>
          </div>

          {/* Password Setup Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400"></div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">স্বাগতম!</h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <p className="text-gray-700">
                  <span className="font-semibold text-blue-600">{tempUserData.name}</span>,
                  আপনার অ্যাকাউন্ট সম্পূর্ণ করতে নিচের তথ্য দিন।
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center animate-pulse">
                <span className="text-xl mr-2">⚠️</span>
                <div>
                  <p className="font-medium">Problem!</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center animate-bounce">
                <span className="text-xl mr-2">✅</span>
                <div>
                  <p className="font-medium">Successful</p>
                  <p className="text-sm">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number Field */}
              <div>
                <label htmlFor="phone" className="block text-gray-700 mb-2 font-medium">
                  📱 ফোন নম্বর
                </label>
                <div className={`relative flex items-center border-2 rounded-xl transition-all duration-200 ${
                  checkingPhone 
                    ? 'border-yellow-400 bg-yellow-50' 
                    : phone.length === 10 && phoneValid 
                      ? 'border-green-400 bg-green-50' 
                      : phone.length === 10 && !phoneValid 
                        ? 'border-red-400 bg-red-50' 
                        : 'border-gray-200 bg-white/50'
                }`}>
                  <span className="pl-4 pr-2 text-gray-600 font-medium">+91</span>
                  <input 
                    id="phone" 
                    type="tel" 
                    required 
                    maxLength={10}
                    pattern="[0-9]{10}"
                    placeholder="১০ সংখ্যার ফোন নম্বর" 
                    className="flex-1 px-3 py-3 border-none bg-transparent focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400"
                    value={phone} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setPhone(value);
                      if (value.length === 10) {
                        checkPhoneNumber(value);
                      } else {
                        setPhoneValid(false);
                        setError('');
                      }
                    }}
                    disabled={loading}
                  />
                  
                  {/* Phone Validation Icons */}
                  <div className="pr-4">
                    {checkingPhone ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                    ) : phone.length === 10 ? (
                      phoneValid ? (
                        <span className="text-green-600 text-xl">✅</span>
                      ) : (
                        <span className="text-red-600 text-xl">❌</span>
                      )
                    ) : null}
                  </div>
                </div>
                
                {phone.length === 10 && !checkingPhone && (
                  <p className={`text-sm mt-1 ${phoneValid ? 'text-green-600' : 'text-red-600'}`}>
                    {phoneValid ? '✅ Phone number available' : '❌ This number is already used'}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-gray-700 mb-2 font-medium">
                  🔒 নতুন পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    required 
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 bg-white/50"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="text-gray-400 hover:text-gray-600 text-xl transition-colors">
                      {showPassword ? '🙈' : '👁️'}
                    </span>
                  </button>
                </div>
                {password && (
                  <div className="mt-1">
                    <div className={`text-xs ${password.length >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                      {password.length >= 6 ? '✅ Strong password' : `❌ ${6 - password.length} More characters needed`}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirm-password" className="block text-gray-700 mb-2 font-medium">
                  🔁 পাসওয়ার্ড নিশ্চিত করুন
                </label>
                <div className="relative">
                  <input 
                    id="confirm-password" 
                    name="confirm-password" 
                    type={showConfirmPassword ? "text" : "password"}
                    required 
                    placeholder="পাসওয়ার্ড আবার লিখুন"
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 bg-white/50"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <span className="text-gray-400 hover:text-gray-600 text-xl transition-colors">
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </span>
                  </button>
                </div>
                {confirmPassword && (
                  <div className="mt-1">
                    <div className={`text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                      {password === confirmPassword ? '✅ Password matched' : '❌ Password not matchnot match'}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading || checkingPhone || !phoneValid || phone.length !== 10 || password.length < 6 || password !== confirmPassword}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform
                  ${loading || checkingPhone || !phoneValid || phone.length !== 10 || password.length < 6 || password !== confirmPassword
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-lg active:scale-95'
                  } 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
              >
                <div className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Setting up...</span>
                    </>
                  ) : checkingPhone ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Verifying phone...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      পাসওয়ার্ড সেট করুন
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="mr-2">🛡️</span>
                  নিরাপত্তা নোট
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>🔸 পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে</li>
                  <li>🔸 ফোন নম্বর যাচাই করা আবশ্যক</li>
                  <li>🔸 আপনার তথ্য সম্পূর্ণ নিরাপদ</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                🙏 আপনার নিরাপত্তা আমাদের অগ্রাধিকার
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
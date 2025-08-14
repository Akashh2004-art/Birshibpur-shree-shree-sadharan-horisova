import { useState, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyOTP, setNewPassword } from '../utils/api';
import { validatePassword } from '../utils/validate';

const ResetPassword = () => {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { emailOrPhone } = location.state || {}; // isPhone বাদ দেওয়া হয়েছে

  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 6) {
      setError('সঠিক OTP দিন (৬ সংখ্যার)');
      return;
    }

    try {
      setLoading(true);
      const response = await verifyOTP(emailOrPhone, otp);
      if (response.success) {
        setIsOtpVerified(true);
      } else {
        setError(response.message || 'ভুল OTP');
      }
    } catch (err) {
      setError('OTP ভেরিফাই করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!emailOrPhone || !otp || !password) {
      setError('ইমেইল, OTP, এবং পাসওয়ার্ড আবশ্যক');
      return;
    }

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না');
      return;
    }

    if (!validatePassword(password)) {
      setError('পাসওয়ার্ডে কমপক্ষে ৮ অক্ষর, বড়/ছোট হাতের অক্ষর, সংখ্যা, এবং বিশেষ অক্ষর প্রয়োজন');
      return;
    }

    try {
      setLoading(true);
      const response = await setNewPassword(emailOrPhone, otp, password);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.message || 'পাসওয়ার্ড সেট করতে সমস্যা');
      }
    } catch (err) {
      setError('কিছু সমস্যা হয়েছে। পরে চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (!emailOrPhone) {
    navigate('/forgot-password');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">পাসওয়ার্ড রিসেট করুন</h2>
          <p className="mt-2 text-gray-600">
            {isOtpVerified ? 'নতুন পাসওয়ার্ড সেট করুন' : 'আপনার ইমেইলে পাঠানো OTP দিন'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {success ? (
          <div className="bg-green-100 text-green-700 p-4 rounded-lg">
            পাসওয়ার্ড সফলভাবে সেট হয়েছে। লগইন পেজে যাচ্ছি...
          </div>
        ) : (
          <>
            {!isOtpVerified ? (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-gray-700 mb-2">OTP</label>
                  <input
                    id="otp"
                    type="text"
                    required
                    placeholder="৬ সংখ্যার OTP"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400"
                >
                  {loading ? 'ভেরিফাই হচ্ছে...' : 'OTP ভেরিফাই করুন'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-gray-700 mb-2">নতুন পাসওয়ার্ড</label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
                    পাসওয়ার্ড নিশ্চিত করুন
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400"
                >
                  {loading ? 'সেট হচ্ছে...' : 'পাসওয়ার্ড সেট করুন'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
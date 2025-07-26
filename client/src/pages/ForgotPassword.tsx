import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validateEmail } from '../utils/validate';
import { sendForgotPasswordRequest } from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('সঠিক ইমেইল প্রদান করুন');
      return;
    }

    try {
      setLoading(true);
      const response = await sendForgotPasswordRequest(email);
      if (response.success) {
        navigate('/reset-password', { state: { emailOrPhone: email, isPhone: false } });
      } else {
        setError(response.message || 'OTP পাঠাতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      console.error('OTP পাঠাতে সমস্যা:', err);
      setError(err.message || 'কিছু সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">পাসওয়ার্ড পুনরুদ্ধার</h2>
          <p className="mt-2 text-gray-600">আপনার ইমেইলে OTP পাঠাবো</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-2">
              ইমেইল
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="example@gmail.com"
              className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400"
          >
            {loading ? 'OTP পাঠানো হচ্ছে...' : 'OTP পাঠান'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-orange-500 hover:text-orange-600">লগইন পেজে ফিরে যান</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
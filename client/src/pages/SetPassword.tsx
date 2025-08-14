import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingPhone, setCheckingPhone] = useState<boolean>(false);
  const [phoneValid, setPhoneValid] = useState<boolean>(false);
  const [tempUserData, setTempUserData] = useState<any>(null);

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
      console.log("📞 ফোন নম্বর চেক করা শুরু...", number);

      try {
        const response = await axios.post('http://localhost:5000/api/user-auth/check-phone', { 
          phone: `+91${number}` 
        });
        console.log("✅ ফোন নম্বর চেক করা শেষ! সার্ভার রেসপন্স:", response.data);
        setPhoneValid(!response.data.exists);
        
        if (response.data.exists) {
          setError('এই ফোন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে');
        } else {
          setError('');
        }
      } catch (err: any) {
        console.error('❌ ফোন নম্বর চেকিং এ সমস্যা:', err);
        setPhoneValid(false);
        if (err.response?.status !== 404) {
          setError('ফোন নম্বর যাচাই করতে সমস্যা হয়েছে');
        }
      } finally {
        console.log("🔄 ফোন চেকিং শেষ, লোডিং বন্ধ হচ্ছে...");
        setCheckingPhone(false);
      }
    } else {
      setPhoneValid(false);
      setError('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না');
      return;
    }
    if (phone.length !== 10) {
      setError('একটি বৈধ ১০ সংখ্যার ফোন নম্বর দিন');
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
        // Clear session storage
        sessionStorage.removeItem('tempUserData');
        
        // ✅ SIMPLE SOLUTION: 
        // 1. DON'T store token/user in localStorage 
        // 2. Just show success message and redirect to login
        // 3. User will need to manually login
        
        setSuccessMessage('🎉 পাসওয়ার্ড সফলভাবে সেট হয়েছে! এখন লগইন করুন।');
        
        setTimeout(() => {
          navigate('/login'); // ✅ Simple redirect to login
        }, 2000);
        
      } else {
        throw new Error(response.data.message || 'সাইন আপ সম্পূর্ণ করতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      console.error('Password setup error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'পাসওয়ার্ড সেট করতে সমস্যা হয়েছে';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!tempUserData) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">পাসওয়ার্ড সেট করুন</h2>
          <p className="mt-2 text-sm text-gray-600">
            স্বাগতম, {tempUserData.name}! আপনার অ্যাকাউন্ট সম্পূর্ণ করতে একটি পাসওয়ার্ড সেট করুন।
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              ফোন নম্বর
            </label>
            <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
              <span className="pl-4 pr-2 text-gray-600 font-medium">+91</span>
              <input 
                id="phone" 
                type="tel" 
                required 
                maxLength={10}
                pattern="[0-9]{10}"
                placeholder="১০ সংখ্যার ফোন নম্বর" 
                className="flex-1 px-3 py-3 border-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400"
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
              />
              {checkingPhone && (
                <div className="pr-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                </div>
              )}
              {phone.length === 10 && !checkingPhone && (
                <div className="pr-4">
                  {phoneValid ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              নতুন পাসওয়ার্ড
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
              পাসওয়ার্ড নিশ্চিত করুন
            </label>
            <input 
              id="confirm-password" 
              name="confirm-password" 
              type="password" 
              required 
              placeholder="পাসওয়ার্ড আবার লিখুন"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || checkingPhone || !phoneValid || phone.length !== 10}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                অপেক্ষা করুন...
              </span>
            ) : (
              'পাসওয়ার্ড সেট করুন'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
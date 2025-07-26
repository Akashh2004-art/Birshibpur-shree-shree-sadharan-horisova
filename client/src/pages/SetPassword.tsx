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
  const [, setCheckingPhone] = useState<boolean>(false);
  const [, setPhoneValid] = useState<boolean>(false);
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
        // সার্ভারে ফোন নম্বর ভ্যালিডেশন এবং ডুপ্লিকেট চেক
        const response = await axios.post('http://localhost:5000/api/user/check-phone', { phone: `+91${number}` });
        console.log("✅ ফোন নম্বর চেক করা শেষ! সার্ভার রেসপন্স:", response.data);
        setPhoneValid(!response.data.exists); // যদি ডাটাবেসে না থাকে, তবে বৈধ
      } catch (err) {
        console.error('❌ ফোন নম্বর চেকিং এ সমস্যা:', err);
        setPhoneValid(false);
      } finally {
        console.log("🔄 ফোন চেকিং শেষ, লোডিং বন্ধ হচ্ছে...");
        setCheckingPhone(false);
      }
    } else {
      setPhoneValid(false);
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
    
    try {
      setLoading(true);
      if (!tempUserData || !tempUserData.email) {
        throw new Error('No email found');
      }
      const response = await axios.post('http://localhost:5000/api/user/complete-google-signup', {
        ...tempUserData,
        phone: `+91${phone}`,
        password
      });
      
      if (response.data.success) {
        sessionStorage.removeItem('tempUserData');
        localStorage.setItem('token', response.data.token);
        setSuccessMessage('🎉 পাসওয়ার্ড সফলভাবে সেট হয়েছে!');
        setTimeout(() => navigate('/login'), 1800);
      } else {
        throw new Error(response.data.message || 'সাইন আপ সম্পূর্ণ করতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      console.error('Password setup error:', err);
      setError(err.message || 'পাসওয়ার্ড সেট করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (!tempUserData) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">পাসওয়ার্ড সেট করুন</h2>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
        {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-gray-700">ফোন নম্বর</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 focus-within:border-orange-500">
              <span className="mr-4 text-gray-600">+91</span>
              <input id="phone" type="tel" required maxLength={10} placeholder="ফোন নম্বর দিন" 
                className="w-full px-3 py-2 border-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400"
                value={phone} onChange={(e) => {
                  setPhone(e.target.value);
                  checkPhoneNumber(e.target.value);
                }}
              />
            </div>

          </div>

          <div>
            <input id="password" name="password" type="password" required placeholder="নতুন পাসওয়ার্ড"
              className="w-full px-3 py-2 border rounded-lg" value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <input id="confirm-password" name="confirm-password" type="password" required placeholder="পাসওয়ার্ড নিশ্চিত করুন"
              className="w-full px-3 py-2 border rounded-lg" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400">
            {loading ? 'অপেক্ষা করুন...' : 'পাসওয়ার্ড সেট করুন'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;


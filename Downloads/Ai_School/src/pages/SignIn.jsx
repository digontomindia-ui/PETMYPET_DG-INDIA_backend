import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { sendLoginOtp } from '../api/auth';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('Captcha solved');
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        }
      });
    }
  };

  const handlePhoneSignIn = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!phone || phone.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }

      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      // 1. Check if user exists on backend FIRST
      try {
        await sendLoginOtp(formattedPhone);
      } catch (err) {
        const msg = err.response?.data?.message || 'User does not exist. Please register first.';
        setError(msg);
        return;
      }

      // 2. ONLY IF backend check passes, continue with Firebase flow
      // Initialize reCAPTCHA
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;

      // Start Firebase Phone Auth
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

      // Store confirmationResult globally for the OTP page
      window.confirmationResult = confirmationResult;

      // Store login data for OTP page
      sessionStorage.setItem('pendingLogin', JSON.stringify({
        phone: formattedPhone,
        purpose: 'login'
      }));

      navigate('/otp');
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      const msg = err.code === 'auth/invalid-phone-number'
        ? 'Invalid phone number format.'
        : (err.response?.data?.message || err.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">

      {/* Desktop Side Panel */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-linear-to-br from-purple-600/10 to-blue-500/10">
        <div className="z-10">
          <Logo />
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome back!</h2>
          <p className="text-gray-600 text-lg">Start your learning journey today.</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col h-full bg-white relative"
      >
        {/* Mobile Header */}
        <div className="md:hidden shrink-0 scale-90 origin-top opacity-80 p-4">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col px-8 pt-4 md:px-16 md:justify-center">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-purple-600 inline-block">Get Started now</h2>
            <p className="text-gray-400 text-sm mt-2">
              Enter your phone number to sign in
            </p>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          <form className="space-y-6" onSubmit={handlePhoneSignIn}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Phone Number</label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-purple-500/20">
                <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
                  <span className="text-lg">🇮🇳</span>
                  <span className="text-gray-500 font-medium text-sm">▼</span>
                </div>
                <span className="text-gray-500 font-medium">(+91)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="bg-transparent w-full text-gray-800 font-medium focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 active:scale-[0.98] transform disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Request OTP'}
            </button>
            <div id="recaptcha-container"></div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500 font-medium pb-8 md:pb-0">
            Don't have an account? <button onClick={() => navigate('/signup')} className="text-purple-600 hover:underline">Sign Up</button>
          </div>
          <div className="md:hidden flex justify-center mt-auto pb-6">
            <div className="w-32 h-1.5 bg-gray-900 rounded-full opacity-10"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { verifyOtpAndRegister, verifyOtpAndLogin, sendOtp, sendLoginOtp } from '../api/auth';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function Otp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef([]);

  // Determine if this is login or registration
  const pendingLogin = JSON.parse(sessionStorage.getItem('pendingLogin') || 'null');
  const pendingRegistration = JSON.parse(sessionStorage.getItem('pendingRegistration') || 'null');
  const isLogin = !!pendingLogin;
  const phone = isLogin ? pendingLogin?.phone : pendingRegistration?.phone;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  useEffect(() => {
    if (!phone) {
      console.warn('Mission session data, redirecting to sign-in');
      navigate('/signin', { replace: true });
      return;
    }

    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [navigate, phone]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length, 5);
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex].focus();
      }
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      const otpString = otp.join('');
      if (otpString.length !== 6) {
        setError('Please enter a 6-digit OTP');
        return;
      }

      let idToken;

      // 1. Verify OTP with Firebase to get idToken
      if (window.confirmationResult) {
        try {
          const result = await window.confirmationResult.confirm(otpString);
          idToken = await result.user.getIdToken();
        } catch (firebaseErr) {
          console.error('Firebase OTP Verification Failed:', firebaseErr);
          throw new Error('Invalid or expired OTP. Please try again.');
        }
      } else if (import.meta.env.MODE === 'development') {
        // Fallback for development if confirmationResult is missing but we're testing
        setError('Verification session expired. Please request a new OTP.');
        return;
      }

      if (isLogin) {
        // 2. Login flow with Backend using the idToken
        const result = await verifyOtpAndLogin({
          phone: pendingLogin.phone,
          idToken: idToken
        });
        login(result.user, result.tokens);
        sessionStorage.removeItem('pendingLogin');
      } else {
        // 2. Registration flow with Backend using the idToken
        const result = await verifyOtpAndRegister({
          phone: pendingRegistration.phone,
          idToken: idToken,
          name: pendingRegistration.name,
          email: pendingRegistration.email,
          dob: pendingRegistration.dob,
          password: pendingRegistration.password
        });
        login(result.user, result.tokens);
      }

      // Cleanup of confirmationResult happens automatically after navigate or session reset
      // We don't null it here immediately to avoid issues with re-renders if the navigate
      // is slightly delayed
      sessionStorage.removeItem('pendingRegistration');
      sessionStorage.removeItem('pendingLogin');

      // Force a small delay to let AuthContext state propagate if needed, 
      // but usually login() call above is sufficient.
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (err) {
      console.error('Verification Error:', err);
      const msg = err.response?.data?.message || err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-resend-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('Captcha solved for resend');
        }
      });
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !phone) return;
    try {
      setLoading(true);
      setError(null);

      // Initialize reCAPTCHA
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;

      // Start Firebase Phone Auth for Resend
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);

      // Update global confirmationResult
      window.confirmationResult = confirmationResult;

      // Also call backend's send-otp so it logs the attempt
      try {
        isLogin
          ? await sendLoginOtp(phone)
          : await sendOtp(phone);
      } catch (err) {
        console.warn('Backend send-otp failed during resend, but Firebase proceeding');
      }

      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      console.error('Resend Error:', err);
      setError('Failed to resend OTP. Please try again.');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Secure your account.</h2>
          <p className="text-gray-600 text-lg">Enter the code sent to your device.</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="flex-1 flex flex-col h-full bg-white relative"
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-8 left-8 p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors z-20"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>

        {/* Mobile Header */}
        <div className="md:hidden shrink-0 scale-90 origin-top opacity-80 p-4 mt-16 ml-8">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col px-8 pt-4 md:px-16 md:justify-center mt-8 md:mt-0">
          <div className="text-center md:text-left mt-2 mb-8">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-orange-400 inline-block">OTP Verification</h2>
            <p className="text-gray-400 text-sm mt-3 px-4 md:px-0 leading-relaxed">
              Enter the verification code sent to your mobile number
              {phone && <span className="font-semibold text-gray-600"> {phone}</span>}
            </p>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          <div className="flex justify-between md:justify-start md:gap-4 mb-10 mt-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 bg-gray-50 border border-gray-100 rounded-xl text-center text-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all caret-purple-500"
              />
            ))}
          </div>

          <div className="pt-4">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 active:scale-[0.98] transform disabled:opacity-50"
            >
              {loading ? 'Verifying...' : (isLogin ? 'Sign In' : 'Verify & Sign Up')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Didn't receive the code?{' '}
              {resendTimer > 0 ? (
                <span className="text-gray-500 font-medium">Resend in {resendTimer}s</span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-purple-600 font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </p>
            <div id="recaptcha-resend-container"></div>
          </div>

          <div className="flex justify-center mt-auto md:hidden pb-6 pt-6">
            <div className="w-32 h-1.5 bg-gray-900 rounded-full opacity-10"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

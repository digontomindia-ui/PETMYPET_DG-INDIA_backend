import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { sendOtp } from '../api/auth';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

import { countries } from '../utils/countries';

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    phone: '',
    countryCode: '+91',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dial_code.includes(searchQuery)
  );

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

  const selectedCountry = countries.find(c => c.dial_code === formData.countryCode) || countries[0];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all required fields');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      const countryCode = formData.countryCode || '+91';
      const fullPhone = formData.phone.startsWith('+') ? formData.phone : `${countryCode}${formData.phone}`;

      // 1. Check if user already exists on backend FIRST
      try {
        await sendOtp(fullPhone);
      } catch (err) {
        const msg = err.response?.data?.message || 'This phone number is already registered. Please sign in instead.';
        setError(msg);
        return;
      }

      // 2. ONLY IF backend check passes, continue with Firebase flow
      // Initialize reCAPTCHA
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;

      // Start Firebase Phone Auth
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, appVerifier);

      // Store confirmationResult globally for the OTP page
      window.confirmationResult = confirmationResult;

      // Store registration data temporarily for use after OTP verification
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: fullPhone,
        dob: formData.dob || null,
        password: formData.password
      }));

      navigate('/otp');
    } catch (err) {
      console.error('Sign Up Error:', err);
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Join SkillArena.</h2>
          <p className="text-gray-600 text-lg">Create an account and start learning.</p>
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
        <div className="md:hidden shrink-0 scale-90 origin-top opacity-80 p-4 mt-8 ml-8">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col px-8 py-6 md:px-16 mt-8 md:mt-0">
          <div className="text-center md:text-left mb-5">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-500 inline-block">Sign Up</h2>
            <p className="text-gray-500 text-sm mt-1">
              Already have an account? <button onClick={() => navigate('/signin')} className="text-blue-500 font-semibold hover:underline">Login</button>
            </p>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-gray-500 ml-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-gray-500 ml-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Date of Birth</label>
              <div className="relative">
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Phone Number</label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-purple-500/20 relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 pr-3 border-r border-gray-200 hover:bg-gray-100/50 rounded-lg transition-colors py-1"
                  >
                    <span className="text-lg">{selectedCountry.flag}</span>
                    <span className="text-sm font-bold text-gray-700">{selectedCountry.dial_code}</span>
                    <span className="text-gray-400 text-[10px]">▼</span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 max-h-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-gray-50">
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {filteredCountries.map((c) => (
                          <button
                            key={`${c.code}-${c.dial_code}`}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, countryCode: c.dial_code }));
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span>{c.flag}</span>
                              <span className="text-sm font-medium text-gray-700">{c.name}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-400">{c.dial_code}</span>
                          </button>
                        ))}
                        {filteredCountries.length === 0 && (
                          <div className="p-4 text-center text-gray-400 text-sm italic">No results found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="bg-transparent w-full text-gray-800 font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min 8 chars, letters, numbers & symbols"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 pr-12 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 pr-12 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 active:scale-[0.98] transform disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Register'}
              </button>
            </div>
            <div id="recaptcha-container"></div>
          </form>

          <div className="flex justify-center mt-4 md:hidden pb-4">
            <div className="w-32 h-1.5 bg-gray-900 rounded-full opacity-10"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

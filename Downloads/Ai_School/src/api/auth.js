import api from './api';

// ============================================
// OTP-based Registration
// ============================================

/**
 * Send OTP for registration
 */
export const sendOtp = async (phone) => {
  const response = await api.post('/auth/send-otp', { phone, purpose: 'registration' });
  return response.data;
};

/**
 * Verify OTP and complete registration
 */
export const verifyOtpAndRegister = async ({ phone, idToken, name, email, dob, password }) => {
  const response = await api.post('/auth/register', {
    phone, idToken, name, email, dob, password
  });
  if (response.data.tokens) {
    localStorage.setItem('accessToken', response.data.tokens.accessToken);
    localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// ============================================
// OTP-based Login
// ============================================

/**
 * Send OTP for login (checks if account exists)
 */
export const sendLoginOtp = async (phone) => {
  const response = await api.post('/auth/send-otp', { phone, purpose: 'login' });
  return response.data;
};

/**
 * Verify OTP and login (sends Firebase ID token to backend)
 */
export const verifyOtpAndLogin = async ({ phone, idToken }) => {
  const response = await api.post('/auth/login', { phone, idToken });
  if (response.data.tokens) {
    localStorage.setItem('accessToken', response.data.tokens.accessToken);
    localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// ============================================
// Session Management
// ============================================

/**
 * Logout user
 */
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } catch (err) {
    // Ignore logout API errors
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

/**
 * Get current user from local storage
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Check if user is logged in
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

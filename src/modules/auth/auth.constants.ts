export const OTP_MODEL_NAME = 'Otp';
export const SESSION_MODEL_NAME = 'Session';

export const OTP_PURPOSES = {
  SIGNUP: 'SIGNUP',
  LOGIN: 'LOGIN',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[keyof typeof OTP_PURPOSES];

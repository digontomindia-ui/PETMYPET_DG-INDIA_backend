import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

function initFirebase() {
  if (getApps().length > 0) return getApps()[0]!;
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    logger.warn('Firebase credentials not configured; push notifications are disabled');
    return undefined;
  }
  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const firebaseApp = initFirebase();

export async function sendPushNotification(
  deviceTokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<void> {
  if (!firebaseApp || deviceTokens.length === 0) return;

  const messaging = getMessaging(firebaseApp);
  const response = await messaging.sendEachForMulticast({
    tokens: deviceTokens,
    notification: { title, body },
    data,
  });

  if (response.failureCount > 0) {
    logger.warn({ failureCount: response.failureCount }, 'Some push notifications failed to send');
  }
}

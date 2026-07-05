import type { Job } from 'bullmq';
import { createWorker } from '../../common/jobs/queue.factory.js';
import { QUEUE_NAMES } from '../../common/jobs/queue-names.js';
import { sendPushNotification } from '../../common/integrations/firebase.js';
import { sendEmail } from '../../common/integrations/mailer.js';
import { sendSms } from '../../common/integrations/sms.js';
import { logger } from '../../common/utils/logger.js';
import { userRepository } from '../users/user.repository.js';
import type { EmailJobData, PushNotificationJobData, SmsJobData } from './notification.dto.js';

export function startNotificationWorkers(): void {
  createWorker<PushNotificationJobData>(
    QUEUE_NAMES.PUSH_NOTIFICATION,
    async (job: Job<PushNotificationJobData>) => {
      const user = await userRepository.findById(job.data.userId);
      if (!user || user.deviceTokens.length === 0) return;
      await sendPushNotification(user.deviceTokens, job.data.title, job.data.body, job.data.data);
    },
  );

  createWorker<EmailJobData>(QUEUE_NAMES.EMAIL, async (job: Job<EmailJobData>) => {
    await sendEmail({ to: job.data.to, subject: job.data.subject, html: job.data.html });
  });

  createWorker<SmsJobData>(QUEUE_NAMES.SMS, async (job: Job<SmsJobData>) => {
    await sendSms(job.data.to, job.data.message);
  });

  logger.info('Notification workers (push, email, sms) started');
}

import { OtpModel } from './otp.schema.js';
import type { OtpDocument } from './otp.types.js';
import type { OtpPurpose } from './auth.constants.js';

export const otpRepository = {
  async create(
    identifier: string,
    purpose: OtpPurpose,
    codeHash: string,
    expiresAt: Date,
  ): Promise<OtpDocument> {
    return OtpModel.create({ identifier, purpose, codeHash, expiresAt, lastSentAt: new Date() });
  },

  async findLatest(identifier: string, purpose: OtpPurpose): Promise<OtpDocument | null> {
    return OtpModel.findOne({ identifier, purpose }).sort({ createdAt: -1 }).exec();
  },

  async incrementAttempts(id: string): Promise<void> {
    await OtpModel.updateOne({ _id: id }, { $inc: { attempts: 1 } }).exec();
  },

  async deleteById(id: string): Promise<void> {
    await OtpModel.deleteOne({ _id: id }).exec();
  },

  async invalidateAll(identifier: string, purpose: OtpPurpose): Promise<void> {
    await OtpModel.deleteMany({ identifier, purpose }).exec();
  },
};

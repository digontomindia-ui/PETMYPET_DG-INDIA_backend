import { Schema } from 'mongoose';

export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export interface IWorkingHours {
  day: Weekday;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export const workingHoursSchema = new Schema<IWorkingHours>(
  {
    day: { type: String, enum: WEEKDAYS, required: true },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '21:00' },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false },
);

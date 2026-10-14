import { describe, expect, it } from 'vitest';
import { createBookingSchema } from '../../src/modules/bookings/booking.validators.js';

const base = { providerId: 'a'.repeat(24), serviceId: 'b'.repeat(24) };

describe('createBookingSchema scheduledStart', () => {
  it('reads a zone-less time as IST, keeps explicit offsets as sent', () => {
    const parse = (scheduledStart: string) => createBookingSchema.parse({ ...base, scheduledStart }).scheduledStart;
    expect(parse('2099-10-14T22:00:00').toISOString()).toBe('2099-10-14T16:30:00.000Z');
    expect(parse('2099-10-14T22:00').toISOString()).toBe('2099-10-14T16:30:00.000Z');
    expect(parse('2099-10-14T22:00:00.000Z').toISOString()).toBe('2099-10-14T22:00:00.000Z');
    expect(parse('2099-10-14T22:00:00+05:30').toISOString()).toBe('2099-10-14T16:30:00.000Z');
  });
});

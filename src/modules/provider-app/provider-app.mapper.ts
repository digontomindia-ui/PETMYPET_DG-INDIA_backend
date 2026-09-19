import type { IProvider, ProviderAnalytics } from '../providers/provider.types.js';
import type { IUser } from '../users/user.types.js';

/**
 * ponytail: this app spec asks for concepts this backend has no data model for yet — lab
 * reports, pharmacy inventory, prescriptions, boarding check-in/out logs, an emergency-contact
 * card, a promo banner image. Rather than fabricate fake records, those fields are returned as
 * honest empty arrays / zeros / nulls below. Wire up real collections for them when the
 * corresponding admin/provider screens exist to populate them.
 */

export interface EnrichedBooking {
  id: string;
  status: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  createdAt: Date;
  location: string;
  pet: { id: string; name: string; breed: string; avatarUrl: string | null } | null;
  owner: { id: string; name: string; phone: string } | null;
  serviceName: string;
}

function timeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function displayTime(date: Date): string {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const dateDay = Math.floor(date.getTime() / dayMs);
  const today = Math.floor(now.getTime() / dayMs);
  const diff = dateDay - today;
  const time = timeLabel(date);
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Tomorrow, ${time}`;
  if (diff === -1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}, ${time}`;
}

function profileCompletionPercent(provider: IProvider): number {
  const checks = [
    provider.businessName.trim().length > 0,
    provider.description.trim().length > 0,
    provider.profileImageUrl !== null,
    provider.address.trim().length > 0,
    provider.kycDocuments.length > 0,
    provider.experienceYears !== null,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function sumEarnings(analytics: ProviderAnalytics): number {
  return analytics.earningsByDay.reduce((sum, day) => sum + day.amount, 0);
}

// ---- Home ----

export function mapSitterHome(
  user: IUser,
  provider: IProvider,
  weekEarnings: number,
  upcoming: EnrichedBooking[],
) {
  const pct = profileCompletionPercent(provider);
  return {
    success: true,
    message: 'Pet Sitter home fatch sucessfully',
    user_name: user.name || 'there',
    profile_completed_percentage: `${pct}%`,
    isProfile_Completed: pct === 100,
    earning_this_week: String(weekEarnings),
    uppcomming_appointments: upcoming.map((b) => ({
      id: b.id,
      name: b.pet?.name ?? '',
      image: b.pet?.avatarUrl ?? '',
      date_time: b.scheduledStart,
    })),
  };
}

export function mapWalkerHome(
  user: IUser,
  provider: IProvider,
  todaysSchedule: EnrichedBooking[],
  walksToday: number,
) {
  return {
    success: true,
    message: 'Dashboard data fetched successfully',
    data: {
      user: { id: user._id.toString(), first_name: (user.name || '').split(' ')[0] || '' },
      verification_status: {
        is_verified: provider.kycStatus === 'APPROVED',
        status: provider.kycStatus,
        title:
          provider.kycStatus === 'APPROVED' ? 'Verification Approved' : 'Verification Pending',
      },
      todays_schedule: todaysSchedule.map((b) => ({
        id: b.id,
        pet: b.pet
          ? { id: b.pet.id, name: b.pet.name, breed: b.pet.breed, image_url: b.pet.avatarUrl }
          : null,
        owner: b.owner ? { id: b.owner.id, name: b.owner.name } : null,
        time_slot: `${timeLabel(b.scheduledStart)} - ${timeLabel(b.scheduledEnd)}`,
        start_time: b.scheduledStart,
        end_time: b.scheduledEnd,
        location: b.location,
        status: b.status,
      })),
      quick_stats: { walks_today: walksToday, rating: provider.rating, earnings: 0 },
    },
  };
}

export function mapTrainerDashboard(
  user: IUser,
  provider: IProvider,
  todaySessions: number,
  todayEarnings: number,
  upcoming: EnrichedBooking[],
) {
  return {
    success: true,
    message: 'Dashboard data retrieved successfully.',
    data: {
      user: {
        id: user._id.toString(),
        name: user.name || '',
        is_verified: provider.kycStatus === 'APPROVED',
      },
      quick_metrics: {
        today_sessions: todaySessions,
        earnings: todayEarnings,
        rating: provider.rating,
        reviews: provider.ratingCount,
      },
      upcoming_sessions: upcoming.map((b) => ({
        id: b.id,
        pet: b.pet ? { id: b.pet.id, name: b.pet.name, image_url: b.pet.avatarUrl } : null,
        owner: b.owner ? { id: b.owner.id, name: b.owner.name } : null,
        time_slot: `${timeLabel(b.scheduledStart)} - ${timeLabel(b.scheduledEnd)}`,
        start_time: b.scheduledStart,
        end_time: b.scheduledEnd,
        tag: b.serviceName.toUpperCase(),
      })),
    },
  };
}

export function mapVetHome(
  user: IUser,
  provider: IProvider,
  todaysCounts: { appointments: number; walkIns: number; surgeries: number; revenue: number },
  todaysSchedule: EnrichedBooking[],
  revenueTotal: number,
) {
  return {
    name: user.name || provider.businessName,
    location: provider.address,
    "today's_overview": {
      Appointments: todaysCounts.appointments,
      'Walk-ins': todaysCounts.walkIns,
      Surgeries: todaysCounts.surgeries,
      Revenue: todaysCounts.revenue,
    },
    todays_overview: todaysSchedule.map((b) => ({
      id: b.id,
      name: b.pet?.name ?? '',
      years: '',
      breed: b.pet?.breed ?? '',
      status: b.status,
      created_at: b.scheduledStart,
      appointment: b.serviceName,
    })),
    lab_report: [] as unknown[],
    inventory_alerts: [] as unknown[],
    revenue_overview: {
      total_revenue: revenueTotal,
      percentage_vs_last_month: { percentage: 0, status: 'flat' },
      consultations: revenueTotal,
      Pharmacy: 0,
      'Services & Others': 0,
      chart_data: [] as unknown[],
    },
  };
}

export function mapBoardingHome(
  provider: IProvider,
  checkIns: EnrichedBooking[],
  checkOuts: EnrichedBooking[],
  pendingRequests: EnrichedBooking[],
  occupiedPets: number,
  newBookingsToday: number,
  todayEarnings: number,
  monthEarnings: number,
) {
  const capacity = provider.metadata.boarding?.capacity ?? 0;
  const availableKennels =
    provider.metadata.boarding?.availableKennels ?? Math.max(0, capacity - occupiedPets);
  return {
    success: true,
    message: 'Home retrieved successfully.',
    data: {
      center: {
        id: provider._id.toString(),
        name: 'Boarding Center',
        branch: provider.businessName,
        notification_alert: false,
      },
      greeting: '',
      banner_image: null as string | null,
      today_overview: {
        pets_currently_boarding: occupiedPets,
        new_bookings_today: newBookingsToday,
        check_outs_today: checkOuts.length,
        average_rating: provider.rating,
      },
      occupancy_status: {
        occupied_pets: occupiedPets,
        available_spaces: availableKennels,
        total_capacity: capacity,
        occupancy_percentage: capacity > 0 ? Math.round((occupiedPets / capacity) * 100) : 0,
        progress_value: capacity > 0 ? Math.round((occupiedPets / capacity) * 100) / 100 : 0,
      },
      today_check_ins: checkIns.map((b) => ({
        id: b.id,
        time: timeLabel(b.scheduledStart),
        pet: b.pet
          ? {
              id: b.pet.id,
              name: b.pet.name,
              breed: b.pet.breed,
              owner_name: b.owner?.name ?? '',
              image_url: b.pet.avatarUrl,
            }
          : null,
        status: b.status,
      })),
      today_check_outs: checkOuts.map((b) => ({
        id: b.id,
        time: timeLabel(b.scheduledEnd),
        pet: b.pet
          ? {
              id: b.pet.id,
              name: b.pet.name,
              breed: b.pet.breed,
              owner_name: b.owner?.name ?? '',
              image_url: b.pet.avatarUrl,
            }
          : null,
        status: b.status,
      })),
      pending_booking_requests: pendingRequests.map((b) => ({
        id: b.id,
        pet: b.pet
          ? {
              id: b.pet.id,
              name: b.pet.name,
              breed: b.pet.breed,
              stay_dates: `${b.scheduledStart.toDateString()} - ${b.scheduledEnd.toDateString()}`,
              image_url: b.pet.avatarUrl,
              approve: false,
            }
          : null,
      })),
      pet_updates_due: [] as unknown[],
      revenue_summary: { today_earnings: todayEarnings, this_month: monthEarnings },
      recent_messages: [] as unknown[],
      emergency_contact: null as unknown,
    },
  };
}

export function mapGroomerHome(
  user: IUser,
  provider: IProvider,
  todaysBookingsCount: number,
  activeSession: EnrichedBooking | null,
  todaysNextSession: EnrichedBooking | null,
  weekEarnings: number,
  monthEarnings: number,
  totalBookings: number,
) {
  return {
    success: true,
    message: 'Groomer dashboard retrieved successfully.',
    data: {
      header: {
        greeting: 'Good Day',
        location: provider.address,
        notifications_count: 0,
        is_available: provider.isActive,
      },
      profile_summary: {
        name: user.name || provider.businessName,
        is_verified: provider.kycStatus === 'APPROVED',
        designation: 'Professional Pet Groomer',
        rating: provider.rating,
        reviews_count: provider.ratingCount,
        avatar_url: provider.profileImageUrl,
      },
      stats_overview: {
        total_bookings: totalBookings,
        today_grooming: todaysBookingsCount,
        rating: provider.rating,
        total_revenue: monthEarnings,
      },
      todays_grooming_session: todaysNextSession
        ? {
            id: todaysNextSession.id,
            pet: todaysNextSession.pet
              ? {
                  name: todaysNextSession.pet.name,
                  breed: todaysNextSession.pet.breed,
                  image_url: todaysNextSession.pet.avatarUrl,
                }
              : null,
            status: todaysNextSession.status,
            owner_name: todaysNextSession.owner?.name ?? '',
            scheduled_time: timeLabel(todaysNextSession.scheduledStart),
            phone: todaysNextSession.owner?.phone ?? '',
            location: { lontude: '', latatude: '' },
          }
        : null,
      active_grooming: activeSession
        ? {
            id: activeSession.id,
            pet: activeSession.pet
              ? {
                  name: activeSession.pet.name,
                  breed: activeSession.pet.breed,
                  image_url: activeSession.pet.avatarUrl,
                }
              : null,
            service_badge: activeSession.serviceName.toUpperCase(),
            scheduled_time: timeLabel(activeSession.scheduledStart),
            steps: buildGroomingSteps(activeSession.status),
          }
        : null,
      earnings_overview: {
        this_week: { amount: `₹${weekEarnings}`, percentage_change: '', chart_points: [] },
        this_month: monthEarnings,
      },
      recent_reviews: null as unknown,
      recent_prescriptions: [] as unknown[],
    },
  };
}

function buildGroomingSteps(status: string) {
  const order = ['ACCEPTED', 'ON_THE_WAY', 'STARTED', 'COMPLETED'];
  const labels: Record<string, string> = {
    ACCEPTED: 'Appointment Approved',
    ON_THE_WAY: 'On The Way',
    STARTED: 'Grooming Started',
    COMPLETED: 'Completed',
  };
  const currentIndex = order.indexOf(status);
  return order.map((step, i) => ({
    title: labels[step],
    time: null,
    status: i < currentIndex ? 'COMPLETED' : i === currentIndex ? 'CURRENT' : 'PENDING',
  }));
}

// ---- Appointments ----

export function mapSitterAppointments(userName: string, appointments: EnrichedBooking[]) {
  return {
    success: true,
    message: 'Appointments fetched successfully',
    user_name: userName,
    appointments: appointments.map((b) => ({
      id: b.id,
      pet: b.pet ? { id: b.pet.id, name: b.pet.name, image_url: b.pet.avatarUrl } : null,
      owner: b.owner ? { id: b.owner.id, name: b.owner.name } : null,
      service_type: b.serviceName,
      appointment_date: b.scheduledStart,
      status: b.status,
    })),
  };
}

export function mapWalkerAppointments(
  appointments: EnrichedBooking[],
  page: number,
  limit: number,
  total: number,
) {
  return {
    success: true,
    message: 'Appointments fetched successfully.',
    data: {
      appointments: appointments.map((b) => ({
        id: b.id,
        pet: b.pet
          ? { id: b.pet.id, name: b.pet.name, breed: b.pet.breed, image_url: b.pet.avatarUrl }
          : null,
        owner: b.owner ? { id: b.owner.id, name: b.owner.name } : null,
        appointment_date: b.scheduledStart,
        display_time: displayTime(b.scheduledStart),
        location: b.location,
        status: b.status,
      })),
      pagination: {
        current_page: page,
        total_pages: Math.max(1, Math.ceil(total / limit)),
        total_items: total,
        has_next: page * limit < total,
      },
    },
  };
}

export function mapTrainerAppointments(
  appointments: EnrichedBooking[],
  page: number,
  limit: number,
  total: number,
) {
  return {
    success: true,
    message: 'Appointments retrieved successfully.',
    data: {
      appointments: appointments.map((b) => ({
        id: b.id,
        pet: b.pet
          ? { id: b.pet.id, name: b.pet.name, breed: b.pet.breed, image_url: b.pet.avatarUrl }
          : null,
        owner: b.owner ? { id: b.owner.id, name: b.owner.name } : null,
        status: b.status,
        appointment_date: b.scheduledStart,
        service_tag: b.serviceName,
      })),
      pagination: {
        current_page: page,
        total_pages: Math.max(1, Math.ceil(total / limit)),
        total_count: total,
        has_next_page: page * limit < total,
      },
    },
  };
}

export function mapVetAppointments(appointments: EnrichedBooking[]) {
  return {
    'total appointments': appointments.length,
    schedule: appointments.map((b) => ({
      id: b.id,
      name: b.pet?.name ?? '',
      test: b.serviceName.toUpperCase(),
      years: '',
      status: b.status,
      image: b.pet?.avatarUrl ?? '',
      created_at: b.scheduledStart,
    })),
  };
}

// ---- Analytics ----

export function mapSitterAnalytics(range: string, analytics: ProviderAnalytics) {
  return {
    success: true,
    message: 'Analytics fetched successfully',
    data: {
      selected_range: range,
      overview_cards: {
        total_sessions: analytics.bookingCount,
        earnings: sumEarnings(analytics),
        rating: analytics.satisfactionScore,
        repeat_clients: Math.round((analytics.repeatClientPercent / 100) * analytics.bookingCount),
      },
      earnings_chart: {
        chart_data: analytics.earningsByDay.map((d) => ({
          label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
          value: d.amount,
        })),
      },
      top_services: analytics.topServices.map((s) => ({
        id: s.serviceId,
        name: s.name,
        percentage:
          analytics.bookingCount > 0
            ? Math.round((s.bookingCount / analytics.bookingCount) * 100)
            : 0,
      })),
    },
  };
}

export function mapWalkerAnalytics(range: string, analytics: ProviderAnalytics) {
  const total = sumEarnings(analytics);
  return {
    success: true,
    message: 'Analytics fetched successfully',
    data: {
      selected_range: range,
      earnings_chart: {
        total_earnings: String(total),
        percentage: '0',
        level: 'flat',
        chart_data: analytics.earningsByDay.map((d) => ({
          label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
          value: d.amount,
        })),
      },
      overview: {
        total_walks: String(analytics.bookingCount),
        avg_rating: String(analytics.satisfactionScore),
        total_earnings: total,
        active_client: 0,
      },
    },
  };
}

export function mapTrainerAnalytics(analytics: ProviderAnalytics) {
  return {
    success: true,
    message: 'Analytics details retrieved successfully.',
    data: {
      weekly_earnings: {
        title: 'Weekly Earnings',
        total_amount: sumEarnings(analytics),
        chart: analytics.earningsByDay.map((d) => ({
          day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })[0],
          amount: d.amount,
        })),
      },
      metrics_grid: {
        sessions: analytics.bookingCount,
        hours: Math.round((analytics.bookingCount * analytics.avgServiceDurationMinutes) / 60),
        repeat_clients_percentage: analytics.repeatClientPercent,
        avg_price_per_hours:
          analytics.avgServiceDurationMinutes > 0
            ? Math.round((sumEarnings(analytics) / analytics.bookingCount || 0) * 60 / analytics.avgServiceDurationMinutes)
            : 0,
      },
      ratings_breakdown: {
        title: 'Ratings Breakdown',
        breakdown: [5, 4, 3, 2, 1].map((star) => ({
          star,
          percentage: analytics.ratingBreakdown[star as 1 | 2 | 3 | 4 | 5],
        })),
      },
    },
  };
}

// ---- Profile ----

/** Generic profile shape shared by walker/sitter/groomer/trainer — the spec repeats this exact
 * contract under multiple role sections. */
export function mapGenericProfile(
  user: IUser,
  provider: IProvider,
  analytics: ProviderAnalytics,
  specializations: string[],
  serviceAreaNames: string[],
) {
  return {
    success: true,
    message: 'Profile fetched successfully.',
    data: {
      user: {
        id: user._id.toString(),
        name: user.name || provider.businessName,
        avatar_url: provider.profileImageUrl,
        is_verified: provider.kycStatus === 'APPROVED',
        bio: provider.description,
      },
      stats: {
        total_walks: analytics.bookingCount,
        rating: provider.rating,
        reviews_count: provider.ratingCount,
      },
      details: {
        experience: provider.experienceYears ?? 0,
        specializations,
        service_areas: serviceAreaNames,
        documents: provider.kycDocuments.map((doc) => ({
          type: doc.type,
          status: provider.kycStatus,
          document_url: doc.url,
        })),
      },
    },
  };
}

export function mapVetProfile(user: IUser, provider: IProvider) {
  return {
    success: true,
    message: 'Veterinarian profile retrieved successfully.',
    data: {
      id: provider._id.toString(),
      name: user.name || provider.businessName,
      designation: 'Veterinarian',
      profile_image: provider.profileImageUrl,
      experience: provider.experienceYears ? `${provider.experienceYears}+ Years` : '',
      rating: provider.rating,
      patients: String(provider.ratingCount),
      clinic_information: {
        title: 'Clinic Information',
        clinic_name: provider.businessName,
        location: provider.address,
        operating_hours: '',
      },
    },
  };
}

// ---- Patients ----

export function mapPatients(
  pets: { id: string; name: string; breed: string; avatarUrl: string | null; species: string; owner: { id: string; name: string } | null }[],
) {
  return pets.map((pet) => ({
    id: pet.id,
    name: pet.name,
    breed: pet.breed,
    age: '',
    breed_and_age: pet.breed,
    image_url: pet.avatarUrl,
    health_status: 'HEALTHY',
    owner: pet.owner ? { id: pet.owner.id, name: pet.owner.name } : null,
  }));
}

// ---- Chat REST aliases ----

export function mapInboxItem(room: {
  id: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantAvatar: string | null;
  lastMessagePreview: string;
  unreadCount: number;
  lastMessageAt: Date | null;
}) {
  return {
    id: room.id,
    profile_image: room.otherParticipantAvatar,
    name: room.otherParticipantName,
    last_msg: room.lastMessagePreview,
    unread_msg: String(room.unreadCount),
    data_time: room.lastMessageAt,
  };
}

export function mapMessageHistory(
  roomId: string,
  messages: { id: string; roomId: string; senderId: string; text: string; isRead: boolean; createdAt: Date }[],
  page: number,
  limit: number,
  hasMore: boolean,
) {
  return {
    success: true,
    message: 'Messages fetched successfully.',
    data: {
      room_id: roomId,
      messages: messages.map((m) => ({
        id: m.id,
        room_id: m.roomId,
        sender_id: m.senderId,
        message: m.text,
        type: 'TEXT',
        status: m.isRead ? 'SEEN' : 'DELIVERED',
        created_at: m.createdAt,
      })),
      pagination: {
        current_page: page,
        total_pages: hasMore ? page + 1 : page,
        has_more: hasMore,
      },
    },
  };
}

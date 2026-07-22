import { apiClient } from './client';
import { Booking, BookingStatus } from '../../types';

export type BookingBackendStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type CustomerBookingStatus = BookingStatus;
export type ProviderAppointmentStatus = 'upcoming' | 'pending' | 'declined' | 'completed' | 'cancelled';

export interface BookingRecord {
  id: string;
  ref: string;
  customerId: string;
  providerId: string;
  providerName: string;
  providerImage?: string | null;
  providerPhone?: string | null;
  providerWhatsapp?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAvatar?: string | null;
  serviceName: string;
  servicePrice: number;
  scheduledAt: string;
  endAt: string;
  duration: number;
  status: BookingBackendStatus;
  notes?: string | null;
  totalAmount: number;
  platformFee: number;
  reviewId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  providerId: string;
  serviceId?: string;
  serviceName?: string;
  servicePrice?: number;
  duration?: number;
  scheduledAt: string;
  notes?: string;
}

export interface UpdateBookingStatusPayload {
  status: 'confirmed' | 'upcoming' | 'accepted' | 'declined' | 'rejected' | 'completed' | 'cancelled';
}

export interface InitiateBookingPaymentResponse {
  checkoutRequestId: string;
  message?: string;
  status?: 'pending' | 'success';
}

export interface BookingPaymentStatus {
  bookingId: string;
  paymentId?: string;
  status: 'unpaid' | 'pending' | 'success' | 'failed';
  amount: number;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  mpesaReceiptNumber?: string;
  updatedAt?: string;
}

export interface CustomerBookingCard extends Omit<Booking, 'date' | 'time' | 'endTime' | 'status'> {
  scheduledAt: string;
  endAt: string;
  status: CustomerBookingStatus;
  providerPhone?: string | null;
  providerWhatsapp?: string | null;
  reviewId?: string | null;
  date: string;
  time: string;
  endTime: string;
}

export interface ProviderAppointmentCard {
  id: string;
  ref: string;
  status: ProviderAppointmentStatus;
  customerName: string;
  customerImg?: string | null;
  customerPhone: string;
  isNewClient: boolean;
  pastVisits?: number;
  service: string;
  price: number;
  scheduledAt: string;
  endAt: string;
  date: string;
  time: string;
  duration: string;
  notes?: string;
  ago: string;
  providerId: string;
}

const CUSTOMER_STATUS_MAP: Record<BookingBackendStatus, CustomerBookingStatus> = {
  pending: 'pending',
  accepted: 'confirmed',
  rejected: 'rejected',
  completed: 'completed',
  cancelled: 'cancelled',
};

const PROVIDER_STATUS_MAP: Record<BookingBackendStatus, ProviderAppointmentStatus> = {
  pending: 'pending',
  accepted: 'upcoming',
  rejected: 'declined',
  completed: 'completed',
  cancelled: 'cancelled',
};

const BACKEND_STATUS_MAP: Record<
  UpdateBookingStatusPayload['status'],
  BookingBackendStatus
> = {
  accepted: 'accepted',
  confirmed: 'accepted',
  upcoming: 'accepted',
  declined: 'rejected',
  rejected: 'rejected',
  completed: 'completed',
  cancelled: 'cancelled',
};

const createDateFormatter = (options: Intl.DateTimeFormatOptions) => {
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('en-US', options);
  } catch {
    return null;
  }
};

const createRelativeFormatter = () => {
  if (typeof Intl === 'undefined' || typeof Intl.RelativeTimeFormat !== 'function') {
    return null;
  }

  try {
    return new Intl.RelativeTimeFormat('en-US', {
      numeric: 'auto',
    });
  } catch {
    return null;
  }
};

const dateFormatter = createDateFormatter({
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const timeFormatter = createDateFormatter({
  hour: 'numeric',
  minute: '2-digit',
});

const relativeFormatter = createRelativeFormatter();

const parseDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const buildScheduledAt = (date: Date, time: string) => {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    throw new Error(`Invalid time value: ${time}`);
  }

  const [, hoursString, minutesString, period] = match;
  let hours = Number(hoursString);
  const minutes = Number(minutesString);
  const upperPeriod = period.toUpperCase();

  if (upperPeriod === 'AM' && hours === 12) {
    hours = 0;
  } else if (upperPeriod === 'PM' && hours !== 12) {
    hours += 12;
  }

  const scheduledAt = new Date(date);
  scheduledAt.setHours(hours, minutes, 0, 0);

  return scheduledAt.toISOString();
};

const formatRelative = (value: string) => {
  const date = parseDateTime(value);
  if (!date) {
    return 'Recently';
  }

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) {
    if (relativeFormatter) {
      return relativeFormatter.format(diffMinutes, 'minute');
    }
    return diffMinutes >= 0 ? `in ${absMinutes} min` : `${absMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    if (relativeFormatter) {
      return relativeFormatter.format(diffHours, 'hour');
    }
    const absHours = Math.abs(diffHours);
    return diffHours >= 0 ? `in ${absHours} hr` : `${absHours} hr ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (relativeFormatter) {
    return relativeFormatter.format(diffDays, 'day');
  }
  const absDays = Math.abs(diffDays);
  return diffDays >= 0 ? `in ${absDays} day${absDays === 1 ? '' : 's'}` : `${absDays} day${absDays === 1 ? '' : 's'} ago`;
};

export const formatBookingDate = (value: string) => {
  const date = parseDateTime(value);
  if (!date) {
    return 'TBA';
  }

  if (dateFormatter) {
    return dateFormatter.format(date);
  }

  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  return `${weekday}, ${month} ${date.getDate()}`;
};

export const formatBookingTime = (value: string) => {
  const date = parseDateTime(value);
  if (!date) {
    return 'TBA';
  }

  if (timeFormatter) {
    return timeFormatter.format(date);
  }

  const hours24 = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
};

export const formatDuration = (minutes: number) => `${minutes}m`;

export const toCustomerBookingCard = (booking: BookingRecord): CustomerBookingCard => ({
  id: booking.id,
  ref: booking.ref,
  customerId: booking.customerId,
  providerId: booking.providerId,
  providerName: booking.providerName,
  providerImage: booking.providerImage ?? undefined,
  providerPhone: booking.providerPhone ?? undefined,
  providerWhatsapp: booking.providerWhatsapp ?? undefined,
  serviceName: booking.serviceName,
  servicePrice: booking.servicePrice,
  scheduledAt: booking.scheduledAt,
  endAt: booking.endAt,
  duration: booking.duration,
  status: CUSTOMER_STATUS_MAP[booking.status],
  notes: booking.notes ?? undefined,
  totalAmount: booking.totalAmount,
  platformFee: booking.platformFee,
  reviewId: booking.reviewId ?? null,
  date: formatBookingDate(booking.scheduledAt),
  time: formatBookingTime(booking.scheduledAt),
  endTime: formatBookingTime(booking.endAt),
});

export const toProviderAppointmentCard = (booking: BookingRecord): ProviderAppointmentCard => ({
  id: booking.id,
  ref: booking.ref,
  status: PROVIDER_STATUS_MAP[booking.status],
  customerName: booking.customerName ?? 'Customer',
  customerImg: booking.customerAvatar ?? null,
  customerPhone: booking.customerPhone ?? '',
  isNewClient: false,
  service: booking.serviceName,
  price: booking.servicePrice,
  scheduledAt: booking.scheduledAt,
  endAt: booking.endAt,
  date: formatBookingDate(booking.scheduledAt),
  time: formatBookingTime(booking.scheduledAt),
  duration: formatDuration(booking.duration),
  notes: booking.notes ?? undefined,
  ago: formatRelative(booking.createdAt),
  providerId: booking.providerId,
});

export const mapBookingStatusToBackend = (
  status: UpdateBookingStatusPayload['status']
): BookingBackendStatus => BACKEND_STATUS_MAP[status];

export const bookingApi = {
  listMyBookings: () => apiClient.get<BookingRecord[]>('bookings/me'),
  createBooking: (payload: CreateBookingPayload) => apiClient.post<BookingRecord>('bookings', payload),
  initiateBookingPayment: (bookingId: string, phoneNumber: string) =>
    apiClient.post<InitiateBookingPaymentResponse>(`bookings/${bookingId}/pay`, {
      phoneNumber,
    }),
  getBookingPaymentStatus: (bookingId: string, options?: { reconcile?: boolean }) =>
    apiClient.get<BookingPaymentStatus>(
      options?.reconcile ? `bookings/${bookingId}/payment-status?reconcile=true` : `bookings/${bookingId}/payment-status`
    ),
  updateBookingStatus: (bookingId: string, status: UpdateBookingStatusPayload['status']) =>
    apiClient.patch<BookingRecord>(`bookings/${bookingId}/status`, {
      status: mapBookingStatusToBackend(status),
    }),
};

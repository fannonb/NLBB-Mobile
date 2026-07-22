export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  location?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  /** From API; used for stable styling when ids are UUIDs */
  slug?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  category: string;
  isActive?: boolean;
}

export interface Provider {
  id: string;
  ownerUserId?: string;
  name: string;
  category: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  distance?: string;
  location: string;
  address: string;
  phone?: string;
  whatsapp?: string;
  /** True when a phone exists even if the number is locked for guests */
  hasPhone?: boolean;
  /** True when a WhatsApp number exists even if locked for guests */
  hasWhatsapp?: boolean;
  /** True when contact numbers are hidden until the customer signs in */
  contactsLocked?: boolean;
  instagram?: string;
  facebook?: string;
  mpesaPhone?: string;
  openTime: string;
  closeTime: string;
  workDays: string;
  workingHours?: { day: string; isOpen: boolean; openTime: string; closeTime: string }[];
  priceFrom: number;
  isVerified: boolean;
  isSubscribed: boolean;
  isOpen: boolean;
  distanceKm?: number;
  services: Service[];
  galleryImages?: string[];
  coordinates?: { lat: number; lng: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  ref: string;
  customerId: string;
  providerId: string;
  providerName: string;
  providerImage?: string;
  serviceName: string;
  servicePrice: number;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  status: BookingStatus;
  notes?: string;
  /** Listed service price (guide). Customers pay at the venue; NLBB does not add app fees. */
  totalAmount: number;
  /** Always 0 for customers — kept for schema compatibility. */
  platformFee: number;
  reviewId?: string | null;
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  serviceName: string;
  date: string;
}

export interface Subscription {
  providerId: string;
  status: 'active' | 'expired' | 'pending' | 'suspended';
  renewalDate: string;
  amount: number;
  planAmount?: number;
  creditBalance?: number;
  paymentMethod: 'mpesa';
  lastPaymentId?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  providerId: string;
  amount: number;
  phoneNumber: string;
  method: 'mpesa';
  status: 'pending' | 'success' | 'failed';
  checkoutRequestId: string;
  merchantRequestId?: string;
  mpesaReceiptNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'booking' | 'payment' | 'subscription' | 'review' | 'general';
  actionType?: 'customer_bookings' | 'provider_appointment_detail' | 'provider_subscription' | 'provider_reviews';
  actionId?: string;
  isRead: boolean;
  createdAt: string;
}

// Navigation param types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: { role?: 'customer' | 'provider' } | undefined;
  Signup: undefined;
  ProviderSignup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  CustomerApp: undefined;
  ProviderDetails: { providerId: string };
  Notifications: undefined;
  Favorites: undefined;
  WriteReview: {
    providerId: string;
    providerName?: string;
    providerImage?: string;
    serviceName?: string;
    bookingId: string;
  };
  EditProfile: undefined;
  DarkMode: undefined;
  NotificationSettings: undefined;
  ProviderApp: undefined;
  AppointmentDetail: { appointmentId: string };
  ProviderReviews: undefined;
  ProviderNotifications: undefined;
  AdminApp: undefined;
};

export type AuthStackParamList = {
  Login: { role?: 'customer' | 'provider' } | undefined;
  Signup: undefined;
  ProviderSignup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Explore: undefined;
  Bookings: { bookingId?: string } | undefined;
  Profile: undefined;
  AllServices: undefined;
};

export type CustomerStackParamList = {
  CustomerApp: undefined;
  ProviderDetails: { providerId: string };
  Favorites: undefined;
  Notifications: undefined;
  WriteReview: {
    providerId: string;
    providerName?: string;
    providerImage?: string;
    serviceName?: string;
    bookingId: string;
  };
  EditProfile: undefined;
  DarkMode: undefined;
  NotificationSettings: undefined;
};

export type ProviderTabParamList = {
  Dashboard: undefined;
  Appointments: undefined;
  Business: undefined;
  ProviderProfile: undefined;
};

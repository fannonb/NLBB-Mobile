import { Category, Notification, Payment, Provider, Review, Service, Subscription } from '../../types';
import { BookingRecord } from '../api/bookings';
import { ProviderService } from '../api/providerManagement';
import { ProviderAnalyticsSummary } from '../api/analytics';
import { CustomerPreferences } from '../api/preferences';
import { DEFAULT_SERVICE_CATEGORIES } from '../../constants/serviceCategories';

const IMG = {
  barberCover: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop',
  barberCover2: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop',
  nailsCover: 'https://images.unsplash.com/photo-1604654894610-df63bc115327?q=80&w=1200&auto=format&fit=crop',
  spaCover: 'https://images.unsplash.com/photo-1544165165-4f092b257097?q=80&w=1200&auto=format&fit=crop',
  tattooCover: 'https://images.unsplash.com/photo-1616858546115-3b03f0b24040?q=80&w=1200&auto=format&fit=crop',
  avatarBarber: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=200&auto=format&fit=crop',
  avatarShop: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=200&auto=format&fit=crop',
  gallery1: 'https://images.unsplash.com/photo-1503950048472-2e040faec824?q=80&w=600&auto=format&fit=crop',
  gallery2: 'https://images.unsplash.com/photo-1622286342621-0aa0498c435d?q=80&w=600&auto=format&fit=crop',
  gallery3: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600&auto=format&fit=crop',
  customer1: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?q=80&w=200&auto=format&fit=crop',
  customer2: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop',
  customer3: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
};

const WORKING_HOURS = [
  { day: 'Monday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Tuesday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Wednesday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Thursday', isOpen: true, openTime: '9:00 AM', closeTime: '8:00 PM' },
  { day: 'Friday', isOpen: true, openTime: '9:00 AM', closeTime: '9:00 PM' },
  { day: 'Saturday', isOpen: true, openTime: '10:00 AM', closeTime: '6:00 PM' },
  { day: 'Sunday', isOpen: false, openTime: '10:00 AM', closeTime: '4:00 PM' },
];

const atTime = (daysOffset: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const addMinutes = (iso: string, minutes: number) =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

export const DEMO_SHOP_ID = 'demo-shop-001';

const fadeServices: Service[] = [
  { id: 'svc-fade-1', name: 'Classic Cut', description: 'Scissor or clipper finish with hot towel.', duration: 45, price: 800, category: 'Barber' },
  { id: 'svc-fade-2', name: 'Skin Fade', description: 'Sharp fade with line-up and styling.', duration: 60, price: 1200, category: 'Barber' },
  { id: 'svc-fade-3', name: 'Beard Sculpt', description: 'Beard trim, shape, and oil finish.', duration: 30, price: 600, category: 'Barber' },
  { id: 'svc-fade-4', name: 'Brotherhood Package', description: 'Cut, fade, beard, and hot towel ritual.', duration: 90, price: 1800, category: 'Barber' },
];

const crownServices: Service[] = [
  { id: 'svc-crown-1', name: 'Executive Cut', description: 'Premium cut with wash and blow dry.', duration: 50, price: 1500, category: 'Hair' },
  { id: 'svc-crown-2', name: 'Line Up', description: 'Crisp edges and shape refresh.', duration: 25, price: 500, category: 'Barber' },
];

const brotherhoodServices: Service[] = [
  { id: 'svc-bros-1', name: 'Full Groom', description: 'Cut, beard, and facial steam.', duration: 75, price: 2200, category: 'Barber' },
  { id: 'svc-bros-2', name: 'Kids Cut', description: 'Under 12 — patient and fun.', duration: 35, price: 700, category: 'Barber' },
];

const nailServices: Service[] = [
  { id: 'svc-nail-1', name: 'Classic Manicure', description: 'Clean, shape, and polish.', duration: 40, price: 900, category: 'Nails' },
  { id: 'svc-nail-2', name: 'Gel Set', description: 'Long-lasting gel application.', duration: 60, price: 1800, category: 'Nails' },
];

const spaServices: Service[] = [
  { id: 'svc-spa-1', name: 'Deep Tissue Massage', description: '60-minute recovery session.', duration: 60, price: 3500, category: 'Massage' },
  { id: 'svc-spa-2', name: 'Express Facial', description: 'Cleanse, exfoliate, hydrate.', duration: 45, price: 2500, category: 'Facial' },
];

export const DEMO_CATEGORIES: Category[] = DEFAULT_SERVICE_CATEGORIES;

export const DEMO_PROVIDERS: Provider[] = [
  {
    id: DEMO_SHOP_ID,
    ownerUserId: 'demo-provider-001',
    name: 'Fade Masters Barbershop',
    category: 'Barber',
    description: 'Premium barbering for the brotherhood. Walk-ins welcome — book ahead to skip the wait.',
    avatar: IMG.avatarBarber,
    coverImage: IMG.barberCover,
    galleryImages: [IMG.gallery1, IMG.gallery2, IMG.gallery3],
    rating: 4.9,
    reviewCount: 128,
    distance: '0.8 km',
    location: 'Westlands, Nairobi',
    address: 'Ring Road, Westlands, Nairobi',
    coordinates: { lat: -1.2675, lng: 36.8108 },
    phone: '+254723456789',
    whatsapp: '+254723456789',
    instagram: '@fademasters_ke',
    facebook: 'Fade Masters Nairobi',
    mpesaPhone: '+254723456789',
    openTime: '9:00 AM',
    closeTime: '8:00 PM',
    workDays: 'Mon - Sat',
    workingHours: WORKING_HOURS,
    priceFrom: 600,
    isVerified: true,
    isSubscribed: true,
    isOpen: true,
    services: fadeServices,
  },
  {
    id: 'demo-shop-002',
    name: 'Crown Cuts Studio',
    category: 'Hair',
    description: 'Modern cuts and color for men who show up sharp.',
    avatar: IMG.avatarShop,
    coverImage: IMG.barberCover2,
    rating: 4.7,
    reviewCount: 86,
    distance: '1.4 km',
    location: 'Kilimani, Nairobi',
    address: 'Yaya Centre, Kilimani',
    coordinates: { lat: -1.2925, lng: 36.7872 },
    phone: '+254711223344',
    whatsapp: '+254711223344',
    openTime: '10:00 AM',
    closeTime: '7:00 PM',
    workDays: 'Tue - Sun',
    priceFrom: 500,
    isVerified: true,
    isSubscribed: true,
    isOpen: true,
    services: crownServices,
  },
  {
    id: 'demo-shop-003',
    name: 'Brotherhood Grooming Lounge',
    category: 'Barber',
    description: 'Never leave bros behind — group bookings and loyalty perks.',
    coverImage: IMG.barberCover,
    rating: 4.8,
    reviewCount: 64,
    distance: '2.1 km',
    location: 'Lavington, Nairobi',
    address: 'James Gichuru Rd, Lavington',
    coordinates: { lat: -1.2789, lng: 36.7667 },
    phone: '+254722334455',
    openTime: '9:00 AM',
    closeTime: '8:00 PM',
    workDays: 'Mon - Sat',
    priceFrom: 700,
    isVerified: true,
    isSubscribed: true,
    isOpen: true,
    services: brotherhoodServices,
  },
  {
    id: 'demo-shop-004',
    name: 'Polish & Co. Nails',
    category: 'Nails',
    description: 'Clean nails, bold finishes — men\'s grooming elevated.',
    coverImage: IMG.nailsCover,
    rating: 4.6,
    reviewCount: 41,
    distance: '3.0 km',
    location: 'Karen, Nairobi',
    address: 'Karen Hub, Nairobi',
    coordinates: { lat: -1.3194, lng: 36.7076 },
    phone: '+254733445566',
    openTime: '9:00 AM',
    closeTime: '6:00 PM',
    workDays: 'Wed - Sun',
    priceFrom: 900,
    isVerified: false,
    isSubscribed: true,
    isOpen: true,
    services: nailServices,
  },
  {
    id: 'demo-shop-005',
    name: 'Restore Wellness Spa',
    category: 'Massage',
    description: 'Recovery, massage, and facials after a long week.',
    coverImage: IMG.spaCover,
    rating: 4.9,
    reviewCount: 52,
    distance: '4.2 km',
    location: 'Upper Hill, Nairobi',
    address: 'Upper Hill Road, Nairobi',
    coordinates: { lat: -1.2944, lng: 36.8172 },
    phone: '+254744556677',
    openTime: '8:00 AM',
    closeTime: '8:00 PM',
    workDays: 'Daily',
    priceFrom: 2500,
    isVerified: true,
    isSubscribed: true,
    isOpen: true,
    services: spaServices,
  },
];

export const DEMO_REVIEWS: Record<string, Review[]> = {
  [DEMO_SHOP_ID]: [
    {
      id: 'rev-1',
      userId: 'u-1',
      userName: 'Brian Otieno',
      userAvatar: IMG.customer1,
      rating: 5,
      comment: 'Best fade in Westlands. Sean knows his craft — always leave fresh.',
      serviceName: 'Skin Fade',
      date: '2 weeks ago',
    },
    {
      id: 'rev-2',
      userId: 'u-2',
      userName: 'James Kimani',
      userAvatar: IMG.customer2,
      rating: 5,
      comment: 'Brotherhood package is worth every shilling. Vibe is unmatched.',
      serviceName: 'Brotherhood Package',
      date: '1 month ago',
    },
    {
      id: 'rev-3',
      userId: 'u-3',
      userName: 'Amina Hassan',
      userAvatar: IMG.customer3,
      rating: 4,
      comment: 'Booked for my brother — on time and professional.',
      serviceName: 'Classic Cut',
      date: '1 month ago',
    },
  ],
  'demo-shop-002': [
    {
      id: 'rev-4',
      userId: 'u-4',
      userName: 'Kevo Mwangi',
      userAvatar: IMG.customer1,
      rating: 5,
      comment: 'Executive cut was clean. Will rebook.',
      serviceName: 'Executive Cut',
      date: '3 days ago',
    },
  ],
};

export const createDemoBookings = (): BookingRecord[] => {
  const tomorrow2pm = atTime(1, 14, 0);
  const tomorrow4pm = atTime(1, 16, 0);
  const today11am = atTime(0, 11, 0);
  const today3pm = atTime(0, 15, 0);
  const completed1 = atTime(-5, 13, 0);
  const completed2 = atTime(-12, 11, 30);
  const pending2 = atTime(2, 10, 0);

  return [
    {
      id: 'bk-pending-1',
      ref: '#NLBB-1001',
      customerId: 'demo-customer-001',
      providerId: DEMO_SHOP_ID,
      providerName: 'Fade Masters Barbershop',
      providerImage: IMG.barberCover,
      providerPhone: '+254723456789',
      providerWhatsapp: '+254723456789',
      customerName: 'Kevo Mwangi',
      customerPhone: '+254712345678',
      customerAvatar: IMG.customer1,
      serviceName: 'Skin Fade',
      servicePrice: 1200,
      scheduledAt: tomorrow2pm,
      endAt: addMinutes(tomorrow2pm, 60),
      duration: 60,
      status: 'pending',
      notes: 'Low fade, keep the top longer.',
      totalAmount: 1200,
      platformFee: 0,
      createdAt: atTime(-1, 9, 0),
      updatedAt: atTime(-1, 9, 0),
    },
    {
      id: 'bk-pending-2',
      ref: '#NLBB-1002',
      customerId: 'cust-002',
      providerId: DEMO_SHOP_ID,
      providerName: 'Fade Masters Barbershop',
      providerImage: IMG.barberCover,
      customerName: 'Brian Otieno',
      customerPhone: '+254798765432',
      customerAvatar: IMG.customer2,
      serviceName: 'Beard Sculpt',
      servicePrice: 600,
      scheduledAt: pending2,
      endAt: addMinutes(pending2, 30),
      duration: 30,
      status: 'pending',
      totalAmount: 600,
      platformFee: 0,
      createdAt: atTime(0, 8, 30),
      updatedAt: atTime(0, 8, 30),
    },
    {
      id: 'bk-upcoming-1',
      ref: '#NLBB-1003',
      customerId: 'demo-customer-001',
      providerId: DEMO_SHOP_ID,
      providerName: 'Fade Masters Barbershop',
      providerImage: IMG.barberCover,
      customerName: 'Kevo Mwangi',
      customerPhone: '+254712345678',
      serviceName: 'Classic Cut',
      servicePrice: 800,
      scheduledAt: today11am,
      endAt: addMinutes(today11am, 45),
      duration: 45,
      status: 'accepted',
      totalAmount: 800,
      platformFee: 0,
      createdAt: atTime(-2, 10, 0),
      updatedAt: atTime(-1, 12, 0),
    },
    {
      id: 'bk-upcoming-2',
      ref: '#NLBB-1004',
      customerId: 'cust-003',
      providerId: DEMO_SHOP_ID,
      providerName: 'Fade Masters Barbershop',
      customerName: 'James Kimani',
      customerPhone: '+254711000111',
      serviceName: 'Brotherhood Package',
      servicePrice: 1800,
      scheduledAt: today3pm,
      endAt: addMinutes(today3pm, 90),
      duration: 90,
      status: 'accepted',
      totalAmount: 1800,
      platformFee: 0,
      createdAt: atTime(-3, 14, 0),
      updatedAt: atTime(-2, 9, 0),
    },
    {
      id: 'bk-confirmed-customer',
      ref: '#NLBB-1005',
      customerId: 'demo-customer-001',
      providerId: 'demo-shop-002',
      providerName: 'Crown Cuts Studio',
      providerImage: IMG.barberCover2,
      customerName: 'Kevo Mwangi',
      customerPhone: '+254712345678',
      serviceName: 'Executive Cut',
      servicePrice: 1500,
      scheduledAt: tomorrow4pm,
      endAt: addMinutes(tomorrow4pm, 50),
      duration: 50,
      status: 'accepted',
      totalAmount: 1500,
      platformFee: 0,
      createdAt: atTime(-1, 16, 0),
      updatedAt: atTime(-1, 16, 30),
    },
    {
      id: 'bk-completed-1',
      ref: '#NLBB-0998',
      customerId: 'demo-customer-001',
      providerId: DEMO_SHOP_ID,
      providerName: 'Fade Masters Barbershop',
      providerImage: IMG.barberCover,
      customerName: 'Kevo Mwangi',
      serviceName: 'Classic Cut',
      servicePrice: 800,
      scheduledAt: completed1,
      endAt: addMinutes(completed1, 45),
      duration: 45,
      status: 'completed',
      totalAmount: 800,
      platformFee: 0,
      createdAt: atTime(-6, 10, 0),
      updatedAt: completed1,
    },
    {
      id: 'bk-completed-2',
      ref: '#NLBB-0997',
      customerId: 'demo-customer-001',
      providerId: 'demo-shop-003',
      providerName: 'Brotherhood Grooming Lounge',
      customerName: 'Kevo Mwangi',
      serviceName: 'Full Groom',
      servicePrice: 2200,
      scheduledAt: completed2,
      endAt: addMinutes(completed2, 75),
      duration: 75,
      status: 'completed',
      totalAmount: 2200,
      platformFee: 0,
      createdAt: atTime(-13, 9, 0),
      updatedAt: completed2,
    },
  ];
};

export const createDemoNotifications = (): Notification[] => [
  {
    id: 'notif-1',
    title: 'Booking confirmed',
    body: 'Fade Masters confirmed your Skin Fade for tomorrow at 2:00 PM.',
    type: 'booking',
    isRead: false,
    createdAt: atTime(-1, 10, 0),
  },
  {
    id: 'notif-2',
    title: 'Reminder',
    body: 'Your visit at Crown Cuts Studio is tomorrow at 4:00 PM.',
    type: 'booking',
    isRead: false,
    createdAt: atTime(0, 9, 0),
  },
  {
    id: 'notif-3',
    title: 'New review request',
    body: 'How was your last cut at Fade Masters? Leave a quick rating.',
    type: 'review',
    isRead: true,
    createdAt: atTime(-4, 18, 0),
  },
  {
    id: 'notif-4',
    title: 'Brotherhood perk',
    body: 'Book any barber this week and get 10% off your next visit.',
    type: 'general',
    isRead: true,
    createdAt: atTime(-7, 12, 0),
  },
];

export const createProviderDemoNotifications = (): Notification[] => [
  {
    id: 'pnotif-1',
    title: 'New booking request',
    body: 'Kevo Mwangi requested Skin Fade · tomorrow 2:00 PM',
    type: 'booking',
    isRead: false,
    createdAt: atTime(-1, 9, 0),
  },
  {
    id: 'pnotif-2',
    title: 'New booking request',
    body: 'Brian Otieno requested Beard Sculpt · in 2 days',
    type: 'booking',
    isRead: false,
    createdAt: atTime(0, 8, 30),
  },
  {
    id: 'pnotif-3',
    title: 'Payment received',
    body: 'M-Pesa subscription payment of Ksh 300 confirmed.',
    type: 'payment',
    isRead: true,
    createdAt: atTime(-3, 11, 0),
  },
  {
    id: 'pnotif-4',
    title: 'New 5-star review',
    body: 'Brian Otieno rated Skin Fade — "Best fade in Westlands."',
    type: 'review',
    isRead: true,
    createdAt: atTime(-5, 20, 0),
  },
];

export const DEMO_SUBSCRIPTION: Subscription = {
  providerId: DEMO_SHOP_ID,
  status: 'active',
  renewalDate: atTime(28, 0, 0),
  amount: 300,
  paymentMethod: 'mpesa',
  lastPaymentId: 'pay-001',
  updatedAt: atTime(-2, 0, 0),
};

export const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    providerId: DEMO_SHOP_ID,
    amount: 300,
    phoneNumber: '+254723456789',
    method: 'mpesa',
    status: 'success',
    checkoutRequestId: 'CHK-DEMO-001',
    merchantRequestId: 'MER-DEMO-001',
    mpesaReceiptNumber: 'RCP987654',
    createdAt: atTime(-2, 11, 0),
    updatedAt: atTime(-2, 11, 1),
  },
  {
    id: 'pay-002',
    providerId: DEMO_SHOP_ID,
    amount: 300,
    phoneNumber: '+254723456789',
    method: 'mpesa',
    status: 'success',
    checkoutRequestId: 'CHK-DEMO-002',
    mpesaReceiptNumber: 'RCP876543',
    createdAt: atTime(-32, 10, 0),
    updatedAt: atTime(-32, 10, 1),
  },
];

export const DEMO_ANALYTICS: ProviderAnalyticsSummary = {
  providerId: DEMO_SHOP_ID,
  totalBookings: 47,
  completedBookings: 38,
  pendingBookings: 2,
  totalRevenue: 68400,
  averageRating: 4.9,
  reviewCount: 128,
};

export const DEMO_PREFERENCES: CustomerPreferences = {
  themeMode: 'dark',
  notificationSettings: {
    bookingConfirmation: true,
    bookingReminder: true,
    bookingUpdate: true,
    providerMessage: true,
    providerPromo: false,
    providerReview: true,
    appUpdate: false,
    accountAlert: true,
  },
};

export const createDemoProviderServices = (): ProviderService[] =>
  fadeServices.map((service) => ({ ...service, isActive: true }));

export const DEMO_FAVORITE_IDS = [DEMO_SHOP_ID, 'demo-shop-002', 'demo-shop-003'];

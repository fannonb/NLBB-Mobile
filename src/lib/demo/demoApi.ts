import { User } from '../../types';
import { BookingRecord, CreateBookingPayload } from '../api/bookings';
import { CustomerPreferences } from '../api/preferences';
import {
  DEMO_CATEGORIES,
  DEMO_PROVIDERS,
  DEMO_REVIEWS,
  DEMO_ANALYTICS,
  DEMO_PAYMENTS,
  DEMO_PREFERENCES,
  DEMO_SHOP_ID,
} from './demoData';
import { getDemoProvider, getDemoState, getDemoSubscription, resetDemoState } from './demoState';

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const matchPath = (path: string, pattern: RegExp) => {
  const m = path.match(pattern);
  return m ? m.slice(1) : null;
};

export const handleDemoRequest = async <T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body: unknown,
  user: User
): Promise<T> => {
  await delay();
  const state = getDemoState();
  const [rawPath, query = ''] = path.split('?');
  const params = new URLSearchParams(query);

  // ── Public discovery ──────────────────────────────────────────────
  if (method === 'GET' && rawPath === 'categories') {
    return clone(DEMO_CATEGORIES) as T;
  }

  if (method === 'GET' && rawPath === 'providers') {
    let list = clone(DEMO_PROVIDERS);
    const search = params.get('search')?.toLowerCase();
    const category = params.get('category')?.toLowerCase();
    if (search) {
      list = list.filter((p) =>
        [p.name, p.category, p.location].join(' ').toLowerCase().includes(search)
      );
    }
    if (category) {
      list = list.filter((p) => p.category.toLowerCase().includes(category));
    }
    return list as T;
  }

  const providerMatch = matchPath(rawPath, /^providers\/([^/]+)$/);
  if (method === 'GET' && providerMatch) {
    const provider = DEMO_PROVIDERS.find((p) => p.id === providerMatch[0]);
    if (!provider) throw demoError('Provider not found', 404);
    return clone(provider) as T;
  }

  const reviewsMatch = matchPath(rawPath, /^providers\/([^/]+)\/reviews$/);
  if (method === 'GET' && reviewsMatch) {
    return clone(DEMO_REVIEWS[reviewsMatch[0]] ?? []) as T;
  }

  // ── Favorites ─────────────────────────────────────────────────────
  if (method === 'GET' && rawPath === 'favorites/me') {
    return state.favoriteIds
      .map((id) => DEMO_PROVIDERS.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => clone(p)) as T;
  }

  if (method === 'POST' && rawPath === 'favorites/me') {
    const providerId = (body as { providerId?: string })?.providerId;
    if (providerId && !state.favoriteIds.includes(providerId)) {
      state.favoriteIds.push(providerId);
    }
    return { providerId } as T;
  }

  const favDeleteMatch = matchPath(rawPath, /^favorites\/me\/([^/]+)$/);
  if (method === 'DELETE' && favDeleteMatch) {
    state.favoriteIds = state.favoriteIds.filter((id) => id !== favDeleteMatch[0]);
    return { providerId: favDeleteMatch[0] } as T;
  }

  // ── Bookings ──────────────────────────────────────────────────────
  if (method === 'GET' && rawPath === 'bookings/me') {
    if (user.role === 'provider') {
      return state.bookings.filter((b) => b.providerId === DEMO_SHOP_ID).map((b) => clone(b)) as T;
    }
    return state.bookings.filter((b) => b.customerId === user.id).map((b) => clone(b)) as T;
  }

  if (method === 'POST' && rawPath === 'bookings') {
    const payload = body as CreateBookingPayload;
    const provider = DEMO_PROVIDERS.find((p) => p.id === payload.providerId) ?? getDemoProvider();
    const service = provider.services.find((s) => s.id === payload.serviceId);
    state.nextBookingRef += 1;
    const booking: BookingRecord = {
      id: `bk-new-${state.nextBookingRef}`,
      ref: `#NLBB-${state.nextBookingRef}`,
      customerId: user.id,
      providerId: provider.id,
      providerName: provider.name,
      providerImage: provider.coverImage,
      providerPhone: provider.phone,
      providerWhatsapp: provider.whatsapp,
      customerName: user.name,
      customerPhone: user.phone,
      customerAvatar: user.avatar,
      serviceName: payload.serviceName ?? service?.name ?? 'Service',
      servicePrice: payload.servicePrice ?? service?.price ?? 0,
      scheduledAt: payload.scheduledAt,
      endAt: new Date(
        new Date(payload.scheduledAt).getTime() + (payload.duration ?? service?.duration ?? 60) * 60_000
      ).toISOString(),
      duration: payload.duration ?? service?.duration ?? 60,
      status: 'pending',
      notes: payload.notes ?? null,
      totalAmount: payload.servicePrice ?? service?.price ?? 0,
      platformFee: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.bookings.unshift(booking);
    state.providerNotifications.unshift({
      id: `pnotif-new-${state.nextBookingRef}`,
      title: 'New booking request',
      body: `${user.name} requested ${booking.serviceName}`,
      type: 'booking',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    return clone(booking) as T;
  }

  const bookingStatusMatch = matchPath(rawPath, /^bookings\/([^/]+)\/status$/);
  if (method === 'PATCH' && bookingStatusMatch) {
    const booking = state.bookings.find((b) => b.id === bookingStatusMatch[0]);
    if (!booking) throw demoError('Booking not found', 404);
    const next = (body as { status?: string })?.status;
    if (next === 'accepted' || next === 'confirmed' || next === 'upcoming') booking.status = 'accepted';
    else if (next === 'declined' || next === 'rejected') booking.status = 'rejected';
    else if (next === 'completed') booking.status = 'completed';
    else if (next === 'cancelled') booking.status = 'cancelled';
    booking.updatedAt = new Date().toISOString();
    return clone(booking) as T;
  }

  // ── Notifications ─────────────────────────────────────────────────
  if (method === 'GET' && rawPath === 'notifications/me') {
    const list =
      user.role === 'provider' ? state.providerNotifications : state.customerNotifications;
    return clone(list) as T;
  }

  const notifReadMatch = matchPath(rawPath, /^notifications\/([^/]+)\/read$/);
  if (method === 'PATCH' && notifReadMatch) {
    const list =
      user.role === 'provider' ? state.providerNotifications : state.customerNotifications;
    const item = list.find((n) => n.id === notifReadMatch[0]);
    if (item) item.isRead = true;
    return clone(item ?? list[0]) as T;
  }

  if (method === 'PATCH' && rawPath === 'notifications/me/read-all') {
    const list =
      user.role === 'provider' ? state.providerNotifications : state.customerNotifications;
    list.forEach((n) => {
      n.isRead = true;
    });
    return { updated: list.length } as T;
  }

  // ── Provider management ───────────────────────────────────────────
  if (method === 'GET' && rawPath === 'providers/me/profile') {
    return clone(getDemoProvider()) as T;
  }

  if (method === 'POST' && rawPath === 'providers/me/profile') {
    return clone({ ...getDemoProvider(), ...(body as object) }) as T;
  }

  if (method === 'POST' && rawPath === 'auth/push-token') {
    return { registered: false } as T;
  }

  if (method === 'PATCH' && rawPath === 'providers/me/open-state') {
    const provider = getDemoProvider();
    provider.isOpen = Boolean((body as { isOpen?: boolean })?.isOpen);
    return clone(provider) as T;
  }

  if (method === 'POST' && rawPath === 'providers/me/media') {
    const dataUri = (body as { dataUri?: string })?.dataUri;
    return { url: dataUri ?? getDemoProvider().coverImage } as T;
  }

  if (method === 'GET' && rawPath === 'providers/me/services') {
    return clone(state.services) as T;
  }

  if (method === 'POST' && rawPath === 'providers/me/services') {
    const payload = body as {
      name: string;
      description: string;
      duration: number;
      price: number;
      category: string;
    };
    state.nextServiceRef += 1;
    const created = {
      id: `svc-new-${state.nextServiceRef}`,
      ...payload,
      isActive: true,
    };
    state.services.unshift(created);
    return clone(created) as T;
  }

  const serviceMatch = matchPath(rawPath, /^providers\/me\/services\/([^/]+)$/);
  if (method === 'PATCH' && serviceMatch) {
    const service = state.services.find((s) => s.id === serviceMatch[0]);
    if (!service) throw demoError('Service not found', 404);
    Object.assign(service, body);
    return clone(service) as T;
  }

  const serviceActiveMatch = matchPath(rawPath, /^providers\/me\/services\/([^/]+)\/active$/);
  if (method === 'PATCH' && serviceActiveMatch) {
    const service = state.services.find((s) => s.id === serviceActiveMatch[0]);
    if (!service) throw demoError('Service not found', 404);
    service.isActive = Boolean((body as { isActive?: boolean })?.isActive);
    return clone(service) as T;
  }

  if (method === 'DELETE' && serviceMatch) {
    state.services = state.services.filter((s) => s.id !== serviceMatch[0]);
    return { deleted: true, id: serviceMatch[0] } as T;
  }

  // ── Subscription & payments ───────────────────────────────────────
  if (method === 'GET' && rawPath === 'subscriptions/me') {
    return clone(getDemoSubscription()) as T;
  }

  if (method === 'POST' && rawPath === 'subscriptions/me/pay') {
    return {
      checkoutRequestId: `CHK-DEMO-${Date.now()}`,
      message: 'Demo payment simulated. Your plan stays active.',
    } as T;
  }

  if (method === 'GET' && rawPath === 'payments/me') {
    return clone(DEMO_PAYMENTS) as T;
  }

  if (method === 'GET' && rawPath === 'analytics/provider/me') {
    return clone(DEMO_ANALYTICS) as T;
  }

  // ── Preferences ───────────────────────────────────────────────────
  if (method === 'GET' && rawPath === 'auth/preferences') {
    return clone(DEMO_PREFERENCES) as T;
  }

  if (method === 'PATCH' && rawPath === 'auth/preferences') {
    return clone({ ...DEMO_PREFERENCES, ...(body as Partial<CustomerPreferences>) }) as T;
  }

  throw demoError(`Demo API route not implemented: ${method} ${path}`, 404);
};

const demoError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number; code: string; name: string };
  error.name = 'ApiClientError';
  error.status = status;
  error.code = 'DEMO_ROUTE';
  return error;
};

export { resetDemoState };

import { User, UserRole } from '../../types';

export const DEMO_PASSWORD = 'demo1234';
export const DEMO_TOKEN_PREFIX = 'demo:';

export const DEMO_USERS: Record<string, User> = {
  'demo@customer.com': {
    id: 'demo-customer-001',
    name: 'Kevo Mwangi',
    email: 'demo@customer.com',
    phone: '+254712345678',
    role: 'customer',
    location: 'Kilimani, Nairobi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  },
  'demo@provider.com': {
    id: 'demo-provider-001',
    name: 'Sean Ochieng',
    email: 'demo@provider.com',
    phone: '+254723456789',
    role: 'provider',
    location: 'Westlands, Nairobi',
    avatar: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=200&auto=format&fit=crop',
  },
};

export const demoTokenFor = (email: string) => `${DEMO_TOKEN_PREFIX}${email.trim().toLowerCase()}`;

export const getDemoUserFromToken = (token: string | null | undefined): User | null => {
  if (!token?.startsWith(DEMO_TOKEN_PREFIX)) {
    return null;
  }
  return DEMO_USERS[token.slice(DEMO_TOKEN_PREFIX.length)] ?? null;
};

export const isDemoEmail = (email: string) => email.trim().toLowerCase() in DEMO_USERS;

export const getDemoCredentialsHint = (role: UserRole) =>
  role === 'provider'
    ? 'demo@provider.com · demo1234'
    : 'demo@customer.com · demo1234';

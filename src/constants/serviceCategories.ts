import { Category } from '../types';

export const DEFAULT_SERVICE_CATEGORIES: Category[] = [
  { id: 'cat-barber', name: 'Barber', icon: 'mustache', slug: 'barber' },
  { id: 'cat-hair', name: 'Hair', icon: 'scissors-cutting', slug: 'hair' },
  { id: 'cat-nails', name: 'Nails', icon: 'hand-back-right-outline', slug: 'nails' },
  { id: 'cat-massage', name: 'Massage', icon: 'hand-heart', slug: 'massage' },
  { id: 'cat-facial', name: 'Facial', icon: 'face-woman-shimmer', slug: 'facial' },
  { id: 'cat-tattoo', name: 'Tattoo', icon: 'brush', slug: 'tattoo' },
  { id: 'cat-salon', name: 'Salon', icon: 'hair-dryer', slug: 'salon' },
  { id: 'cat-spa', name: 'Spa', icon: 'spa', slug: 'spa' },
  { id: 'cat-makeup', name: 'Makeup', icon: 'lipstick', slug: 'makeup' },
  { id: 'cat-waxing', name: 'Waxing', icon: 'flower-outline', slug: 'waxing' },
  { id: 'cat-lashes', name: 'Lashes', icon: 'eye-outline', slug: 'lashes' },
  { id: 'cat-piercing', name: 'Piercing', icon: 'needle', slug: 'piercing' },
];

export const DEFAULT_SERVICE_CATEGORY_NAMES = DEFAULT_SERVICE_CATEGORIES.map((category) => category.name);

const toCategoryKey = (category: Pick<Category, 'name' | 'slug'>) =>
  (category.slug?.trim() || category.name.trim()).toLowerCase();

export const mergeCategoriesWithDefaults = (categories: Category[]) => {
  const merged = new Map<string, Category>();

  for (const category of DEFAULT_SERVICE_CATEGORIES) {
    merged.set(toCategoryKey(category), category);
  }

  for (const category of categories) {
    merged.set(toCategoryKey(category), {
      ...category,
      icon: category.icon || 'scissors-cutting',
    });
  }

  return [...merged.values()];
};

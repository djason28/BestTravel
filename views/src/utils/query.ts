import type { FilterOptions } from '../types';

// Builds query string from FilterOptions (same rules both admin & public pages)
export function buildFilterQuery(filters: FilterOptions): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(','));
      return;
    }
    if (typeof value === 'boolean') {
      if (value) params.set(key, 'true');
      return;
    }
    const str = String(value);
    if (str !== '') params.set(key, str);
  });
  return params.toString();
}

// Parse URLSearchParams into FilterOptions (subset used on public page)
export function parseFilterParams(sp: URLSearchParams): Partial<FilterOptions> {
  const getList = (k: string) => (sp.get(k) || '').split(',').map(s => s.trim()).filter(Boolean);
  const out: Partial<FilterOptions> = {
    search: sp.get('search') || '',
    category: sp.get('category') || '',
    categories: getList('categories'),
    categoryMode: (sp.get('categoryMode') as FilterOptions['categoryMode']) || 'any',
    destination: sp.get('destination') || '',
    destinations: getList('destinations'),
    availability: sp.get('availability') || '',
    sortBy: (sp.get('sortBy') as FilterOptions['sortBy']) || 'newest',
    featuredOnly: sp.get('featuredOnly') === 'true',
    notFeatured: sp.get('notFeatured') === 'true',
    status: (sp.get('status') as any) || undefined,
    page: Number(sp.get('page') || 1),
    limit: Number(sp.get('limit') || 12),
    priceMin: sp.get('priceMin') ? Number(sp.get('priceMin')) : undefined,
    priceMax: sp.get('priceMax') ? Number(sp.get('priceMax')) : undefined,
    durationMin: sp.get('durationMin') ? Number(sp.get('durationMin')) : undefined,
    durationMax: sp.get('durationMax') ? Number(sp.get('durationMax')) : undefined,
    participantsMin: sp.get('participantsMin') ? Number(sp.get('participantsMin')) : undefined,
    participantsMax: sp.get('participantsMax') ? Number(sp.get('participantsMax')) : undefined,
  };
  return out;
}
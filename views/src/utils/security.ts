export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s()+-]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

export const formatPrice = (price: number, currency: string = 'IDR'): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(price);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Debounce utility with friendly typing for callbacks like (value: string) => void
export const debounce = <Args extends any[]>(
  func: (...args: Args) => void,
  wait: number
): ((...args: Args) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const getWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  const base = import.meta.env?.VITE_WHATSAPP_NUMBER && phone === cleanPhone ? import.meta.env.VITE_WHATSAPP_NUMBER : cleanPhone;
  return `https://wa.me/${base}?text=${encodedMessage}`;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Turn a free-text categories input into clean tokens
export const tokenizeCategories = (input: string): string[] => {
  return input
    .split(/[;,]+|\s{2,}|\n+/) // split by comma, semicolon, multiple spaces, or newline
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\s+/g, ' '));
};

// Format categories to show max 3, with "+n" for remaining
export const formatCategories = (categories: string[], maxVisible: number = 3): { visible: string[]; remaining: number } => {
  if (!categories || categories.length === 0) {
    return { visible: [], remaining: 0 };
  }
  
  if (categories.length <= maxVisible) {
    return { visible: categories, remaining: 0 };
  }
  
  return {
    visible: categories.slice(0, maxVisible),
    remaining: categories.length - maxVisible,
  };
};

// Ensure image URLs are usable by the browser. If a relative path is provided, try to prefix
// with a configurable assets base. Falls back to original when uncertain.
export const resolveImageUrl = (url?: string): string | undefined => {
  if (!url) return url;
  if (/^(data:|https?:\/\/)/i.test(url)) return url; // already absolute or data URI
  const base = (import.meta as any)?.env?.VITE_ASSETS_BASE_URL as string | undefined;
  if (base) {
    return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }
  return url; // leave as-is; backend likely serves it relative to API host
};

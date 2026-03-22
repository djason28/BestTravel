import { en } from './i18n/en';
import { zh } from './i18n/zh';

type Lang = 'en' | 'zh';

const translations: Record<Lang, Record<string, string>> = { en, zh };

// Cached resolved language — avoids parsing cookies/localStorage on every t() call
let _cachedLang: Lang | null = null;

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function currentLang(): Lang {
  if (_cachedLang) return _cachedLang;
  const cookieLang = getCookie('lang');
  if (cookieLang === 'zh') { _cachedLang = 'zh'; return 'zh'; }
  const stored = localStorage.getItem('lang');
  if (stored === 'zh') { _cachedLang = 'zh'; return 'zh'; }
  // Fallback to browser
  const navLang = navigator.language?.toLowerCase();
  if (navLang.startsWith('zh')) { _cachedLang = 'zh'; return 'zh'; }
  _cachedLang = 'en';
  return 'en';
}

export function t(key: string): string {
  const lang = currentLang();
  return translations[lang][key] || translations.en[key] || key;
}

export function toggleLang(): Lang {
  const next = currentLang() === 'en' ? 'zh' : 'en';
  localStorage.setItem('lang', next);
  setCookie('lang', next, 30);
  _cachedLang = next;
  return next;
}

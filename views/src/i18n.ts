import { en } from './i18n/en';
import { zh } from './i18n/zh';

type Lang = 'en' | 'zh';

const translations: Record<Lang, Record<string, string>> = { en, zh };

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function currentLang(): Lang {
  const cookieLang = getCookie('lang');
  if (cookieLang === 'zh') return 'zh';
  const stored = localStorage.getItem('lang');
  if (stored === 'zh') return 'zh';
  // Fallback to browser
  const navLang = navigator.language?.toLowerCase();
  if (navLang.startsWith('zh')) return 'zh';
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
  return next;
}

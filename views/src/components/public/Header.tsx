import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PrefetchLink } from '../common';
import { Menu, X, MessageCircle } from 'lucide-react';
import logo from '@/assets/branding/logo pendek.png';
import { toggleLang, currentLang, t } from '../../i18n';
import { useNavigationState } from '../../contexts/NavigationContext';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tempLang, setTempLang] = useState(currentLang());
  const location = useLocation();

  const lang = currentLang();
  const { startNavigation } = useNavigationState();
  const navLinks = [
    { path: '/', label: lang === 'zh' ? '首页' : 'Home' },
    { path: '/packages', label: lang === 'zh' ? '套餐' : 'Packages' },
    { path: '/about', label: lang === 'zh' ? '关于我们' : 'About' },
    { path: '/contact', label: lang === 'zh' ? '联系我们' : 'Contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="Best Tour and Travel Logo" className="h-16 w-auto select-none" draggable={false} />
            <div className="flex flex-col">
              {/* <span className="text-xl md:text-2xl font-display font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-pink-700 transition-all">BEST Tour and Travel</span> */}
              <span className="text-xl md:text-2xl font-display font-bold bg-gradient-to-r from-red-600 via-yellow-600 to-green-600 bg-clip-text text-transparent group-hover:from-red-700 group-hover:via-yellow-700 group-hover:to-green-700 transition-all">BEST Tour and Travel</span>
              <span className="text-[11px] md:text-xs text-gray-500 font-medium tracking-wide group-hover:text-black transition-colors leading-tight">{t('header_subtagline_header')}</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label={lang==='zh' ? '主导航' : 'Main navigation'}>
            {navLinks.map((link) => (
              <PrefetchLink
                key={link.path}
                to={link.path}
                prefetchEnabled
                prefetchOn={link.path === '/about' || link.path === '/contact' ? 'viewport' : 'hover'}
                onClick={() => startNavigation()}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {link.label}
              </PrefetchLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '6281234567890'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-36"
              aria-label={lang === 'zh' ? '通过微信联系我们' : 'Contact us on WhatsApp'}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{lang === 'zh' ? '微信' : 'WhatsApp'}</span>
            </a>
            <div className="relative inline-flex items-center bg-gray-200 rounded-full p-1 w-32" aria-label={lang==='zh' ? '语言切换' : 'Language toggle'} role="group">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-blue-600 rounded-full transition-transform duration-300 ease-in-out ${
                  tempLang === 'zh' ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
              <button
                onClick={() => { 
                  if (tempLang !== 'en') { 
                    setTempLang('en');
                    setTimeout(() => { toggleLang(); window.location.reload(); }, 300);
                  }
                }}
                className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  tempLang === 'en' ? 'text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
                aria-label={lang==='zh' ? '切换语言为英文' : 'Switch language to English'}
              >
                EN
              </button>
              <button
                onClick={() => { 
                  if (tempLang !== 'zh') { 
                    setTempLang('zh');
                    setTimeout(() => { toggleLang(); window.location.reload(); }, 300);
                  }
                }}
                className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  tempLang === 'zh' ? 'text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
                aria-label={lang==='zh' ? '当前语言中文' : 'Switch language to Chinese'}
              >
                中文
              </button>
            </div>
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4" aria-label={lang==='zh' ? '移动导航' : 'Mobile navigation'}>
              {navLinks.map((link) => (
                <PrefetchLink
                  key={link.path}
                  to={link.path}
                  prefetchEnabled
                  prefetchOn={link.path === '/about' || link.path === '/contact' ? 'viewport' : 'focus'}
                  onClick={() => { setIsMobileMenuOpen(false); startNavigation(); }}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                </PrefetchLink>
              ))}
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '6281234567890'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-36"
                aria-label={lang === 'zh' ? '通过微信联系我们' : 'Contact us on WhatsApp'}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{lang === 'zh' ? '微信' : 'WhatsApp'}</span>
              </a>
              <div className="relative inline-flex items-center bg-gray-200 rounded-full p-1 w-32" aria-label={lang==='zh' ? '语言切换' : 'Language toggle'} role="group">
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-blue-600 rounded-full transition-transform duration-300 ease-in-out ${
                    tempLang === 'zh' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                />
                <button
                  onClick={() => { 
                    if (tempLang !== 'en') { 
                      setTempLang('en');
                      setTimeout(() => { toggleLang(); window.location.reload(); }, 300);
                    }
                  }}
                  className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    tempLang === 'en' ? 'text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                  aria-label={lang==='zh' ? '切换语言为英文' : 'Switch language to English'}
                >
                  EN
                </button>
                <button
                  onClick={() => { 
                    if (tempLang !== 'zh') { 
                      setTempLang('zh');
                      setTimeout(() => { toggleLang(); window.location.reload(); }, 300);
                    }
                  }}
                  className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    tempLang === 'zh' ? 'text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                  aria-label={lang==='zh' ? '当前语言中文' : 'Switch language to Chinese'}
                >
                  中文
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PrefetchLink } from "../common";
import { Menu, X, MessageCircle } from "lucide-react";
import logo from "@/assets/branding/logo pendek.png";
import { t } from "../../i18n";
import { useLang } from "../../contexts/LangContext";
import { useNavigationState } from "../../contexts/NavigationContext";

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { lang, switchLang } = useLang();
  const location = useLocation();
  const { startNavigation, isNavigating } = useNavigationState();
  const lastNavRef = useRef<{ path: string; ts: number }>({
    path: location.pathname,
    ts: Date.now(),
  });
  const THROTTLE_MS = 400; // prevent rapid double navigation extending loading state

  // Sliding indicator state for desktop nav
  const navContainerRef = useRef<HTMLElement>(null);
  const navLinkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [indicatorReady, setIndicatorReady] = useState(false);
  const navLinks = [
    { path: "/", label: lang === "zh" ? "首页" : "Home" },
    { path: "/packages", label: lang === "zh" ? "套餐" : "Packages" },
    { path: "/cars", label: lang === "zh" ? "租车" : "Cars" },
    { path: "/about", label: lang === "zh" ? "关于我们" : "About" },
    { path: "/contact", label: lang === "zh" ? "联系我们" : "Contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Compute sliding indicator position
  const updateIndicator = () => {
    const activeIndex = navLinks.findIndex((l) => isActive(l.path));
    const el = navLinkRefs.current[activeIndex];
    const container = navContainerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      });
    } else {
      setIndicator(null);
    }
  };

  // Use layoutEffect for initial render (no animation), then effect for route changes
  useLayoutEffect(() => {
    updateIndicator();
    // Enable transitions after first paint
    requestAnimationFrame(() => setIndicatorReady(true));
  }, []);

  useEffect(() => {
    updateIndicator();
  }, [location.pathname, lang]);

  const LangToggle = () => (
    <div
      className="relative inline-flex items-center bg-gray-200 rounded-full p-1 w-32"
      aria-label={lang === "zh" ? "语言切换" : "Language toggle"}
      role="group"
    >
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-[#0891b2] rounded-full transition-transform duration-300 ease-in-out ${
          lang === "zh" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <button
        onClick={() => {
          if (lang !== "en") switchLang();
        }}
        className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
          lang === "en" ? "text-white" : "text-gray-700 hover:text-gray-900"
        }`}
        aria-label={
          lang === "zh" ? "切换语言为英文" : "Switch language to English"
        }
      >
        EN
      </button>
      <button
        onClick={() => {
          if (lang !== "zh") switchLang();
        }}
        className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
          lang === "zh" ? "text-white" : "text-gray-700 hover:text-gray-900"
        }`}
        aria-label={
          lang === "zh" ? "当前语言中文" : "Switch language to Chinese"
        }
      >
        中文
      </button>
    </div>
  );

  return (
    <header className="bg-white shadow-sm border-b border-sky-100 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="Best Tour and Travel Logo"
              className="h-16 w-auto select-none"
              draggable={false}
            />
            <div className="flex flex-col">
              {/* <span className="text-xl md:text-2xl font-display font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-pink-700 transition-all">BEST Tour and Travel</span> */}
              <span className="text-xl md:text-2xl font-display font-bold bg-gradient-to-r from-[#0c4a6e] via-[#0891b2] to-teal-500 bg-clip-text text-transparent transition-all">
                TripXB
              </span>
              <span className="text-[11px] md:text-xs text-gray-500 font-medium tracking-wide group-hover:text-[#0891b2] transition-colors leading-tight">
                {t("header_subtagline_header")}
              </span>
            </div>
          </Link>

          <nav
            ref={navContainerRef}
            className="hidden md:flex items-center gap-8 relative"
            aria-label={lang === "zh" ? "主导航" : "Main navigation"}
          >
            {/* Sliding active indicator */}
            {indicator && (
              <div
                className="absolute bottom-0 h-[3px] bg-[#0891b2] rounded-full"
                style={{
                  left: indicator.left,
                  width: indicator.width,
                  transition: indicatorReady
                    ? "left 0.3s ease-in-out, width 0.3s ease-in-out"
                    : "none",
                }}
              />
            )}
            {navLinks.map((link, i) => (
              <PrefetchLink
                key={link.path}
                to={link.path}
                ref={(el) => {
                  navLinkRefs.current[i] = el;
                }}
                prefetchEnabled
                prefetchOn={
                  link.path === "/about" || link.path === "/contact"
                    ? "viewport"
                    : "hover"
                }
                onClick={(e) => {
                  const now = Date.now();
                  // Ignore if already on this path or rapid double click
                  if (
                    location.pathname === link.path ||
                    (now - lastNavRef.current.ts < THROTTLE_MS &&
                      lastNavRef.current.path === link.path)
                  ) {
                    e.preventDefault();
                    return;
                  }
                  lastNavRef.current = { path: link.path, ts: now };
                  startNavigation();
                }}
                className={`text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-lg ${
                  isActive(link.path)
                    ? "text-[#0891b2] font-semibold"
                    : "text-gray-700 hover:text-[#0891b2] hover:bg-gray-50"
                } ${isNavigating ? "pointer-events-none opacity-50" : ""}`}
              >
                {link.label}
              </PrefetchLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "6285283918338"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-36"
              aria-label={
                lang === "zh" ? "通过微信联系我们" : "Contact us on WhatsApp"
              }
            >
              <MessageCircle className="h-4 w-4" />
              <span>{lang === "zh" ? "微信" : "WhatsApp"}</span>
            </a>
            <LangToggle />
          </div>

          {/* Mobile: lang toggle + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <LangToggle />
            <button
              className="text-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav
              className="flex flex-col gap-4"
              aria-label={lang === "zh" ? "移动导航" : "Mobile navigation"}
            >
              {navLinks.map((link) => (
                <PrefetchLink
                  key={link.path}
                  to={link.path}
                  prefetchEnabled
                  prefetchOn={
                    link.path === "/about" || link.path === "/contact"
                      ? "viewport"
                      : "focus"
                  }
                  onClick={(e) => {
                    const now = Date.now();
                    if (
                      location.pathname === link.path ||
                      (now - lastNavRef.current.ts < THROTTLE_MS &&
                        lastNavRef.current.path === link.path)
                    ) {
                      e.preventDefault();
                      setIsMobileMenuOpen(false);
                      return;
                    }
                    lastNavRef.current = { path: link.path, ts: now };
                    setIsMobileMenuOpen(false);
                    startNavigation();
                  }}
                  className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg ${
                    isActive(link.path)
                      ? "text-[#0891b2] bg-[#0891b2]/10 shadow-inner font-semibold"
                      : "text-gray-700 hover:text-[#0891b2] hover:bg-gray-50"
                  } ${isNavigating ? "pointer-events-none opacity-50" : ""}`}
                >
                  {link.label}
                </PrefetchLink>
              ))}
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "6285283918338"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-36"
                aria-label={
                  lang === "zh" ? "通过微信联系我们" : "Contact us on WhatsApp"
                }
              >
                <MessageCircle className="h-4 w-4" />
                <span>{lang === "zh" ? "微信" : "WhatsApp"}</span>
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

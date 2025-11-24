import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import logo from '@/assets/branding/logo pendek.png';
import { t } from '../../i18n';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link to="/" className="flex-shrink-0">
                <img src={logo} alt="Bintan Batam Exclusive Trip Logo" className="h-24 w-auto select-none" draggable={false} />
              </Link>
              <div className="flex flex-col justify-center">
                {/* <h3 className="text-xl font-display font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">Bintan Batam</h3>
                <h3 className="text-xl font-display font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">Exclusive Trip</h3> */}
                <h3 className="text-xl font-display font-bold bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 bg-clip-text text-transparent leading-tight">Bintan Batam</h3>
                <h3 className="text-xl font-display font-bold bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 bg-clip-text text-transparent leading-tight">Exclusive Trip</h3>
              </div>
            </div>
            <p className="text-sm leading-relaxed">
              {t('footer_tagline')}
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="hover:text-blue-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-500 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t('quick_links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-blue-500 transition-colors">{t('home')}</Link>
              </li>
              <li>
                <Link to="/packages" className="hover:text-blue-500 transition-colors">{t('packages')}</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-500 transition-colors">{t('about_us')}</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-500 transition-colors">{t('contact_us')}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t('popular_destinations')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/packages?destination=bali" className="hover:text-blue-500 transition-colors">{t('dest_bali')}</Link>
              </li>
              <li>
                <Link to="/packages?destination=lombok" className="hover:text-blue-500 transition-colors">{t('dest_lombok')}</Link>
              </li>
              <li>
                <Link to="/packages?destination=yogyakarta" className="hover:text-blue-500 transition-colors">{t('dest_yogyakarta')}</Link>
              </li>
              <li>
                <Link to="/packages?destination=raja-ampat" className="hover:text-blue-500 transition-colors">{t('dest_raja_ampat')}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t('contact_us')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Jl. Raya Senggigi No. 123, Lombok, Indonesia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <a href="tel:+6281234567890" className="text-sm hover:text-blue-500 transition-colors">
                  +62 812-3456-7890
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <a href="mailto:info@besttravel.com" className="text-sm hover:text-blue-500 transition-colors">
                  info@besttravel.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>{t('copyright_prefix')} {new Date().getFullYear()} Bintan Batam Exclusive Trip. {t('all_rights_reserved')}</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link to="/privacy" className="hover:text-blue-500 transition-colors">{t('privacy_policy')}</Link>
            <Link to="/terms" className="hover:text-blue-500 transition-colors">{t('terms_of_service')}</Link>
            <Link to="/faq" className="hover:text-blue-500 transition-colors">{t('faq')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

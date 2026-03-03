import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  TrendingUp,
  Phone,
} from 'lucide-react';
import { packageApi } from '../../services/api';
import type { Package } from '../../types';
import { formatPrice, getWhatsAppLink } from '../../utils/security';
import { ContentLoader } from '../../components/common/ContentLoader';
import { useNavigationState } from '../../contexts/NavigationContext';
import { Button } from '../../components/common/Button';
import { t, currentLang } from '../../i18n';

export const PackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true); // still pause on hover; button removed
  const autoPlayInterval = useRef<number | null>(null);
  const fullScreenInterval = useRef<number | null>(null);
  const touchStart = useRef<{x:number;y:number}|null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const { endNavigation } = useNavigationState();

  useEffect(() => {
    if (slug) {
      loadPackage(slug);
    }
  }, [slug]);

  const loadPackage = async (slug: string) => {
    setIsLoading(true);
    try {
      const response = await packageApi.getBySlug(slug, currentLang() === 'zh' ? 'zh' : 'en');
      if (response.success && response.data) {
        setPkg(response.data);
        await packageApi.incrementView(response.data.id);
      }
    } catch (error) {
      console.error('Failed to load package:', error);
    } finally {
      setIsLoading(false);
      endNavigation();
    }
  };

  const handleWhatsAppClick = () => {
    if (!pkg) return;
    const message = `Hello! I'm interested in the "${pkg.title}" package.\n\nPackage Details:\n- Duration: ${pkg.duration} ${pkg.durationUnit}\n- Price: ${formatPrice(pkg.price, pkg.currency)}\n- Destination: ${pkg.destination}\n\nI would like to know more details and availability.`;
      const link = getWhatsAppLink('6285283918338', message);
    window.open(link, '_blank');
  };

  const nextImage = () => {
    if (pkg) {
      setCurrentImageIndex((prev) => (prev + 1) % pkg.images.length);
    }
  };

  const prevImage = () => {
    if (pkg) {
      setCurrentImageIndex((prev) => (prev - 1 + pkg.images.length) % pkg.images.length);
    }
  };

  // Autoplay (advance every 5s) unless gallery open or user paused
  useEffect(() => {
    if (!pkg || !autoPlay || isGalleryOpen || pkg.images.length < 2) return;
    autoPlayInterval.current && clearInterval(autoPlayInterval.current);
    autoPlayInterval.current = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % pkg.images.length);
    }, 5000);
    return () => {
      autoPlayInterval.current && clearInterval(autoPlayInterval.current);
    };
  }, [pkg, autoPlay, isGalleryOpen]);

  // Fullscreen autoplay (independent from main slider autoplay)
  useEffect(() => {
    if (!isGalleryOpen || !pkg || pkg.images.length < 2) {
      fullScreenInterval.current && clearInterval(fullScreenInterval.current);
      fullScreenInterval.current = null;
      return;
    }
    fullScreenInterval.current && clearInterval(fullScreenInterval.current);
    fullScreenInterval.current = window.setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % pkg.images.length);
    }, 6000); // 6s for slower immersive fullscreen
    return () => {
      fullScreenInterval.current && clearInterval(fullScreenInterval.current);
    };
  }, [isGalleryOpen, pkg]);

  // Close fullscreen on ESC key
  useEffect(() => {
                  <a
                    href="tel:+6285283918338"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    +62-852-8391-8338
                  </a>
        prevImage();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isGalleryOpen, pkg]);

  const images = pkg?.images || [];
  // Lazy preload remaining images once package loaded
  useEffect(() => {
    if (!images || images.length < 2) return;
    const toPreload = images.slice(1);
    toPreload.forEach(img => {
      if (img?.url) {
        const i = new Image();
        i.src = img.url;
      }
    });
  }, [images]);

  if (isLoading) {
    return <ContentLoader overlay minHeight={500} />;
  }

  if (!pkg) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('package_not_found')}</h2>
        <Link to="/packages" className="text-blue-600 hover:underline">
          {t('browse_all_packages')}
        </Link>
      </div>
    );
  }

  const localizeUnit = (unit: string) => {
    if (currentLang() === 'zh') {
      switch (unit) {
        case 'days': return '天';
        case 'nights': return '晚';
        case 'hours': return '小时';
        default: return unit;
      }
    }
    return unit;
  };

  // Normalisasi agar field array yang mungkin datang sebagai null (dari Go: slice nil -> JSON null)
  // images already defined above for autoplay logic.
  const highlights = pkg?.highlights || [];
  const itinerary = pkg?.itinerary || [];
  const included = pkg?.included || [];
  const excluded = pkg?.excluded || [];
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link to="/packages" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ChevronLeft className="h-4 w-4" />
          <span>{t('back_to_packages')}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div
                className="relative h-[500px] overflow-hidden group"
                onMouseEnter={() => setAutoPlay(false)}
                onMouseLeave={() => setAutoPlay(true)}
                onTouchStart={e => {
                  const t = e.touches[0];
                  touchStart.current = { x: t.clientX, y: t.clientY };
                }}
                onTouchEnd={e => {
                  if (!touchStart.current) return;
                  const t = e.changedTouches[0];
                  const dx = t.clientX - touchStart.current.x;
                  const dy = t.clientY - touchStart.current.y;
                  const threshold = 40;
                  if (Math.abs(dx) > threshold && Math.abs(dy) < 80) {
                    if (dx < 0) nextImage(); else prevImage();
                    setAutoPlay(false);
                  }
                  touchStart.current = null;
                }}
              >
                {images.map((image, i) => (
                  <img
                    key={image.id || i}
                    src={image.url || 'https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg'}
                    alt={image.alt || pkg.title}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className={`absolute inset-0 w-full h-full object-cover cursor-pointer select-none transition-opacity duration-700 ease-in-out ${i === currentImageIndex ? 'opacity-100' : 'opacity-0'} ${i === currentImageIndex ? '' : 'pointer-events-none'}`}
                    onClick={() => setIsGalleryOpen(true)}
                    draggable={false}
                  />
                ))}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white shadow transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white shadow transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index === currentImageIndex
                              ? 'bg-white w-8'
                              : 'bg-white/50 w-2 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4">
                  {images.slice(0, 4).map((image, index) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={image.alt}
                      loading="lazy"
                      className={`w-full h-24 object-cover rounded-lg cursor-pointer transition-all ${
                        index === currentImageIndex ? 'ring-2 ring-blue-600' : 'opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2 relative">
                    {currentLang()==='zh' ? (pkg.titleZh || pkg.title) : pkg.title}
                    <span className="block mt-3 h-1 w-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded"></span>
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.categories && pkg.categories.map((cat, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {cat}
                      </span>
                    ))}
                    {pkg.featured && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current" />
                        {t('featured')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('destination')}</p>
                    <p className="font-semibold text-gray-900">{currentLang()==='zh' ? (pkg.destinationZh || pkg.destination) : pkg.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('duration')}</p>
                    <p className="font-semibold text-gray-900">{pkg.duration} {localizeUnit(pkg.durationUnit)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('group_size')}</p>
                    <p className="font-semibold text-gray-900">{currentLang()==='zh' ? `最多 ${pkg.maxParticipants} 人` : `Max ${pkg.maxParticipants}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('views')}</p>
                    <p className="font-semibold text-gray-900">{pkg.viewCount}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('overview')}</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{currentLang()==='zh' ? (pkg.descriptionZh || pkg.description) : pkg.description}</p>

                {highlights.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('highlights')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {itinerary.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('itinerary')}</h2>
                <div className="space-y-6">
                  {itinerary.map((day) => (
                    <div key={day.day} className="border-l-4 border-blue-600 pl-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {currentLang() === 'zh' ? `${t('day_label')}${day.day}天` : `${t('day_label')} ${day.day}`}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900">{currentLang()==='zh' ? (day.titleZh || day.title) : day.title}</h3>
                      </div>
                      <p className="text-gray-700 mb-3">{currentLang()==='zh' ? (day.descriptionZh || day.description) : day.description}</p>
                      {(day.activities || []).length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {(day.activities || []).map((activity, index) => (
                            <li key={index}>{activity}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    {t('whats_included')}
                  </h3>
                  {/* Decorative underline directly under Included subtitle */}
                  <span className="block mt-2 mb-4 h-1 w-32 bg-gradient-to-r from-green-500 via-blue-600 to-purple-600 rounded" />
                  <ul className="space-y-2">
                    {included.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <XCircle className="h-6 w-6 text-red-600" />
                    {t('whats_excluded')}
                  </h3>
                  {/* Decorative underline directly under Excluded subtitle */}
                  <span className="block mt-2 mb-4 h-1 w-32 bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 rounded" />
                  <ul className="space-y-2">
                    {excluded.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">{t('starting_from')}</p>
                <p className="text-4xl font-bold text-blue-600">{formatPrice(pkg.price, pkg.currency)}</p>
                <p className="text-sm text-gray-600 mt-1">{t('per_person')}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">{pkg.availability}</span>
                </div>
              </div>

              <Button
                onClick={handleWhatsAppClick}
                className="w-full mb-3 bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                {t('book_via_whatsapp_cta')}
              </Button>

              <Link to="/contact">
                <Button variant="outline" className="w-full">
                  {t('contact_us')}
                </Button>
              </Link>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">{t('need_help')}</h4>
                <p className="text-sm text-gray-600 mb-4">
                  {t('need_help_desc')}
                </p>
                <a
                  href="tel:+6285283918338"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  +62-852-8391-8338
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGalleryOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center overflow-hidden"
          onTouchStart={e => {
            const t = e.touches[0];
            touchStart.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={e => {
            if (!touchStart.current) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStart.current.x;
            const dy = t.clientY - touchStart.current.y;
            const threshold = 40;
            if (Math.abs(dx) > threshold && Math.abs(dy) < 80) {
              if (dx < 0) nextImage(); else prevImage();
            }
            touchStart.current = null;
          }}
        >
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close gallery"
          >
            <X className="h-8 w-8" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
          {/* Fade + Ken Burns */}
          {images.map((image, i) => (
            <img
              key={image.id || i}
              src={image.url}
              alt={image.alt || pkg.title}
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`absolute max-w-[90vw] max-h-[90vh] object-contain transition-opacity duration-700 ease-in-out ${
                i === currentImageIndex ? 'opacity-100 animate-kenburns' : 'opacity-0'
              }`}
              draggable={false}
            />
          ))}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white flex items-center gap-4 select-none">
            <span>{currentImageIndex + 1} / {images.length}</span>
            <div className="flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/40 w-2 hover:bg-white/60'
                  }`}
                  aria-label={`Go to image ${idx+1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

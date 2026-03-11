import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Shield,
  Award,
  Clock,
  Star,
} from "lucide-react";
import { packageApi } from "../../services/api";
import type { Package } from "../../types";
import { formatPrice, formatCategories } from "../../utils/security";
import { Card } from "../../components/common/Card";
import { PackageCardSkeleton } from "../../components/common/Loading";
import { t, currentLang } from "../../i18n";
import { useNavigationState } from "../../contexts/NavigationContext";
import { useDataCache } from "../../contexts/DataCacheContext";
import { PrefetchLink } from "../../components/common";
// import { LazySection } from '../../components/common';

export const HomePage: React.FC = () => {
  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { endNavigation } = useNavigationState();
  const { featured: cachedFeatured, prefetchFeatured } = useDataCache();

  useEffect(() => {
    prefetchFeatured();
    loadFeaturedPackages();
  }, [prefetchFeatured]);

  const loadFeaturedPackages = async () => {
    setIsLoading(true);
    try {
      if (cachedFeatured) {
        setFeaturedPackages(cachedFeatured);
      } else {
        const langOverride = currentLang() === "zh" ? "zh" : "en";
        const response = await packageApi.getAll(
          { limit: 6, sortBy: "popular", status: "published" },
          langOverride,
        );
        if (response.success) {
          setFeaturedPackages(response.data.slice(0, 6));
        }
      }
    } catch (error) {
      console.error("Failed to load packages:", error);
    } finally {
      setIsLoading(false);
      endNavigation();
    }
  };

  const localizeUnit = (unit: string) => {
    if (currentLang() === "zh") {
      switch (unit) {
        case "days":
          return "天";
        case "nights":
          return "晚";
        case "hours":
          return "小时";
        default:
          return unit;
      }
    }
    return unit;
  };

  return (
    <div>
      <section className="relative h-[600px] overflow-hidden bg-blue-900">
        {/* Image wrapper with skeleton */}
        <HeroPicture />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t("home_title")}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100">
              {t("home_subtitle")}
            </p>
            <div className="flex flex-wrap gap-4">
              <PrefetchLink
                to="/packages"
                prefetchOn="hover"
                prefetchEnabled
                className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                {t("explore_packages")}
                <ArrowRight className="h-5 w-5" />
              </PrefetchLink>
              <PrefetchLink
                to="/contact"
                prefetchOn="viewport"
                prefetchEnabled
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg"
              >
                {t("contact_us")}
              </PrefetchLink>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-[2px]">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-blue-600" />,
                title: t("feature_safe_secure_title"),
                description: t("feature_safe_secure_desc"),
              },
              {
                icon: <Award className="h-12 w-12 text-blue-600" />,
                title: t("feature_best_prices_title"),
                description: t("feature_best_prices_desc"),
              },
              {
                icon: <Calendar className="h-12 w-12 text-blue-600" />,
                title: t("feature_expert_guides_title"),
                description: t("feature_expert_guides_desc"),
              },
              {
                icon: <Clock className="h-12 w-12 text-blue-600" />,
                title: t("feature_support_title"),
                description: t("feature_support_desc"),
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t("featured")} {t("packages")}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("home_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <PackageCardSkeleton key={i} />
                ))}
              </>
            ) : (
              featuredPackages.map((pkg) => {
                const {
                  visible: visibleCategories,
                  remaining: remainingCount,
                } = formatCategories(pkg.categories || [], 3);

                return (
                  <Link key={pkg.id} to={`/packages/${pkg.slug}`}>
                    <Card hover className="h-full">
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={
                            Array.isArray(pkg.images) && pkg.images[0]?.url
                              ? pkg.images[0]?.url
                              : "https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg"
                          }
                          alt={pkg.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                        {pkg.featured && (
                          <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current" />
                            {t("featured")}
                          </div>
                        )}
                        {/* Categories chips overlay */}
                        {visibleCategories.length > 0 && (
                          <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[calc(100%-8rem)]">
                            {visibleCategories.map((cat, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-xs font-semibold shadow-sm"
                              >
                                {cat}
                              </span>
                            ))}
                            {remainingCount > 0 && (
                              <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-xs font-semibold shadow-sm">
                                +{remainingCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {currentLang() === "zh"
                            ? pkg.titleZh || pkg.title
                            : pkg.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {currentLang() === "zh"
                            ? pkg.shortDescriptionZh || pkg.shortDescription
                            : pkg.shortDescription}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>
                              {currentLang() === "zh"
                                ? pkg.destinationZh || pkg.destination
                                : pkg.destination}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>
                              {pkg.duration} {localizeUnit(pkg.durationUnit)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("starting_from")}
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatPrice(pkg.price, pkg.currency)}
                            </p>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            {t("details")}
                          </button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>

          <div className="text-center">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("explore_packages")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">{t("home_title")}</h2>
            <p className="text-xl mb-8 text-blue-100">{t("home_subtitle")}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t("explore_packages")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "6285283918338"}?text=${encodeURIComponent("Hello! I would like to inquire about travel packages.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
              >
                {t("contact_whatsapp")}
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* 
      <LazySection minHeight={520} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
            <p className="text-xl text-gray-600">Real experiences from real travelers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                location: 'Singapore',
                rating: 5,
                text: 'Absolutely incredible experience! The team took care of every detail and made our Bali trip unforgettable.',
                image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
              },
              {
                name: 'Michael Chen',
                location: 'Malaysia',
                rating: 5,
                text: 'Professional, friendly, and knowledgeable. They truly understand what makes a great vacation.',
                image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg',
              },
              {
                name: 'Emma Watson',
                location: 'Australia',
                rating: 5,
                text: 'Best travel agency I have ever worked with. Highly recommend for anyone planning a trip to Indonesia!',
                image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
              },
            ].map((testimonial, index) => (
              <Card key={index}>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      loading="lazy"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700">{testimonial.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </LazySection> */}
    </div>
  );
};

// Hero picture component using responsive <picture> with WebP/AVIF + skeleton
const HeroPicture: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  // Remote image variants (pexels) with width hints for srcset
  const base =
    "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg";
  // Query params compress & size
  const params = "?auto=compress&cs=tinysrgb&dl=travel-hero.jpg";
  return (
    <div className="absolute inset-0">
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 animate-pulse" />
      )}
      <picture>
        <source
          type="image/avif"
          srcSet={`${base}${params}&w=800 800w, ${base}${params}&w=1200 1200w, ${base}${params}&w=1600 1600w`}
        />
        <source
          type="image/webp"
          srcSet={`${base}${params}&w=800 800w, ${base}${params}&w=1200 1200w, ${base}${params}&w=1600 1600w`}
        />
        <img
          onLoad={() => setLoaded(true)}
          loading="eager"
          src={`${base}${params}&w=1600`}
          alt={t("home_title")}
          className={`h-full w-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </picture>
    </div>
  );
};

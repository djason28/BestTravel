import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Car,
  Users,
  Fuel,
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
  Settings,
  UserCheck,
} from "lucide-react";
import { carApi } from "../../services/api";
import type { Car as CarType } from "../../types";
import { getWhatsAppLink } from "../../utils/security";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { ContentLoader } from "../../components/common/ContentLoader";
import { useNavigationState } from "../../contexts/NavigationContext";
import { Button } from "../../components/common/Button";
import { t, currentLang } from "../../i18n";

export const CarDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [car, setCar] = useState<CarType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const autoPlayInterval = useRef<number | null>(null);
  const fullScreenInterval = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const { endNavigation } = useNavigationState();

  useEffect(() => {
    if (slug) {
      loadCar(slug);
    }
  }, [slug]);

  const loadCar = async (slug: string) => {
    setIsLoading(true);
    try {
      const response = await carApi.getBySlug(slug);
      if (response.success && response.data) {
        setCar(response.data);
        await carApi.incrementView(String(response.data.id));
      }
    } catch (error) {
      console.error("Failed to load car:", error);
    } finally {
      setIsLoading(false);
      endNavigation();
    }
  };

  const handleWhatsAppClick = () => {
    if (!car) return;
    const carName = currentLang() === "zh" ? car.nameZh || car.name : car.name;
    const driverOption =
      currentLang() === "zh"
        ? car.withDriver
          ? t("with_driver_label")
          : t("without_driver_label")
        : car.withDriver
          ? "With Driver"
          : "Self Drive";
    const message =
      currentLang() === "zh"
        ? `您好！我想咨询租车服务。\n\n车辆：${carName}\n- 座位：${car.seats} 座\n- 变速箱：${car.transmission}\n- 司机选项：${driverOption}\n\n请告知可用时间和具体价格。`
        : `Hello! I'm interested in renting a car.\n\nCar: ${carName}\n- Seats: ${car.seats}\n- Transmission: ${car.transmission}\n- Driver Option: ${driverOption}\n\nPlease let me know about availability and pricing details.`;
    const link = getWhatsAppLink("6285283918338", message);
    window.open(link, "_blank");
  };

  const nextImage = () => {
    if (car) {
      setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
    }
  };

  const prevImage = () => {
    if (car) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + car.images.length) % car.images.length,
      );
    }
  };

  // Main gallery autoplay
  useEffect(() => {
    if (!car || !autoPlay || isGalleryOpen || car.images.length < 2) return;
    autoPlayInterval.current && clearInterval(autoPlayInterval.current);
    autoPlayInterval.current = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
    }, 5000);
    return () => {
      autoPlayInterval.current && clearInterval(autoPlayInterval.current);
    };
  }, [car, autoPlay, isGalleryOpen]);

  // Fullscreen autoplay
  useEffect(() => {
    if (!isGalleryOpen || !car || car.images.length < 2) {
      fullScreenInterval.current && clearInterval(fullScreenInterval.current);
      fullScreenInterval.current = null;
      return;
    }
    fullScreenInterval.current && clearInterval(fullScreenInterval.current);
    fullScreenInterval.current = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
    }, 6000);
    return () => {
      fullScreenInterval.current && clearInterval(fullScreenInterval.current);
    };
  }, [isGalleryOpen, car]);

  // Keyboard navigation for fullscreen
  useEffect(() => {
    if (!isGalleryOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsGalleryOpen(false);
      } else if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isGalleryOpen, car]);

  const images = car?.images || [];

  // Preload remaining images
  useEffect(() => {
    if (!images || images.length < 2) return;
    images.slice(1).forEach((img) => {
      if (img?.url) {
        const i = new Image();
        i.src = img.url;
      }
    });
  }, [images]);

  if (isLoading) {
    return <ContentLoader overlay minHeight={500} />;
  }

  if (!car) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t("car_not_found")}
        </h2>
        <Link to="/cars" className="text-[#0891b2] hover:underline">
          {t("browse_all_cars")}
        </Link>
      </div>
    );
  }

  const displayName =
    currentLang() === "zh" ? car.nameZh || car.name : car.name;
  const displayDescription =
    currentLang() === "zh"
      ? car.descriptionZh || car.description
      : car.description;

  const features =
    (currentLang() === "zh"
      ? car.featuresZh?.length
        ? car.featuresZh
        : car.features
      : car.features) || [];
  const included =
    (currentLang() === "zh"
      ? car.includedZh?.length
        ? car.includedZh
        : car.included
      : car.included) || [];
  const excluded =
    (currentLang() === "zh"
      ? car.excludedZh?.length
        ? car.excludedZh
        : car.excluded
      : car.excluded) || [];

  const localizePriceUnit = (unit: string) => {
    if (currentLang() === "zh") {
      switch (unit) {
        case "day":
          return "天";
        case "trip":
          return "趟";
        case "hour":
          return "小时";
        default:
          return unit;
      }
    }
    switch (unit) {
      case "day":
        return t("per_day");
      case "trip":
        return t("per_trip");
      case "hour":
        return t("per_hour");
      default:
        return unit;
    }
  };

  return (
    <div className="bg-sky-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/cars"
          className="inline-flex items-center gap-2 text-[#0891b2] hover:text-cyan-700 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{t("back_to_cars")}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2">
            {/* Image gallery */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div
                className="relative h-[500px] overflow-hidden group"
                onMouseEnter={() => setAutoPlay(false)}
                onMouseLeave={() => setAutoPlay(true)}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  touchStart.current = { x: touch.clientX, y: touch.clientY };
                }}
                onTouchEnd={(e) => {
                  if (!touchStart.current) return;
                  const touch = e.changedTouches[0];
                  const dx = touch.clientX - touchStart.current.x;
                  const dy = touch.clientY - touchStart.current.y;
                  if (Math.abs(dx) > 40 && Math.abs(dy) < 80) {
                    if (dx < 0) nextImage();
                    else prevImage();
                    setAutoPlay(false);
                  }
                  touchStart.current = null;
                }}
              >
                {images.length > 0 ? (
                  images.map((image, i) => (
                    <img
                      key={image.id || i}
                      src={
                        image.url ||
                        car.imageUrl ||
                        "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg"
                      }
                      alt={image.alt || displayName}
                      loading={i === 0 ? "eager" : "lazy"}
                      className={`absolute inset-0 w-full h-full object-contain bg-gray-100 cursor-pointer select-none transition-opacity duration-700 ease-in-out ${i === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                      onClick={() => setIsGalleryOpen(true)}
                      draggable={false}
                    />
                  ))
                ) : (
                  <img
                    src={
                      car.imageUrl ||
                      "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg"
                    }
                    alt={displayName}
                    className="w-full h-full object-contain bg-gray-100 cursor-pointer"
                    onClick={() => setIsGalleryOpen(true)}
                    draggable={false}
                  />
                )}
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
                              ? "bg-white w-8"
                              : "bg-white/50 w-2 hover:bg-white/70"
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
                      key={image.id || index}
                      src={image.url}
                      alt={image.alt}
                      loading="lazy"
                      className={`w-full h-24 object-contain bg-gray-100 rounded-lg cursor-pointer transition-all ${
                        index === currentImageIndex
                          ? "ring-2 ring-[#0891b2]"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Car Info */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-sm font-medium">
                      {car.brand}
                    </span>
                    {car.year > 0 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {car.year}
                      </span>
                    )}
                    {car.featured && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current" />
                        {t("featured")}
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2 relative">
                    {displayName}
                    <span className="block mt-3 h-1 w-24 bg-gradient-to-r from-[#0891b2] via-teal-500 to-[#065f46] rounded"></span>
                  </h1>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-[#0891b2] flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">{t("seats")}</p>
                    <p className="font-semibold text-gray-900">
                      {car.seats}
                      {currentLang() === "zh" ? " 座" : " seats"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Settings className="h-6 w-6 text-[#0891b2] flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("transmission_label")}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {car.transmission?.toLowerCase() === "automatic"
                        ? t("automatic_transmission")
                        : car.transmission?.toLowerCase() === "manual"
                          ? t("manual_transmission")
                          : car.transmission}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Fuel className="h-6 w-6 text-[#0891b2] flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">{t("fuel_type")}</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {currentLang() === "zh"
                        ? ({
                            Bensin: "汽油",
                            Solar: "柴油",
                            Listrik: "电力",
                            Hybrid: "混合动力",
                          }[car.fuelType!] ?? car.fuelType)
                        : car.fuelType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserCheck className="h-6 w-6 text-[#0891b2] flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("driver_option")}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {car.withDriver
                        ? t("with_driver_label")
                        : t("without_driver_label")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary info row */}
              <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{t("price_unit")}:</span>{" "}
                    {localizePriceUnit(car.priceUnit)}
                  </span>
                </div>
                {car.minDays > 1 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      <span className="font-medium">{t("min_days")}:</span>{" "}
                      {car.minDays}
                      {currentLang() === "zh" ? " 天" : " days"}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{t("views")}:</span>{" "}
                    {car.viewCount}
                  </span>
                </div>
              </div>

              {/* Description */}
              {displayDescription && (
                <div className="border-t pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {t("overview")}
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {displayDescription}
                  </p>
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div className="border-t pt-8 mt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {t("car_features")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#0891b2] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Included / Excluded */}
            {(included.length > 0 || excluded.length > 0) && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {included.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        {t("whats_included")}
                      </h3>
                      <span className="block mt-2 mb-4 h-1 w-32 bg-gradient-to-r from-[#065f46] via-[#0891b2] to-teal-500 rounded" />
                      <ul className="space-y-2">
                        {included.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-gray-700"
                          >
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {excluded.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <XCircle className="h-6 w-6 text-red-600" />
                        {t("whats_excluded")}
                      </h3>
                      <span className="block mt-2 mb-4 h-1 w-32 bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 rounded" />
                      <ul className="space-y-2">
                        {excluded.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-gray-700"
                          >
                            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sticky sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="mb-6 border-b pb-6">
                <p className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-[#0891b2]" />
                  {currentLang() === "zh"
                    ? car.availabilityZh || car.availability || car.year
                    : car.availability || car.year}
                </p>
                <p className="text-sm text-gray-500 mt-2 italic">
                  *{" "}
                  {currentLang() === "zh"
                    ? "请联系我们获取详细价格与预订情况"
                    : "Contact us for detailed pricing & availability"}
                </p>
              </div>

              <Button
                onClick={handleWhatsAppClick}
                className="w-full mb-3 bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                {t("book_car_whatsapp_cta")}
              </Button>

              <Link to="/contact">
                <Button variant="outline" className="w-full">
                  {t("contact_us")}
                </Button>
              </Link>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {t("need_help")}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  {t("need_help_desc")}
                </p>
                <a
                  href="tel:+6285283918338"
                  className="text-sm text-[#0891b2] hover:underline flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  +62-852-8391-8338
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen gallery modal */}
      {isGalleryOpen && images.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center overflow-hidden"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(e) => {
            if (!touchStart.current) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStart.current.x;
            const dy = touch.clientY - touchStart.current.y;
            if (Math.abs(dx) > 40 && Math.abs(dy) < 80) {
              if (dx < 0) nextImage();
              else prevImage();
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
          {/* Fade + Ken Burns Removed, Added Zoom */}
          {images.map(
            (image, i) =>
              i === currentImageIndex && (
                <div
                  key={i}
                  className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-auto"
                >
                  <TransformWrapper
                    wheel={{ step: 0.1, wheelDisabled: false }}
                    minScale={1}
                    maxScale={8}
                  >
                    <TransformComponent
                      wrapperStyle={{ width: "100%", height: "100%" }}
                      contentStyle={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.alt || displayName}
                        className="max-w-[90vw] max-h-[90vh] object-contain cursor-zoom-in"
                        draggable={false}
                      />
                    </TransformComponent>
                  </TransformWrapper>
                </div>
              ),
          )}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white flex items-center gap-4 select-none">
            <span>
              {currentImageIndex + 1} / {images.length}
            </span>
            <div className="flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex
                      ? "bg-white w-6"
                      : "bg-white/40 w-2 hover:bg-white/60"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

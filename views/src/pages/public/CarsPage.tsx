import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Car as CarIcon,
  Users,
  Fuel,
  Settings2,
  Star,
  SlidersHorizontal,
} from "lucide-react";
import { carApi } from "../../services/api";
import type { Car } from "../../types";
import { debounce, formatPrice } from "../../utils/security";
import { Card } from "../../components/common/Card";
import { PackageCardSkeleton } from "../../components/common/Loading";
import { Button } from "../../components/common/Button";
import { useNavigationState } from "../../contexts/NavigationContext";
import { t } from "../../i18n";
import { useResponsiveLimit } from "../../hooks/useResponsiveLimit";
import { useLang } from "../../contexts/LangContext";

const FUEL_ZH: Record<string, string> = {
  Bensin: "汽油",
  Solar: "柴油",
  Listrik: "电力",
  Hybrid: "混合动力",
};

const TRANSMISSION_ZH: Record<string, string> = {
  Automatic: "自动挡",
  Manual: "手动挡",
  CVT: "CVT",
};

export const CarsPage: React.FC = () => {
  const { lang } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [transmissionFilter, setTransmissionFilter] = useState(
    searchParams.get("transmission") || "",
  );
  const [withDriverFilter, setWithDriverFilter] = useState(
    searchParams.get("withDriver") || "",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [totalPages, setTotalPages] = useState(1);
  const { startNavigation, endNavigation } = useNavigationState();
  const responsiveLimit = useResponsiveLimit();

  const loadCars = useCallback(async () => {
    setIsLoading(true);
    startNavigation();
    try {
      const res = await carApi.getAll({
        status: "published",
        search: searchQuery || undefined,
        limit: responsiveLimit,
        page: currentPage,
        transmission: transmissionFilter || undefined,
        withDriver: withDriverFilter || undefined,
      });
      if (res.success && res.data) {
        setCars(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          if (
            currentPage > res.pagination.totalPages &&
            res.pagination.totalPages > 0
          ) {
            setCurrentPage(1);
          }
        }
      }
    } catch {
      setCars([]);
    } finally {
      setIsLoading(false);
      endNavigation();
    }
  }, [
    searchQuery,
    transmissionFilter,
    withDriverFilter,
    currentPage,
    responsiveLimit,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [responsiveLimit]);

  useEffect(() => {
    // Update URL params
    const params: any = {};
    if (searchQuery) params.search = searchQuery;
    if (transmissionFilter) params.transmission = transmissionFilter;
    if (withDriverFilter) params.withDriver = withDriverFilter;
    if (currentPage > 1) params.page = String(currentPage);
    setSearchParams(params);

    loadCars();
  }, [loadCars]); // loadCars depends on query/filters, so this is correct

  const handleSearchChange = debounce((val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  }, 500);

  const hasActiveFilters = Boolean(transmissionFilter || withDriverFilter);

  const paginationItems = useMemo<(number | "ellipsis")[]>(() => {
    const items: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }
    if (currentPage <= 4) {
      items.push(1, 2, 3, 4, 5, "ellipsis", totalPages);
      return items;
    }
    if (currentPage >= totalPages - 3) {
      items.push(
        1,
        "ellipsis",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
      return items;
    }
    items.push(
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    );
    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-sky-50 min-h-screen">
      {/* Hero Banner */}
      <div
        className="text-white py-16"
        style={{
          background: "linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("cars_page_title")}
          </h1>
          <p className="text-xl text-cyan-100 relative">
            {t("cars_page_subtitle")}
            <span className="block mt-4 h-1 w-32 bg-gradient-to-r from-white/70 to-cyan-200 rounded"></span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t("search_cars_placeholder")}
                defaultValue={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>{t("filters")}</span>
              {hasActiveFilters && (
                <span className="bg-[#0891b2] text-white text-xs px-2 py-1 rounded-full">
                  {t("active")}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("transmission_label")}
                </label>
                <select
                  value={transmissionFilter}
                  onChange={(e) => {
                    setTransmissionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t("filter_all_transmission")}</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("driver_option")}
                </label>
                <select
                  value={withDriverFilter}
                  onChange={(e) => {
                    setWithDriverFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t("filter_driver_all")}</option>
                  <option value="yes">{t("with_driver_label")}</option>
                  <option value="no">{t("filter_self_drive")}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[...Array(6)].map((_, i) => (
              <PackageCardSkeleton key={i} />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20">
            <CarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {t("no_cars")}
            </h3>
            <p className="text-gray-400 text-sm">{t("try_change_filter")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} lang={lang} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {cars.length > 0 && totalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2 pb-12">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              variant="outline"
              size="sm"
            >
              {t("previous")}
            </Button>

            {paginationItems.map((it, idx) =>
              it === "ellipsis" ? (
                <span
                  key={`e-${idx}`}
                  className="px-3 py-2 text-gray-500 select-none"
                >
                  …
                </span>
              ) : (
                <Button
                  key={it}
                  variant={currentPage === it ? "primary" : "outline"}
                  onClick={() => setCurrentPage(it as number)}
                  size="sm"
                >
                  {it}
                </Button>
              ),
            )}

            <Button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              variant="outline"
              size="sm"
            >
              {t("next")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const CarCard: React.FC<{ car: Car; lang: "en" | "zh" }> = ({ car, lang }) => {
  const coverImage =
    car.images?.find((i) => i.isCover)?.url ??
    car.images?.[0]?.url ??
    car.imageUrl ??
    "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg"; // Default car image

  const startingPrice = (() => {
    const allPrices = (car.prices || []).filter((p) => (p.amount || 0) > 0);
    const sgdPrices = allPrices.filter(
      (p) => (p.currency || "").toUpperCase() === "SGD",
    );
    const source = sgdPrices.length > 0 ? sgdPrices : allPrices;
    if (source.length > 0) {
      return Math.min(...source.map((p) => p.amount));
    }
    return car.price > 0 ? car.price : 0;
  })();

  const startingPriceText =
    startingPrice > 0
      ? `${t("starting_price_sgd")} ${formatPrice(startingPrice, "SGD")}`
      : `${t("starting_price_sgd")} SGD`;

  return (
    <Card hover className="h-full flex flex-col group">
      <div className="relative h-64 overflow-hidden">
        <img
          src={coverImage}
          alt={car.name}
          loading="lazy"
          className="w-full h-full object-contain bg-gray-100 transition-transform duration-500 group-hover:scale-110"
        />
        {car.featured && (
          <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Star className="h-4 w-4 fill-current" />
            {t("featured")}
          </div>
        )}
        {car.withDriver && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[#0891b2] px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            {t("with_driver_label")}
          </div>
        )}
      </div>

      {/* Content - p-6 to match Package style */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#0891b2] transition-colors">
          {lang === "zh" ? car.nameZh || car.name : car.name}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
          {lang === "zh"
            ? car.descriptionZh ||
              car.description ||
              `${car.brand} ${car.model}${car.year ? ` · ${car.year}` : ""}`
            : car.description ||
              `${car.brand} ${car.model}${car.year ? ` · ${car.year}` : ""}`}
        </p>

        <div className="space-y-2 mb-4 flex-grow">
          {car.seats > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-cyan-600" />
              <span>
                {car.seats} {lang === "zh" ? "座" : t("seats")}
              </span>
            </div>
          )}
          {car.transmission && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Settings2 className="h-4 w-4 text-cyan-600" />
              <span>
                {lang === "zh"
                  ? TRANSMISSION_ZH[car.transmission] || car.transmission
                  : car.transmission}
              </span>
            </div>
          )}
          {car.fuelType && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Fuel className="h-4 w-4 text-cyan-600" />
              <span>
                {lang === "zh"
                  ? FUEL_ZH[car.fuelType] || car.fuelType
                  : car.fuelType}
              </span>
            </div>
          )}
        </div>

        <div className="mb-4 rounded-lg bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800">
          {startingPriceText}
        </div>

        <div className="flex items-center justify-end pt-4 border-t mt-auto">
          <Link
            to={`/cars/${car.slug}`}
            className="px-6 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-cyan-700 transition-colors shadow-sm font-medium"
          >
            {lang === "zh" ? "立刻预订！" : "Book Now!"}
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default CarsPage;

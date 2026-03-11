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
import { formatPrice, debounce } from "../../utils/security";
import { Card } from "../../components/common/Card";
import { PackageCardSkeleton } from "../../components/common/Loading";
import { Button } from "../../components/common/Button";
import { useNavigationState } from "../../contexts/NavigationContext";

const PRICE_UNIT_LABEL: Record<string, string> = {
  day: "/ hari",
  trip: "/ perjalanan",
  hour: "/ jam",
};

export const CarsPage: React.FC = () => {
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

  const loadCars = useCallback(async () => {
    setIsLoading(true);
    startNavigation();
    try {
      const res = await carApi.getAll({
        status: "published",
        search: searchQuery || undefined,
        limit: 12,
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
  }, [searchQuery, transmissionFilter, withDriverFilter, currentPage]);

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
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Rental Mobil</h1>
          <p className="text-xl text-blue-100 relative">
            Temukan pilihan mobil terbaik untuk perjalanan Anda
            <span className="block mt-4 h-1 w-32 bg-gradient-to-r from-white/70 to-blue-200 rounded"></span>
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
                placeholder="Cari nama, brand, model..."
                defaultValue={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  Aktif
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transmisi
                </label>
                <select
                  value={transmissionFilter}
                  onChange={(e) => {
                    setTransmissionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Transmisi</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supir
                </label>
                <select
                  value={withDriverFilter}
                  onChange={(e) => {
                    setWithDriverFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Dengan/Tanpa Sopir</option>
                  <option value="yes">Dengan Sopir</option>
                  <option value="no">Lepas Kunci</option>
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
              Tidak ada mobil ditemukan
            </h3>
            <p className="text-gray-400 text-sm">
              Coba ubah filter pencarian Anda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
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
              Previous
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
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const CarCard: React.FC<{ car: Car }> = ({ car }) => {
  const coverImage =
    car.images?.find((i) => i.isCover)?.url ??
    car.images?.[0]?.url ??
    car.imageUrl ??
    "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg"; // Default car image

  const priceLabel = PRICE_UNIT_LABEL[car.priceUnit] ?? `/ ${car.priceUnit}`;

  return (
    <Link to={`/cars/${car.slug}`} className="group block h-full">
      <Card hover className="h-full flex flex-col">
        {/* Image - h-64 to match Package style */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={coverImage}
            alt={car.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {car.featured && (
            <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Star className="h-4 w-4 fill-current" />
              Featured
            </div>
          )}
          {car.withDriver && (
            <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
              + Sopir
            </div>
          )}
        </div>

        {/* Content - p-6 to match Package style */}
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {car.name}
          </h3>
          <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
            {car.description ||
              `${car.brand} ${car.model} ${car.year ? `· ${car.year}` : ""}`}
          </p>

          <div className="space-y-2 mb-4 flex-grow">
            {car.seats > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-blue-600" />
                <span>{car.seats} Kursi</span>
              </div>
            )}
            {car.transmission && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Settings2 className="h-4 w-4 text-blue-600" />
                <span>{car.transmission}</span>
              </div>
            )}
            {car.fuelType && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Fuel className="h-4 w-4 text-blue-600" />
                <span>{car.fuelType}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t mt-auto">
            <div>
              <p className="text-sm text-gray-600">Mulai dari</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(
                    car.prices?.[0]?.amount || car.price,
                    car.prices?.[0]?.currency || car.currency,
                  )}
                </span>
                <span className="text-xs text-gray-500">{priceLabel}</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Detail
            </button>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default CarsPage;

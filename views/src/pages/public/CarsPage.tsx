import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Car as CarIcon,
  Users,
  Fuel,
  Settings2,
  Star,
} from "lucide-react";
import { carApi } from "../../services/api";
import type { Car } from "../../types";
import { formatPrice } from "../../utils/security";
import { Card } from "../../components/common/Card";
import { PackageCardSkeleton } from "../../components/common/Loading";

const PRICE_UNIT_LABEL: Record<string, string> = {
  day: "/ hari",
  trip: "/ perjalanan",
  hour: "/ jam",
};

export const CarsPage: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("");
  const [withDriverFilter, setWithDriverFilter] = useState("");

  const loadCars = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await carApi.getAll({
        status: "published",
        search: searchQuery || undefined,
        limit: 50,
      });
      if (res.success && res.data) {
        let items: Car[] = Array.isArray(res.data)
          ? res.data
          : (res.data.items ?? []);
        if (transmissionFilter) {
          items = items.filter((c) => c.transmission === transmissionFilter);
        }
        if (withDriverFilter === "yes") {
          items = items.filter((c) => c.withDriver);
        } else if (withDriverFilter === "no") {
          items = items.filter((c) => !c.withDriver);
        }
        setCars(items);
      }
    } catch {
      setCars([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, transmissionFilter, withDriverFilter]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Rental Mobil</h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto">
            Temukan pilihan mobil terbaik untuk perjalanan Anda
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, brand, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={transmissionFilter}
            onChange={(e) => setTransmissionFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Transmisi</option>
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
            <option value="CVT">CVT</option>
          </select>
          <select
            value={withDriverFilter}
            onChange={(e) => setWithDriverFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Dengan/Tanpa Sopir</option>
            <option value="yes">Dengan Sopir</option>
            <option value="no">Lepas Kunci</option>
          </select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
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
    null;

  const priceLabel = PRICE_UNIT_LABEL[car.priceUnit] ?? `/ ${car.priceUnit}`;

  return (
    <Link to={`/cars/${car.slug}`} className="group">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={car.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CarIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}
          {car.featured && (
            <div className="absolute top-3 left-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" /> Featured
            </div>
          )}
          {car.withDriver && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
              + Sopir
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1 group-hover:text-blue-600 transition-colors">
            {car.name}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {car.brand} {car.model} {car.year ? `· ${car.year}` : ""}
          </p>

          {/* Specs */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
            {car.seats > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {car.seats} kursi
              </span>
            )}
            {car.transmission && (
              <span className="flex items-center gap-1">
                <Settings2 className="h-3.5 w-3.5" />
                {car.transmission}
              </span>
            )}
            {car.fuelType && (
              <span className="flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5" />
                {car.fuelType}
              </span>
            )}
          </div>

          {/* Prices */}
          {car.prices && car.prices.length > 0 ? (
            <div className="space-y-0.5">
              {car.prices.slice(0, 2).map((p, i) => (
                <div key={i} className="flex items-baseline gap-1">
                  <span
                    className={`font-bold ${i === 0 ? "text-blue-700 text-base" : "text-gray-600 text-sm"}`}
                  >
                    {formatPrice(p.amount, p.currency)}
                  </span>
                  <span className="text-xs text-gray-400">{priceLabel}</span>
                </div>
              ))}
            </div>
          ) : car.price > 0 ? (
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-blue-700 text-base">
                {formatPrice(car.price, car.currency)}
              </span>
              <span className="text-xs text-gray-400">{priceLabel}</span>
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
};

export default CarsPage;

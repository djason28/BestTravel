import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Car as CarIcon,
  Users,
  Fuel,
  Settings2,
  UserCheck,
  Star,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { carApi } from "../../services/api";
import type { Car } from "../../types";
import { formatPrice } from "../../utils/security";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Loading } from "../../components/common/Loading";
import { ConfirmModal } from "../../components/common/Modal";
import { useToast } from "../../contexts/ToastContext";
import { useResponsiveLimit } from "../../hooks/useResponsiveLimit";

const statusMap: Record<string, string> = {
  published: "bg-green-100 text-green-800 border border-green-200",
  draft: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  archived: "bg-gray-100 text-gray-600 border border-gray-200",
};

export const CarsPage: React.FC = () => {
  const { addToast } = useToast();
  const responsiveLimit = useResponsiveLimit();
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    carId: string | null;
  }>({ isOpen: false, carId: null });

  const loadCars = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await carApi.getAll({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        limit: responsiveLimit,
        page: currentPage,
      });
      if (res.success && res.data) {
        setCars(res.data ?? []);
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
      addToast("Gagal memuat data mobil", "error");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, responsiveLimit, currentPage]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  useEffect(() => {
    setCurrentPage(1);
  }, [responsiveLimit]);

  const handleDelete = async () => {
    if (!deleteModal.carId) return;
    try {
      const res = await carApi.delete(deleteModal.carId);
      if (res.success) {
        addToast("Mobil berhasil dihapus", "success");
        setCars((prev) =>
          prev.filter((c) => String(c.id) !== deleteModal.carId),
        );
      } else {
        addToast(res.error ?? "Gagal menghapus mobil", "error");
      }
    } catch {
      addToast("Gagal menghapus mobil", "error");
    } finally {
      setDeleteModal({ isOpen: false, carId: null });
    }
  };

  const coverImage = (car: Car) =>
    car.images?.find((i) => i.isCover)?.url ??
    car.images?.[0]?.url ??
    car.imageUrl ??
    "";

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
      items.push(1, "ellipsis");
      for (let i = totalPages - 4; i <= totalPages; i++) items.push(i);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cars</h1>
          <p className="text-gray-500 mt-1">
            Kelola unit rental mobil
            {cars.length > 0 && (
              <span className="ml-2 text-sm font-medium text-blue-600">
                ({cars.length} mobil)
              </span>
            )}
          </p>
        </div>
        <Link to="/admin/cars/new">
          <Button variant="primary">
            <Plus className="h-5 w-5 mr-2" />
            Tambah Mobil
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, brand, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
          >
            <option value="">Semua Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loading />
        </div>
      ) : cars.length === 0 ? (
        <Card>
          <div className="p-16 text-center">
            <CarIcon className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Belum ada data mobil</p>
            <Link to="/admin/cars/new">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Sekarang
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {cars.map((car) => {
            const thumb = coverImage(car);
            const priceLabel =
              { day: "/ hari", trip: "/ perjalanan", hour: "/ jam" }[
                car.priceUnit
              ] ?? `/ ${car.priceUnit}`;

            return (
              <Card key={car.id}>
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-48 h-36 rounded-xl overflow-hidden bg-gray-100">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={car.name}
                          className="w-full h-full object-contain bg-gray-100"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CarIcon className="h-10 w-10 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Top row: name + status */}
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900 leading-tight">
                              {car.name}
                            </h3>
                            {car.featured && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full text-xs font-semibold">
                                <Star className="h-3 w-3 fill-current" />
                                Featured
                              </span>
                            )}
                          </div>
                          {(car as any).nameZh && (
                            <p className="text-sm text-gray-400 mt-0.5 font-medium">
                              {(car as any).nameZh}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {car.brand}
                            {car.model ? ` ${car.model}` : ""}
                            {car.year ? ` · ${car.year}` : ""}
                          </p>
                        </div>
                        <span
                          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusMap[car.status] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {car.status}
                        </span>
                      </div>

                      {/* Specs row */}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                        {car.seats > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-blue-500" />
                            {car.seats} kursi
                          </span>
                        )}
                        {car.transmission && (
                          <span className="flex items-center gap-1.5">
                            <Settings2 className="h-4 w-4 text-blue-500" />
                            {car.transmission}
                          </span>
                        )}
                        {car.fuelType && (
                          <span className="flex items-center gap-1.5">
                            <Fuel className="h-4 w-4 text-blue-500" />
                            {car.fuelType}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-blue-500" />
                          {car.withDriver ? "Dengan Sopir" : "Self Drive"}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-6 mt-3 text-sm">
                        <span className="font-semibold text-blue-600 text-base">
                          {car.prices?.length
                            ? formatPrice(
                                car.prices[0].amount,
                                car.prices[0].currency,
                              )
                            : formatPrice(car.price, car.currency)}
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            {priceLabel}
                          </span>
                        </span>
                        {car.prices && car.prices.length > 1 && (
                          <span className="text-xs text-gray-400">
                            +{car.prices.length - 1} harga lain
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-gray-500">
                          <TrendingUp className="h-4 w-4" />
                          {car.viewCount ?? 0} views
                        </span>
                        {(car.inquiryCount ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <MessageSquare className="h-4 w-4" />
                            {car.inquiryCount} inquiry
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-4">
                        <Link to={`/cars/${car.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Lihat
                          </Button>
                        </Link>
                        <Link to={`/admin/cars/${car.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              carId: String(car.id),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
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
                ...
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
            onClick={() => setCurrentPage((p) => p + 1)}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Hapus Mobil"
        message="Yakin ingin menghapus mobil ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ isOpen: false, carId: null })}
      />
    </div>
  );
};

export default CarsPage;

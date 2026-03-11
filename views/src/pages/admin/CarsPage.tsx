import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, Search, Car as CarIcon } from "lucide-react";
import { carApi } from "../../services/api";
import type { Car } from "../../types";
import { formatPrice } from "../../utils/security";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Loading } from "../../components/common/Loading";
import { ConfirmModal } from "../../components/common/Modal";
import { useToast } from "../../contexts/ToastContext";

export const CarsPage: React.FC = () => {
  const { addToast } = useToast();
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
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
        limit: 100,
      });
      if (res.success && res.data) {
        setCars(Array.isArray(res.data) ? res.data : (res.data.items ?? []));
      }
    } catch {
      addToast("Gagal memuat data mobil", "error");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

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

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      published: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      archived: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cars</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola paket rental mobil
          </p>
        </div>
        <Link to="/admin/cars/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Tambah Mobil
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, brand, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loading />
          </div>
        ) : cars.length === 0 ? (
          <div className="p-12 text-center">
            <CarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada data mobil</p>
            <Link to="/admin/cars/new" className="mt-3 inline-block">
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Sekarang
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Mobil
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Brand / Model
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Tahun
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Kursi
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Harga
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Views
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cars.map((car) => (
                  <tr
                    key={car.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {car.images && car.images.length > 0 ? (
                          <img
                            src={car.images[0].url}
                            alt={car.name}
                            className="h-10 w-14 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-14 bg-gray-100 rounded flex items-center justify-center">
                            <CarIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-800">
                            {car.name}
                          </div>
                          {car.featured && (
                            <span className="text-xs text-yellow-600 font-medium">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {car.brand} {car.model}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {car.year || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {car.seats || "-"} kursi
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {car.prices && car.prices.length > 0 ? (
                        <div className="space-y-0.5">
                          {car.prices.slice(0, 2).map((p, i) => (
                            <div key={i} className="text-xs">
                              {formatPrice(p.amount, p.currency)}
                              <span className="text-gray-400 ml-1">
                                /{car.priceUnit || "hari"}
                              </span>
                            </div>
                          ))}
                          {car.prices.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{car.prices.length - 2} lainnya
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(car.status)}</td>
                    <td className="px-4 py-3 text-gray-500">{car.viewCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/cars/${car.slug}`} target="_blank">
                          <button
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Lihat"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <Link to={`/admin/cars/${car.id}/edit`}>
                          <button
                            className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              carId: String(car.id),
                            })
                          }
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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

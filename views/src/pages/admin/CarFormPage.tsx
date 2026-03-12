import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Star, Upload } from "lucide-react";
import { carApi, uploadApi } from "../../services/api";
import type { CarFormData, PackageImage, PricePair } from "../../types";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Loading } from "../../components/common/Loading";
import { useToast } from "../../contexts/ToastContext";

const TRANSMISSIONS = ["Manual", "Automatic", "CVT"];
const FUEL_TYPES = ["Bensin", "Solar", "Listrik", "Hybrid"];
const PRICE_UNITS = [
  { value: "day", label: "Per Hari" },
  { value: "trip", label: "Per Perjalanan" },
  { value: "hour", label: "Per Jam" },
];
const CURRENCIES = ["IDR", "SGD", "USD", "MYR", "EUR"];

const emptyForm: CarFormData = {
  name: "",
  nameZh: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  seats: 4,
  transmission: "Manual",
  fuelType: "Bensin",
  prices: [{ amount: 0, currency: "IDR" }],
  priceUnit: "day",
  minDays: 1,
  withDriver: false,
  features: [],
  featuresZh: [],
  included: [],
  includedZh: [],
  excluded: [],
  excludedZh: [],
  images: [],
  description: "",
  descriptionZh: "",
  availability: "",
  availabilityZh: "",
  status: "draft",
  featured: false,
};

export const CarFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isEdit = !!id;

  const [form, setForm] = useState<CarFormData>(emptyForm);
  const [images, setImages] = useState<PackageImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // text-array fields helpers (comma or newline separated)
  const [featuresText, setFeaturesText] = useState("");
  const [includedText, setIncludedText] = useState("");
  const [excludedText, setExcludedText] = useState("");
  const [featuresZhText, setFeaturesZhText] = useState("");
  const [includedZhText, setIncludedZhText] = useState("");
  const [excludedZhText, setExcludedZhText] = useState("");

  useEffect(() => {
    if (isEdit) loadCar();
  }, [id]);

  const loadCar = async () => {
    setIsLoading(true);
    try {
      const res = await carApi.getById(id!);
      if (res.success && res.data) {
        const d = res.data;
        setForm({
          name: d.name ?? "",
          nameZh: d.nameZh ?? "",
          brand: d.brand ?? "",
          model: d.model ?? "",
          year: d.year ?? new Date().getFullYear(),
          seats: d.seats ?? 4,
          transmission: d.transmission ?? "Manual",
          fuelType: d.fuelType ?? "Bensin",
          prices: d.prices?.length
            ? d.prices
            : [{ amount: d.price ?? 0, currency: d.currency ?? "IDR" }],
          priceUnit: d.priceUnit ?? "day",
          minDays: d.minDays ?? 1,
          withDriver: d.withDriver ?? false,
          features: d.features ?? [],
          featuresZh: d.featuresZh ?? [],
          included: d.included ?? [],
          includedZh: d.includedZh ?? [],
          excluded: d.excluded ?? [],
          excludedZh: d.excludedZh ?? [],
          images: d.images ?? [],
          description: d.description ?? "",
          descriptionZh: d.descriptionZh ?? "",
          availability: d.availability ?? "",
          availabilityZh: d.availabilityZh ?? "",
          status: d.status ?? "draft",
          featured: d.featured ?? false,
        });
        setImages(d.images ?? []);
        setFeaturesText((d.features ?? []).join("\n"));
        setIncludedText((d.included ?? []).join("\n"));
        setExcludedText((d.excluded ?? []).join("\n"));
        setFeaturesZhText((d.featuresZh ?? []).join("\n"));
        setIncludedZhText((d.includedZh ?? []).join("\n"));
        setExcludedZhText((d.excludedZh ?? []).join("\n"));
      }
    } catch {
      addToast("Gagal memuat data mobil", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const onChange = (field: keyof CarFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Price list
  const onPriceChange = (
    idx: number,
    field: keyof PricePair,
    value: string,
  ) => {
    setForm((prev) => {
      const prices = [...prev.prices];
      prices[idx] = {
        ...prices[idx],
        [field]: field === "amount" ? parseInt(value, 10) || 0 : value,
      };
      return { ...prev, prices };
    });
  };

  const addPrice = () => {
    setForm((prev) => ({
      ...prev,
      prices: [...prev.prices, { amount: 0, currency: "SGD" }],
    }));
  };

  const removePrice = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== idx),
    }));
  };

  const parseLines = (text: string) =>
    text
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast("Nama mobil wajib diisi", "error");
      return;
    }
    setIsSaving(true);
    const payload = {
      ...form,
      features: parseLines(featuresText),
      featuresZh: parseLines(featuresZhText),
      included: parseLines(includedText),
      includedZh: parseLines(includedZhText),
      excluded: parseLines(excludedText),
      excludedZh: parseLines(excludedZhText),
      images,
    };

    try {
      const res = isEdit
        ? await carApi.update(id!, payload)
        : await carApi.create(payload);
      if (res.success) {
        addToast(
          isEdit ? "Mobil berhasil diperbarui" : "Mobil berhasil ditambahkan",
          "success",
        );
        navigate("/admin/cars");
      } else {
        addToast(res.error ?? "Gagal menyimpan", "error");
      }
    } catch {
      addToast("Gagal menyimpan data", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loading />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          (e.target as HTMLElement).tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/cars")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Mobil" : "Tambah Mobil"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit
                ? "Perbarui informasi mobil rental"
                : "Tambahkan unit mobil baru"}
            </p>
          </div>
        </div>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving
            ? "Menyimpan..."
            : isEdit
              ? "Simpan Perubahan"
              : "Tambah Mobil"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Informasi Dasar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Mobil <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="cth. Toyota Avanza 2023"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称（中文）
            </label>
            <input
              type="text"
              value={form.nameZh}
              onChange={(e) => onChange("nameZh", e.target.value)}
              placeholder="例：丰田 Avanza 2023"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tahun
            </label>
            <input
              type="number"
              value={form.year}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                onChange("year", parseInt(e.target.value, 10) || 0)
              }
              min={1990}
              max={new Date().getFullYear() + 2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Kursi
            </label>
            <input
              type="number"
              value={form.seats}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                onChange("seats", parseInt(e.target.value, 10) || 0)
              }
              min={1}
              max={50}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transmisi
            </label>
            <select
              value={form.transmission}
              onChange={(e) => onChange("transmission", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bahan Bakar
            </label>
            <select
              value={form.fuelType}
              onChange={(e) => onChange("fuelType", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="block text-sm font-medium text-gray-700">
              Tersedia Dengan Sopir
            </label>
            <button
              type="button"
              onClick={() => onChange("withDriver", !form.withDriver)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.withDriver ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.withDriver ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span className="text-sm text-gray-500">
              {form.withDriver ? "Ya" : "Tidak"}
            </span>
          </div>
        </div>
      </Card>

      {/* Pricing */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Harga</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satuan Harga
            </label>
            <select
              value={form.priceUnit}
              onChange={(e) => onChange("priceUnit", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRICE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Hari
            </label>
            <input
              type="number"
              value={form.minDays}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                onChange("minDays", parseInt(e.target.value, 10) || 1)
              }
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          {form.prices.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="number"
                value={p.amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onPriceChange(idx, "amount", e.target.value)}
                placeholder="Nominal harga"
                min={0}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={p.currency}
                onChange={(e) => onPriceChange(idx, "currency", e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {form.prices.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePrice(idx)}
                  className="p-2 text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPrice}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mt-2"
          >
            <Plus className="h-4 w-4" /> Tambah harga lain
          </button>
        </div>
      </Card>

      {/* Description */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Deskripsi</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi (EN/ID)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={4}
              placeholder="Deskripsi lengkap mobil rental..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi (ZH)
            </label>
            <textarea
              value={form.descriptionZh}
              onChange={(e) => onChange("descriptionZh", e.target.value)}
              rows={4}
              placeholder="车辆描述（中文）..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ketersediaan (EN/ID)
            </label>
            <input
              type="text"
              value={form.availability}
              onChange={(e) => onChange("availability", e.target.value)}
              placeholder="cth. Tersedia setiap hari"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              可用性（中文）
            </label>
            <input
              type="text"
              value={form.availabilityZh}
              onChange={(e) => onChange("availabilityZh", e.target.value)}
              placeholder="例：每天可用"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Features / Included / Excluded */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Detail & Fasilitas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fitur Mobil (EN/ID)
            </label>
            <textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={5}
              placeholder={"AC\nBluetooth\nKamera Belakang\nBagasi Besar"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">Satu item per baris</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sudah Termasuk (EN/ID)
            </label>
            <textarea
              value={includedText}
              onChange={(e) => setIncludedText(e.target.value)}
              rows={5}
              placeholder={"Bensin\nAsuransi\nTol"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">Satu item per baris</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tidak Termasuk (EN/ID)
            </label>
            <textarea
              value={excludedText}
              onChange={(e) => setExcludedText(e.target.value)}
              rows={5}
              placeholder={"Parkir\nPenyeberangan"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">Satu item per baris</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              车辆配置（中文）
            </label>
            <textarea
              value={featuresZhText}
              onChange={(e) => setFeaturesZhText(e.target.value)}
              rows={5}
              placeholder={"空调\n蓝牙\n倒车摄像头\n大型行李箱"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">每行一项</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              费用包含（中文）
            </label>
            <textarea
              value={includedZhText}
              onChange={(e) => setIncludedZhText(e.target.value)}
              rows={5}
              placeholder={"汽油\n保险\n过路费"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">每行一项</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              费用不含（中文）
            </label>
            <textarea
              value={excludedZhText}
              onChange={(e) => setExcludedZhText(e.target.value)}
              rows={5}
              placeholder={"停车费\n渡船费"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">每行一项</p>
          </div>
        </div>
      </Card>

      {/* Images */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Foto Mobil</h2>
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">
              Klik untuk upload foto
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WEBP — maks 5MB
            </p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const res = await uploadApi.uploadImage(f, "cars");
                  if (res.success && (res as any).data?.url) {
                    const url = (res as any).data.url;
                    const img: PackageImage = {
                      id: "",
                      url,
                      alt: form.name || "car",
                      order: images.length,
                      isCover: images.length === 0,
                    };
                    setImages((prev) => [...prev, img]);
                    addToast("Foto berhasil diupload", "success");
                  }
                } catch {
                  addToast("Gagal upload foto", "error");
                } finally {
                  if (e.currentTarget) e.currentTarget.value = "";
                }
              }}
            />
          </div>
        </label>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group aspect-video">
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover rounded-lg"
                />
                {img.isCover && (
                  <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> Cover
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                  {!img.isCover && (
                    <button
                      type="button"
                      className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded text-xs font-medium"
                      onClick={() =>
                        setImages((prev) =>
                          prev.map((im, i) => ({ ...im, isCover: i === idx })),
                        )
                      }
                    >
                      Set Cover
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium"
                    onClick={() =>
                      setImages((prev) => {
                        const next = prev.filter((_, i) => i !== idx);
                        if (prev[idx].isCover && next.length > 0)
                          next[0].isCover = true;
                        return next;
                      })
                    }
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Status & Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Status & Pengaturan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => onChange("status", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-5">
            <label className="text-sm font-medium text-gray-700">
              Featured
            </label>
            <button
              type="button"
              onClick={() => onChange("featured", !form.featured)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.featured ? "bg-yellow-400" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.featured ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span className="text-sm text-gray-500">
              {form.featured ? "Ya" : "Tidak"}
            </span>
          </div>
        </div>
      </Card>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pb-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/admin/cars")}
        >
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving
            ? "Menyimpan..."
            : isEdit
              ? "Simpan Perubahan"
              : "Tambah Mobil"}
        </Button>
      </div>
    </form>
  );
};

export default CarFormPage;

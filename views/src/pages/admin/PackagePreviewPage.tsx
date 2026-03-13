import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Users,
  Clock,
  Star,
  Check,
  X,
  Edit,
  AlertCircle,
} from "lucide-react";
import { packageApi } from "../../services/api";
import type { Package } from "../../types";
import { formatPrice } from "../../utils/security";
import { Card } from "../../components/common/Card";
import { Loading } from "../../components/common/Loading";
import { Button } from "../../components/common/Button";
import { useToast } from "../../contexts/ToastContext";

export const PackagePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [pkgZh, setPkgZh] = useState<Package | null>(null);
  const [viewLang, setViewLang] = useState<"en" | "zh">("en");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      loadPackage();
    }
  }, [id]);

  const loadPackage = async () => {
    setIsLoading(true);
    try {
      const [resEn, resZh] = await Promise.all([
        packageApi.getById(id!, "en"),
        packageApi.getById(id!, "zh"),
      ]);
      if (resEn.success && resEn.data) {
        setPkg(resEn.data);
      }
      if (resZh.success && resZh.data) {
        setPkgZh(resZh.data);
      } else {
        addToast("Package not found", "error");
        navigate("/admin/packages");
      }
    } catch (error) {
      addToast("Failed to load package", "error");
      navigate("/admin/packages");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Package Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The package you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/admin/packages")}>
              Back to Packages
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const coverImage = Array.isArray(pkg.images)
    ? pkg.images.find((img) => img.isCover) || pkg.images[0]
    : undefined;
  const statusColors = {
    published: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header Bar */}
      <div className="bg-blue-600 text-white py-3 px-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/packages")}
              className="flex items-center gap-2 hover:text-blue-100"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to Admin</span>
            </button>
            <span className="text-blue-200">|</span>
            <span className="font-semibold">Package Preview</span>
            <div className="inline-flex rounded-lg overflow-hidden border border-blue-300 ml-6">
              <button
                type="button"
                onClick={() => setViewLang("en")}
                className={`px-3 py-1 text-sm font-medium ${viewLang === "en" ? "bg-white text-blue-600" : "bg-blue-600/20 text-white hover:bg-blue-600/30"}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setViewLang("zh")}
                className={`px-3 py-1 text-sm font-medium ${viewLang === "zh" ? "bg-white text-blue-600" : "bg-blue-600/20 text-white hover:bg-blue-600/30"}`}
              >
                中文
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[pkg.status]}`}
            >
              {pkg.status.toUpperCase()}
            </span>
            <Link to={`/admin/packages/${pkg.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Package
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Similar to Public View */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Image Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="relative h-96 bg-gray-100">
            <img
              src={
                (Array.isArray(pkg.images) && pkg.images[selectedImage]?.url) ||
                coverImage?.url ||
                "https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg"
              }
              alt={pkg.title}
              className="w-full h-full object-contain"
            />
            {pkg.featured && (
              <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 fill-current" />
                Featured Package
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {Array.isArray(pkg.images) && pkg.images.length > 1 && (
            <div className="p-4 grid grid-cols-4 md:grid-cols-6 gap-2">
              {pkg.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? "border-blue-600"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-20 object-contain bg-gray-100"
                  />
                  {img.isCover && (
                    <div className="absolute top-1 right-1 bg-yellow-400 text-xs px-1 py-0.5 rounded">
                      Cover
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Info */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {viewLang === "en" ? pkg.title : pkgZh?.title || pkg.title}
              </h1>

              {/* Categories */}
              {viewLang === "en" &&
                pkg.categories &&
                pkg.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              {viewLang === "zh" &&
                pkgZh?.categories &&
                pkgZh.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkgZh.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

              <p className="text-xl text-gray-700 mb-6">
                {viewLang === "en"
                  ? pkg.shortDescription
                  : pkgZh?.shortDescription || pkg.shortDescription}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-semibold text-gray-900">
                      {viewLang === "en"
                        ? pkg.destination
                        : pkgZh?.destination || pkg.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {pkg.duration} {pkg.durationUnit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Max Group</p>
                    <p className="font-semibold text-gray-900">
                      {pkg.minParticipants || 1} - {pkg.maxParticipants} people
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Availability</p>
                    <p className="font-semibold text-gray-900">
                      {viewLang === "en"
                        ? pkg.availability
                        : pkgZh?.availability || pkg.availability}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {viewLang === "en" ? "About This Package" : "套餐详情"}
                </h2>
                <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                  {viewLang === "en"
                    ? pkg.description
                    : pkgZh?.description || pkg.description}
                </div>
              </div>
            </Card>

            {/* Highlights */}
            {viewLang === "en" &&
              pkg.highlights &&
              pkg.highlights.length > 0 && (
                <Card>
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Highlights
                    </h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pkg.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}
            {viewLang === "zh" &&
              pkgZh?.highlights &&
              pkgZh.highlights.length > 0 && (
                <Card>
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      亮点
                    </h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pkgZh.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

            {/* Itinerary */}
            {viewLang === "en" && pkg.itinerary && pkg.itinerary.length > 0 && (
              <Card>
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Itinerary
                  </h2>
                  <div className="space-y-6">
                    {pkg.itinerary.map((day, idx) => (
                      <div
                        key={idx}
                        className="border-l-4 border-blue-600 pl-6"
                      >
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Day {day.day}: {day.title}
                        </h3>
                        <p className="text-gray-700 mb-3">{day.description}</p>
                        {day.activities && day.activities.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-gray-600 mb-1">
                              Activities:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 text-sm">
                              {day.activities.map((activity, actIdx) => (
                                <li key={actIdx}>{activity}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {day.meals && day.meals.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Meals:</span>{" "}
                            {day.meals.join(", ")}
                          </p>
                        )}
                        {day.accommodation && (
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">
                              Accommodation:
                            </span>{" "}
                            {day.accommodation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
            {viewLang === "zh" &&
              pkgZh?.itinerary &&
              pkgZh.itinerary.length > 0 && (
                <Card>
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      行程安排
                    </h2>
                    <div className="space-y-6">
                      {pkgZh.itinerary.map((day, idx) => (
                        <div
                          key={idx}
                          className="border-l-4 border-blue-600 pl-6"
                        >
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            第{day.day}天: {day.title}
                          </h3>
                          <p className="text-gray-700 mb-3">
                            {day.description}
                          </p>
                          {day.activities && day.activities.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm font-semibold text-gray-600 mb-1">
                                活动:
                              </p>
                              <ul className="list-disc list-inside text-gray-700 text-sm">
                                {day.activities.map((activity, actIdx) => (
                                  <li key={actIdx}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

            {/* Included/Excluded */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {viewLang === "en" && pkg.included && pkg.included.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Check className="h-6 w-6 text-green-600" />
                      Included
                    </h3>
                    <ul className="space-y-2">
                      {pkg.included.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-gray-700"
                        >
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              {viewLang === "en" && pkg.excluded && pkg.excluded.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <X className="h-6 w-6 text-red-600" />
                      Not Included
                    </h3>
                    <ul className="space-y-2">
                      {pkg.excluded.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-gray-700"
                        >
                          <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}
              {viewLang === "zh" &&
                pkgZh?.included &&
                pkgZh.included.length > 0 && (
                  <Card>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Check className="h-6 w-6 text-green-600" />
                        费用包含
                      </h3>
                      <ul className="space-y-2">
                        {pkgZh.included.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-gray-700"
                          >
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )}
              {viewLang === "zh" &&
                pkgZh?.excluded &&
                pkgZh.excluded.length > 0 && (
                  <Card>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <X className="h-6 w-6 text-red-600" />
                        费用不含
                      </h3>
                      <ul className="space-y-2">
                        {pkgZh.excluded.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-gray-700"
                          >
                            <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )}
            </div>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-1">Starting from</p>
                    {(pkg.prices?.length
                      ? pkg.prices
                      : [{ amount: pkg.price, currency: pkg.currency }]
                    ).map((p: any, i: number) => (
                      <p
                        key={i}
                        className={
                          i === 0
                            ? "text-4xl font-bold text-blue-600"
                            : "text-xl font-semibold text-gray-600 mt-1"
                        }
                      >
                        {formatPrice(p.amount, p.currency)}
                      </p>
                    ))}
                    <p className="text-sm text-gray-600 mt-1">per person</p>
                  </div>

                  <div className="space-y-3 mb-6 pb-6 border-b">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-semibold text-gray-900">
                        {pkg.duration} {pkg.durationUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Group Size</span>
                      <span className="font-semibold text-gray-900">
                        {pkg.minParticipants || 1} - {pkg.maxParticipants}{" "}
                        people
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Availability</span>
                      <span className="font-semibold text-gray-900">
                        {pkg.availability}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-700 font-medium">
                      Admin Preview Mode
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      This is how the package will appear to{" "}
                      {pkg.status === "draft"
                        ? "users once published"
                        : "users"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

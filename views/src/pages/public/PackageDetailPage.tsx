import React, { useEffect, useState } from 'react';
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
import { Loading } from '../../components/common/Loading';
import { Button } from '../../components/common/Button';

export const PackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPackage(slug);
    }
  }, [slug]);

  const loadPackage = async (slug: string) => {
    setIsLoading(true);
    try {
      const response = await packageApi.getBySlug(slug);
      if (response.success && response.data) {
        setPkg(response.data);
        await packageApi.incrementView(response.data.id);
      }
    } catch (error) {
      console.error('Failed to load package:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (!pkg) return;
    const message = `Hello! I'm interested in the "${pkg.title}" package.\n\nPackage Details:\n- Duration: ${pkg.duration} ${pkg.durationUnit}\n- Price: ${formatPrice(pkg.price, pkg.currency)}\n- Destination: ${pkg.destination}\n\nI would like to know more details and availability.`;
    const link = getWhatsAppLink('6281234567890', message);
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

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!pkg) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Package not found</h2>
        <Link to="/packages" className="text-blue-600 hover:underline">
          Browse all packages
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link to="/packages" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Packages</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="relative h-[500px]">
                <img
                  src={pkg.images[currentImageIndex]?.url || 'https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg'}
                  alt={pkg.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setIsGalleryOpen(true)}
                />
                {pkg.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {pkg.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex ? 'bg-white w-8' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {pkg.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4">
                  {pkg.images.slice(0, 4).map((image, index) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={image.alt}
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
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{pkg.title}</h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.categories && pkg.categories.map((cat, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {cat}
                      </span>
                    ))}
                    {pkg.featured && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current" />
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-semibold text-gray-900">{pkg.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">{pkg.duration} {pkg.durationUnit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Group Size</p>
                    <p className="font-semibold text-gray-900">Max {pkg.maxParticipants}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Views</p>
                    <p className="font-semibold text-gray-900">{pkg.viewCount}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{pkg.description}</p>

                {pkg.highlights.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Highlights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pkg.highlights.map((highlight, index) => (
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

            {pkg.itinerary.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Itinerary</h2>
                <div className="space-y-6">
                  {pkg.itinerary.map((day) => (
                    <div key={day.day} className="border-l-4 border-blue-600 pl-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Day {day.day}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900">{day.title}</h3>
                      </div>
                      <p className="text-gray-700 mb-3">{day.description}</p>
                      {day.activities.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {day.activities.map((activity, index) => (
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    What's Included
                  </h3>
                  <ul className="space-y-2">
                    {pkg.included.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <XCircle className="h-6 w-6 text-red-600" />
                    What's Excluded
                  </h3>
                  <ul className="space-y-2">
                    {pkg.excluded.map((item, index) => (
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
                <p className="text-sm text-gray-600 mb-1">Starting from</p>
                <p className="text-4xl font-bold text-blue-600">{formatPrice(pkg.price, pkg.currency)}</p>
                <p className="text-sm text-gray-600 mt-1">per person</p>
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
                Book via WhatsApp
              </Button>

              <Link to="/contact">
                <Button variant="outline" className="w-full">
                  Contact Us
                </Button>
              </Link>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Have questions? Our travel experts are here to help you plan the perfect trip.
                </p>
                <a
                  href="tel:+6281234567890"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  +62 812-3456-7890
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <img
            src={pkg.images[currentImageIndex]?.url}
            alt={pkg.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white">
            {currentImageIndex + 1} / {pkg.images.length}
          </div>
        </div>
      )}
    </div>
  );
};

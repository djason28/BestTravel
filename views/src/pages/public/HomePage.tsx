import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Calendar, Users, Shield, Award, Clock, Star } from 'lucide-react';
import { packageApi } from '../../services/api';
import type { Package } from '../../types';
import { formatPrice, formatCategories } from '../../utils/security';
import { Card } from '../../components/common/Card';
import { PackageCardSkeleton } from '../../components/common/Loading';

export const HomePage: React.FC = () => {
  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedPackages();
  }, []);

  const loadFeaturedPackages = async () => {
    try {
      const response = await packageApi.getAll({ limit: 6, sortBy: 'popular', status: 'published' });
      if (response.success) {
        setFeaturedPackages(response.data.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <section className="relative h-[600px] bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg')] bg-cover bg-center"></div>

        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Discover Your Next <span className="text-yellow-400">Adventure</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100">
              Curated travel experiences designed to create memories that last a lifetime
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Explore Packages
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-blue-600" />,
                title: 'Safe & Secure',
                description: 'Travel with confidence knowing your safety is our priority',
              },
              {
                icon: <Award className="h-12 w-12 text-blue-600" />,
                title: 'Best Prices',
                description: 'Competitive pricing with no hidden fees or surprises',
              },
              {
                icon: <Users className="h-12 w-12 text-blue-600" />,
                title: 'Expert Guides',
                description: 'Professional local guides with extensive knowledge',
              },
              {
                icon: <Clock className="h-12 w-12 text-blue-600" />,
                title: '24/7 Support',
                description: 'Round-the-clock assistance whenever you need it',
              },
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Packages</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Handpicked destinations and experiences for your perfect getaway
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
                const { visible: visibleCategories, remaining: remainingCount } = formatCategories(pkg.categories || [], 3);
                
                return (
                <Link key={pkg.id} to={`/packages/${pkg.slug}`}>
                  <Card hover className="h-full">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={pkg.images[0]?.url || 'https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg'}
                        alt={pkg.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      {pkg.featured && (
                        <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current" />
                          Featured
                        </div>
                      )}
                      {/* Categories chips overlay */}
                      {visibleCategories.length > 0 && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[calc(100%-8rem)]">
                          {visibleCategories.map((cat, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-xs font-semibold shadow-sm">
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
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{pkg.shortDescription}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span>{pkg.destination}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>{pkg.duration} {pkg.durationUnit}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <p className="text-sm text-gray-600">Starting from</p>
                          <p className="text-2xl font-bold text-blue-600">{formatPrice(pkg.price, pkg.currency)}</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          View Details
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
              View All Packages
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Let us help you plan the perfect trip tailored to your dreams and preferences
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Browse Packages
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="https://wa.me/6281234567890?text=Hello! I would like to inquire about travel packages."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
              >
                Contact via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* <section className="py-20 bg-white">
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
      </section> */}
    </div>
  );
};

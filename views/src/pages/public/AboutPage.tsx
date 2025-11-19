import React from 'react';
import { Shield, Award, Heart, Users, Target, Globe, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Best Travel Agency</h1>
          <p className="text-xl text-blue-100">Creating unforgettable travel experiences since 2015</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                Founded in 2015, Best Travel Agency was born from a passion for exploration and a desire to share the beauty of Indonesia with travelers from around the world. What started as a small team of dedicated travel enthusiasts has grown into one of the most trusted travel agencies in the region.
              </p>
              <p>
                We believe that travel is more than just visiting new places—it's about creating meaningful connections, experiencing different cultures, and making memories that last a lifetime. Our mission is to craft personalized travel experiences that go beyond the ordinary, taking you to hidden gems and iconic destinations alike.
              </p>
              <p>
                With over a decade of experience and thousands of satisfied travelers, we continue to innovate and improve our services, ensuring that every journey with us is exceptional. Our deep knowledge of Indonesia's diverse landscapes, rich culture, and warm hospitality allows us to create authentic experiences that truly capture the spirit of each destination.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-blue-600" />,
                title: 'Safe & Secure',
                description: 'Your safety is our top priority. We partner with certified operators and maintain the highest safety standards in all our tours.',
              },
              {
                icon: <Award className="h-12 w-12 text-blue-600" />,
                title: 'Award-Winning Service',
                description: 'Recognized for excellence in tourism, we have received multiple awards for our outstanding service and customer satisfaction.',
              },
              {
                icon: <Heart className="h-12 w-12 text-blue-600" />,
                title: 'Personalized Experiences',
                description: 'Every traveler is unique. We customize each itinerary to match your interests, preferences, and travel style.',
              },
              {
                icon: <Users className="h-12 w-12 text-blue-600" />,
                title: 'Expert Local Guides',
                description: 'Our professional guides are passionate locals who share their deep knowledge and love for their homeland with every guest.',
              },
              {
                icon: <Globe className="h-12 w-12 text-blue-600" />,
                title: 'Sustainable Tourism',
                description: 'We are committed to responsible travel practices that benefit local communities and preserve natural environments.',
              },
              {
                icon: <TrendingUp className="h-12 w-12 text-blue-600" />,
                title: 'Best Value',
                description: 'Competitive pricing without compromising quality. We offer transparent pricing with no hidden fees or surprises.',
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Target className="h-8 w-8 text-blue-600" />,
                  title: 'Excellence',
                  description: 'We strive for perfection in every detail, ensuring each journey exceeds expectations.',
                },
                {
                  icon: <Heart className="h-8 w-8 text-blue-600" />,
                  title: 'Passion',
                  description: 'Our love for travel and Indonesia drives us to create truly exceptional experiences.',
                },
                {
                  icon: <Shield className="h-8 w-8 text-blue-600" />,
                  title: 'Integrity',
                  description: 'We operate with honesty, transparency, and respect for our clients and partners.',
                },
              ].map((value, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '10+', label: 'Years of Experience' },
              { number: '18,000+', label: 'Happy Travelers' },
              { number: '50+', label: 'Destinations' },
              { number: '98%', label: 'Satisfaction Rate' },
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white rounded-lg shadow-md p-6">
                <p className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment</h2>
          <div className="space-y-4">
            {[
              'Providing authentic, culturally immersive experiences',
              'Supporting local communities and sustainable tourism',
              'Maintaining the highest standards of safety and service',
              'Offering transparent pricing with no hidden costs',
              'Being available 24/7 for our travelers',
              'Continuously improving and innovating our offerings',
            ].map((commitment, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">{commitment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Adventure?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of satisfied travelers and experience Indonesia like never before
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/packages">
              <Button size="lg" variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                Explore Packages
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

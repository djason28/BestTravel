import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MessageSquare, Eye, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { dashboardApi, inquiryApi } from '../../services/api';
import type { DashboardStats, Inquiry } from '../../types';
import { Loading } from '../../components/common/Loading';
import { Card } from '../../components/common/Card';
import { formatDate } from '../../utils/security';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsResponse, inquiriesResponse] = await Promise.all([
        dashboardApi.getStats(),
        inquiryApi.getAll({ limit: 5 }),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (inquiriesResponse.success) {
        setRecentInquiries(inquiriesResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  const statCards = [
    {
      title: 'Total Packages',
      value: stats?.totalPackages || 0,
      icon: <Package className="h-8 w-8" />,
      color: 'bg-blue-500',
      trend: '+12%',
      isPositive: true,
    },
    {
      title: 'Total Inquiries',
      value: stats?.totalInquiries || 0,
      icon: <MessageSquare className="h-8 w-8" />,
      color: 'bg-green-500',
      trend: '+23%',
      isPositive: true,
    },
    {
      title: 'Total Views',
      value: stats?.totalViews || 0,
      icon: <Eye className="h-8 w-8" />,
      color: 'bg-purple-500',
      trend: '+8%',
      isPositive: true,
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversionRate || 0}%`,
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'bg-orange-500',
      trend: '-2%',
      isPositive: false,
    },
  ];

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    converted: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} text-white p-3 rounded-lg`}>{stat.icon}</div>
                <span
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    stat.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.isPositive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {stat.trend}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Package Overview</h2>
                <Link to="/admin/packages" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                  View All
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Published</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.publishedPackages || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Drafts</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.draftPackages || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.totalPackages || 0}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/admin/packages/new"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Package className="h-5 w-5" />
                    <span>Add Package</span>
                  </Link>
                  <Link
                    to="/admin/inquiries"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>View Inquiries</span>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Inquiries</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {stats?.newInquiries || 0} New
                </span>
              </div>

              <div className="space-y-4">
                {recentInquiries.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No inquiries yet</p>
                ) : (
                  recentInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{inquiry.name}</p>
                          <p className="text-sm text-gray-600">{inquiry.packageTitle}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${statusColors[inquiry.status]}`}
                        >
                          {inquiry.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(inquiry.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>

              {recentInquiries.length > 0 && (
                <Link
                  to="/admin/inquiries"
                  className="block text-center mt-4 pt-4 border-t text-blue-600 hover:text-blue-700 text-sm font-semibold"
                >
                  View All Inquiries
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

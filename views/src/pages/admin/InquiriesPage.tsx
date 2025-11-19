import React, { useEffect, useState } from 'react';
import { Mail, Phone, MessageSquare, Calendar } from 'lucide-react';
import { inquiryApi } from '../../services/api';
import type { Inquiry } from '../../types';
import { formatDate } from '../../utils/security';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../contexts/ToastContext';

export const InquiriesPage: React.FC = () => {
  const { addToast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadInquiries();
  }, [filter]);

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const response = await inquiryApi.getAll({
        status: filter === 'all' ? undefined : filter,
        limit: 100,
      });
      if (response.success) {
        setInquiries(response.data);
      }
    } catch (error) {
      addToast('Failed to load inquiries', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: Inquiry['status']) => {
    try {
      await inquiryApi.updateStatus(id, status);
      addToast('Status updated successfully', 'success');
      loadInquiries();
    } catch (error) {
      addToast('Failed to update status', 'error');
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Inquiries</h1>
          <p className="text-gray-600 mt-1">Manage customer inquiries</p>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex gap-2">
            {['all', 'new', 'contacted', 'converted', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {inquiries.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <p className="text-gray-600">No inquiries found</p>
              </div>
            </Card>
          ) : (
            inquiries.map((inquiry) => (
              <Card key={inquiry.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{inquiry.name}</h3>
                      {inquiry.subject ? (
                        <p className="text-gray-600 font-medium">{inquiry.subject}</p>
                      ) : (
                        inquiry.packageTitle && <p className="text-gray-600">{inquiry.packageTitle}</p>
                      )}
                    </div>
                    <select
                      value={inquiry.status}
                      onChange={(e) => handleStatusChange(inquiry.id, e.target.value as Inquiry['status'])}
                      className={`px-3 py-1 rounded-full text-sm font-semibold border-0 ${statusColors[inquiry.status]}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${inquiry.email}`} className="hover:text-blue-600">
                        {inquiry.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${inquiry.phone}`} className="hover:text-blue-600">
                        {inquiry.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(inquiry.createdAt)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">{inquiry.message}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                    <span>Participants: {inquiry.participants}</span>
                    {inquiry.preferredDate && <span>Preferred Date: {inquiry.preferredDate}</span>}
                    <span className="capitalize">Source: {inquiry.source}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

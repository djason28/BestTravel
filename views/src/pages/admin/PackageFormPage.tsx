import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Star } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Input, Textarea } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { packageApi, uploadApi } from '../../services/api';
import type { Package, PackageFormData, ApiResponse, PackageImage } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { tokenizeCategories } from '../../utils/security';

const emptyForm: PackageFormData = {
  title: '',
  shortDescription: '',
  description: '',
  price: 1,
  currency: 'IDR',
  duration: 1,
  durationUnit: 'days',
  categories: [],
  destination: '',
  availability: '',
  maxParticipants: 1,
  highlights: [],
  included: [],
  excluded: [],
  itinerary: [],
  status: 'draft',
  featured: false,
};

export const PackageFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState<PackageFormData>(emptyForm);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [saving, setSaving] = useState<boolean>(false);
  const [includedText, setIncludedText] = useState<string>('');
  const [excludedText, setExcludedText] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<string>('');
  const [images, setImages] = useState<PackageImage[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res: ApiResponse<Package> = await packageApi.getById(id);
        if (res.success && res.data) {
          const p = res.data;
          setForm({
            title: p.title,
            shortDescription: p.shortDescription,
            description: p.description,
            price: p.price,
            currency: p.currency || 'IDR',
            duration: p.duration,
            durationUnit: p.durationUnit || 'days',
            categories: (p as any).categories || [],
            destination: p.destination,
            availability: p.availability || '',
            maxParticipants: p.maxParticipants || 0,
            highlights: p.highlights || [],
            included: p.included || [],
            excluded: p.excluded || [],
            itinerary: p.itinerary || [],
            status: (p.status === 'draft' || p.status === 'published') ? p.status : 'draft',
            featured: !!p.featured,
          });
          setIncludedText((p.included || []).join('\n'));
          setExcludedText((p.excluded || []).join('\n'));
          setImages(p.images || []);
        }
      } catch (e) {
        addToast('Failed to load package', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' || name === 'maxParticipants' ? Number(value) : value,
    }));
  };

  const onSubmit = async () => {
    // Validation
    if (form.price < 1) {
      addToast('Price must be at least 1', 'error');
      return;
    }
    if (form.maxParticipants < 1) {
      addToast('Max participants must be at least 1', 'error');
      return;
    }
    if (!form.title.trim()) {
      addToast('Title is required', 'error');
      return;
    }
    if (!form.destination.trim()) {
      addToast('Destination is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: PackageFormData = {
        ...form,
        included: includedText.split('\n').map(s => s.trim()).filter(Boolean),
        excluded: excludedText.split('\n').map(s => s.trim()).filter(Boolean),
      };
      // Include images in payload expected by backend
      (payload as any).images = images.map((img, idx) => ({ url: img.url, alt: img.alt || form.title, order: idx, isCover: !!img.isCover }));
      if (isEdit && id) {
        await packageApi.update(id, payload);
        addToast('Package updated', 'success');
      } else {
        await packageApi.create(payload);
        addToast('Package created', 'success');
      }
      navigate('/admin/packages');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save package';
      addToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Package' : 'Create Package'}</h1>
          <p className="text-gray-600 mt-1">{isEdit ? 'Update your travel package details' : 'Fill in the details to create a new package'}</p>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
            <p className="text-sm text-gray-600 mt-1">Essential details about your package</p>
          </div>

          {/* Title - Full width */}
          <Input label="Title" name="title" value={form.title} onChange={onChange} placeholder="Bali Paradise Tour" required />

          {/* Categories and Destination - Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories (e.g., beach, foodie, historical)</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    const submitKeys = ['Enter', ',',';'];
                    if (submitKeys.includes(e.key)) {
                      e.preventDefault();
                      const tokens: string[] = tokenizeCategories(categoryInput);
                      if (tokens.length) {
                        setForm(prev => ({
                          ...prev,
                          categories: Array.from(new Set([...prev.categories, ...tokens]))
                        }));
                        setCategoryInput('');
                      }
                    }
                  }}
                  onBlur={() => {
                    const tokens: string[] = tokenizeCategories(categoryInput);
                    if (tokens.length) {
                      setForm(prev => ({
                        ...prev,
                        categories: Array.from(new Set([...prev.categories, ...tokens]))
                      }));
                      setCategoryInput('');
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    const tokens: string[] = tokenizeCategories(pasted);
                    if (tokens.length) {
                      e.preventDefault();
                      setForm(prev => ({
                        ...prev,
                        categories: Array.from(new Set([...prev.categories, ...tokens]))
                      }));
                      setCategoryInput('');
                    }
                  }}
                  placeholder="Type and press Enter or use , ;"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">Hint: Press Enter or type comma/semicolon to add multiple categories.</p>
                {form.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.categories.map((cat, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {cat}
                        <button type="button" className="hover:text-blue-600 ml-1" onClick={() => setForm(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== idx) }))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Input label="Destination" name="destination" value={form.destination} onChange={onChange} placeholder="Bali, Indonesia" required />
          </div>

          {/* Short Description - Full width */}
          <Textarea label="Short Description" name="shortDescription" value={form.shortDescription} onChange={onChange} rows={3} placeholder="A brief overview of the package..." required />

          {/* Description - Full width */}
          <Textarea label="Description" name="description" value={form.description} onChange={onChange} rows={8} placeholder="Detailed description of the package..." required />
        </div>
      </Card>

      {/* Pricing & Duration */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">Pricing & Duration</h2>
            <p className="text-sm text-gray-600 mt-1">Set pricing and time details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={onChange}
                min="1"
                placeholder="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  form.price > 0 && form.price < 1 ? 'border-red-500' : ''
                }`}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum: 1</p>
              {form.price > 0 && form.price < 1 && (
                <p className="text-xs text-red-500 mt-1">Price must be at least 1</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={onChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="IDR">IDR - Indonesian Rupiah</option>
                <option value="USD">USD - US Dollar</option>
                <option value="SGD">SGD - Singapore Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={form.maxParticipants}
                onChange={onChange}
                min="1"
                placeholder="10"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  form.maxParticipants === 0 ? 'border-red-500' : ''
                }`}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum: 1 person</p>
              {form.maxParticipants === 0 && (
                <p className="text-xs text-red-500 mt-1">At least 1 participant required</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Duration (number)" name="duration" type="number" value={form.duration} onChange={onChange} placeholder="3" required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration Unit</label>
              <select 
                name="durationUnit" 
                value={form.durationUnit} 
                onChange={onChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="days">Days</option>
                <option value="nights">Nights</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* What's Included & Excluded */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">What's Included & Excluded</h2>
            <p className="text-sm text-gray-600 mt-1">List what's part of the package and what's not</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Textarea 
              label="What's Included (one item per line)" 
              value={includedText} 
              onChange={(e) => setIncludedText(e.target.value)} 
              rows={6}
              placeholder="Transport&#10;Accommodation&#10;Meals&#10;Tour guide"
            />
            <Textarea 
              label="What's Excluded (one item per line)" 
              value={excludedText} 
              onChange={(e) => setExcludedText(e.target.value)} 
              rows={6}
              placeholder="Personal expenses&#10;Travel insurance&#10;Tips"
            />
          </div>
        </div>
      </Card>

      {/* Images */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">Images</h2>
            <p className="text-sm text-gray-600 mt-1">Upload beautiful images of your package</p>
          </div>

          <div className="space-y-4">
            {/* Upload Button */}
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const res = await uploadApi.uploadImage(f, 'packages');
                      if (res.success && (res as any).data?.url) {
                        const url = (res as any).data.url;
                        const img: PackageImage = { id: '', url, alt: form.title || 'image', order: images.length, isCover: images.length === 0 };
                        setImages(prev => [...prev, img]);
                        addToast('Image uploaded', 'success');
                      }
                    } catch (err) {
                      addToast('Failed to upload image', 'error');
                    } finally {
                      if (e.currentTarget) {
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
            </label>

            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">{images.length} image{images.length > 1 ? 's' : ''} uploaded</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img 
                        src={img.url} 
                        alt={img.alt} 
                        className="w-full h-full object-cover rounded-lg shadow-md"
                      />
                      
                      {/* Cover Badge */}
                      {img.isCover && (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Cover
                        </div>
                      )}

                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                        {!img.isCover && (
                          <button 
                            type="button" 
                            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                            onClick={() => setImages(prev => prev.map((im, i) => ({ ...im, isCover: i === idx })))}
                          >
                            <Star className="h-3 w-3" />
                            Set as Cover
                          </button>
                        )}
                        <button 
                          type="button" 
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Status & Actions */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publishing Status</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={onChange} 
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft (Not visible to public)</option>
                  <option value="published">Published (Live on website)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {form.status === 'draft' ? 'Package will be saved as draft and not visible to users.' : 'Package will be live and visible to all users.'}
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                  <span className="font-medium flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Mark as Featured
                  </span>
                  <p className="text-xs text-gray-500">Featured packages appear on homepage and get priority display</p>
                </label>
              </div>
            </div>

            <div className="flex gap-3 md:justify-end items-end h-full pb-1">
              <Button variant="ghost" onClick={() => navigate('/admin/packages')}>
                Cancel
              </Button>
              <Button onClick={onSubmit} isLoading={saving}>
                {form.status === 'published' ? '✓ Publish Package' : '💾 Save as Draft'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

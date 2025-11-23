import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search, SlidersHorizontal, X } from 'lucide-react';
import { packageApi } from '../../services/api';
import type { Package, FilterOptions, PackageFilterOptions } from '../../types';
import { formatPrice, formatDate, debounce, formatCategories } from '../../utils/security';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { ConfirmModal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';

export const PackagesPage: React.FC = () => {
  const { addToast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    categories: [],
    categoryMode: 'any',
    destinations: [],
    currencies: [],
    availability: '',
    featuredOnly: false,
    notFeatured: false,
    status: undefined,
    sortBy: 'newest',
    page: 1,
    limit: 100,
  });
  const [options, setOptions] = useState<PackageFilterOptions>({ categories: [], destinations: [], currencies: [], availability: [] });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; packageId: string | null }>({
    isOpen: false,
    packageId: null,
  });
  const [viewLang, setViewLang] = useState<'en' | 'zh'>('en');

  useEffect(() => {
    loadPackages();
  }, [searchQuery, filters]);

  useEffect(() => {
    (async () => {
      try {
        const res = await packageApi.getOptions();
        if (res.success && res.data) setOptions(res.data);
      } catch (e) {
        // non-fatal for admin list
        console.warn('Failed to load filter options', e);
      }
    })();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const payload: FilterOptions = { ...filters, search: searchQuery };
      const [resEn, resZh] = await Promise.all([
        packageApi.getAll(payload, 'en'),
        packageApi.getAll(payload, 'zh'),
      ]);
      if (resEn.success) {
        const zhMap: Record<string, Package> = {};
        if (resZh.success) {
          resZh.data.forEach(p => { zhMap[p.id] = p; });
        }
        const merged = resEn.data.map(p => {
          const zh = zhMap[p.id];
          if (!zh) return p;
          return {
            ...p,
            titleZh: zh.title,
            shortDescriptionZh: zh.shortDescription,
            descriptionZh: zh.description,
            categoriesZh: (zh as any).categories || [],
            destinationZh: zh.destination,
            availabilityZh: zh.availability,
            highlightsZh: zh.highlights,
            includedZh: zh.included,
            excludedZh: zh.excluded,
            itinerary: p.itinerary.map((day, idx) => {
              const zhDay = (zh.itinerary || [])[idx];
              if (!zhDay) return day;
              return { ...day, titleZh: zhDay.title, descriptionZh: zhDay.description } as any;
            }),
          } as any;
        });
        setPackages(merged);
      }
    } catch (error) {
      addToast('Failed to load packages', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Create debounced search function once (outside render)
  const debouncedSearch = React.useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value);
    }, 500),
    []
  );

  const handleSearch = (value: string) => {
    debouncedSearch(value);
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const updateCategories = (cat: string, checked: boolean) => {
    setFilters((prev) => {
      const current = new Set(prev.categories || []);
      if (checked) current.add(cat); else current.delete(cat);
      return { ...prev, categories: Array.from(current), category: '', page: 1 };
    });
  };

  const updateDestinations = (d: string, checked: boolean) => {
    setFilters((prev) => {
      const current = new Set(prev.destinations || []);
      if (checked) current.add(d); else current.delete(d);
      return { ...prev, destinations: Array.from(current), destination: '', page: 1 };
    });
  };

  const updateCurrencies = (ccy: string, checked: boolean) => {
    setFilters((prev) => {
      const current = new Set(prev.currencies || []);
      if (checked) current.add(ccy); else current.delete(ccy);
      return { ...prev, currencies: Array.from(current), currency: '', page: 1 };
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      categoryMode: 'any',
      destinations: [],
      currencies: [],
      availability: '',
      featuredOnly: false,
      notFeatured: false,
      status: undefined,
      sortBy: 'newest',
      page: 1,
      limit: 100,
    });
  };

  const handleDelete = async () => {
    if (!deleteModal.packageId) return;

    try {
      await packageApi.delete(deleteModal.packageId);
      addToast('Package deleted successfully', 'success');
      loadPackages();
    } catch (error) {
      addToast('Failed to delete package', 'error');
    } finally {
      setDeleteModal({ isOpen: false, packageId: null });
    }
  };

  const statusColors = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-600 mt-1">Manage your travel packages ({viewLang === 'en' ? 'English' : '中文视图'})</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
            <button type="button" onClick={() => setViewLang('en')} className={`px-3 py-1 text-sm font-medium ${viewLang==='en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>EN</button>
            <button type="button" onClick={() => setViewLang('zh')} className={`px-3 py-1 text-sm font-medium ${viewLang==='zh' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>中文</button>
          </div>
          <Link to="/admin/packages/new">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Add Package
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search packages..."
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {(options.categories || []).map((cat) => (
                    <label key={cat} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!filters.categories?.includes(cat)} onChange={(e) => updateCategories(cat, e.target.checked)} />
                      <span className="capitalize">{cat}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="text-sm text-gray-600 mr-3">Match</label>
                  <select value={filters.categoryMode || 'any'} onChange={(e) => updateFilter('categoryMode', e.target.value as FilterOptions['categoryMode'])} className="px-2 py-1 border rounded">
                    <option value="any">Any</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinations</label>
                <div className="grid grid-cols-2 gap-2">
                  {(options.destinations || []).map((d) => (
                    <label key={d} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!filters.destinations?.includes(d)} onChange={(e) => updateDestinations(d, e.target.checked)} />
                      <span className="capitalize">{d.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(options.currencies || []).map((ccy) => (
                    <label key={ccy} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!filters.currencies?.includes(ccy)} onChange={(e) => updateCurrencies(ccy, e.target.checked)} />
                      <span>{ccy}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <input type="text" value={filters.availability || ''} onChange={(e) => updateFilter('availability', e.target.value)} placeholder="e.g., year-round, seasonal" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
                <select
                  value={filters.featuredOnly ? 'featured' : filters.notFeatured ? 'not' : 'all'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'featured') setFilters((p) => ({ ...p, featuredOnly: true, notFeatured: false, page: 1 }));
                    else if (val === 'not') setFilters((p) => ({ ...p, featuredOnly: false, notFeatured: true, page: 1 }));
                    else setFilters((p) => ({ ...p, featuredOnly: false, notFeatured: false, page: 1 }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="featured">Featured only</option>
                  <option value="not">Not featured</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value || undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input type="number" min={1} placeholder="Min" className="w-full px-3 py-2 border rounded" onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) : undefined)} />
                  <input type="number" min={1} placeholder="Max" className="w-full px-3 py-2 border rounded" onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                <div className="flex gap-2">
                  <input type="number" min={1} placeholder="Min" className="w-full px-3 py-2 border rounded" onChange={(e) => updateFilter('durationMin', e.target.value ? Number(e.target.value) : undefined)} />
                  <input type="number" min={1} placeholder="Max" className="w-full px-3 py-2 border rounded" onChange={(e) => updateFilter('durationMax', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
                <div className="flex gap-2">
                  <input type="number" min={1} placeholder="Min" className="w-full px-3 py-2 border rounded" onChange={(e) => updateFilter('participantsMin', e.target.value ? Number(e.target.value) : undefined)} />
                  <input type="number" min={1} placeholder="Max" className="w-full px-3 py-2 border rounded" onChange={(e) => updateFilter('participantsMax', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select value={filters.sortBy} onChange={(e) => updateFilter('sortBy', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="duration_asc">Duration: Short to Long</option>
                  <option value="duration_desc">Duration: Long to Short</option>
                  <option value="inquiries_desc">Most Inquiries</option>
                  <option value="inquiries_asc">Least Inquiries</option>
                </select>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button onClick={clearFilters} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  <X className="h-4 w-4" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {packages.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <p className="text-gray-600 mb-4">No packages found</p>
                <Link to="/admin/packages/new">
                  <Button>Create Your First Package</Button>
                </Link>
              </div>
            </Card>
          ) : (
            packages.map((pkg) => {
              const { visible: visibleCategories, remaining: remainingCount } = formatCategories(pkg.categories || [], 3);
              
              return (
              <Card key={pkg.id}>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={pkg.images[0]?.url || 'https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg'}
                      alt={pkg.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-900">{viewLang==='en' ? pkg.title : (pkg as any).titleZh || pkg.title}</h3>
                            {pkg.featured && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                <span>⭐</span> Featured
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{viewLang==='en' ? pkg.destination : (pkg as any).destinationZh || pkg.destination}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[pkg.status]}`}>
                          {pkg.status}
                        </span>
                      </div>
                      
                      {/* Categories chips */}
                      {visibleCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(viewLang==='en'?visibleCategories:formatCategories(((pkg as any).categoriesZh||[]),3).visible).map((cat, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {cat}
                            </span>
                          ))}
                              {viewLang==='en' && remainingCount > 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              +{remainingCount}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <p className="text-gray-700 mb-4 line-clamp-2">{viewLang==='en' ? pkg.shortDescription : (pkg as any).shortDescriptionZh || pkg.shortDescription}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <span>{formatPrice(pkg.price, pkg.currency)}</span>
                        <span>{pkg.duration} {pkg.durationUnit}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {pkg.viewCount} views
                        </span>
                        <span>Created: {formatDate(pkg.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/admin/packages/${pkg.id}/preview`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </Link>
                        <Link to={`/admin/packages/${pkg.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteModal({ isOpen: true, packageId: pkg.id })}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              );
            })
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, packageId: null })}
        onConfirm={handleDelete}
        title="Delete Package"
        message="Are you sure you want to delete this package? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

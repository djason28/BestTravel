import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Package, PackageFilterOptions } from '../types';
import { packageApi } from '../services/api';
import { currentLang } from '../i18n';

interface DataCacheContextValue {
  featured: Package[] | null;
  filterOptions: PackageFilterOptions | null;
  prefetchFeatured: () => Promise<void>;
  prefetchFilterOptions: () => Promise<void>;
}

const DataCacheContext = createContext<DataCacheContextValue | undefined>(undefined);

const FEATURED_LIMIT = 6;

export const DataCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [featured, setFeatured] = useState<Package[] | null>(null);
  const [filterOptions, setFilterOptions] = useState<PackageFilterOptions | null>(null);

  const prefetchFeatured = useCallback(async () => {
    if (featured) return; // already cached
    try {
      const lang = currentLang() === 'zh' ? 'zh' : 'en';
      const res = await packageApi.getAll({ limit: FEATURED_LIMIT, sortBy: 'popular', status: 'published' }, lang);
      if (res.success) setFeatured(res.data.slice(0, FEATURED_LIMIT));
    } catch { /* ignore */ }
  }, [featured]);

  const prefetchFilterOptions = useCallback(async () => {
    if (filterOptions) return;
    try {
      const lang = currentLang() === 'zh' ? 'zh' : 'en';
      const res = await packageApi.getOptions(lang);
      if (res.success && res.data) setFilterOptions(res.data);
    } catch { /* ignore */ }
  }, [filterOptions]);

  return (
    <DataCacheContext.Provider value={{ featured, filterOptions, prefetchFeatured, prefetchFilterOptions }}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error('useDataCache must be used within DataCacheProvider');
  return ctx;
};
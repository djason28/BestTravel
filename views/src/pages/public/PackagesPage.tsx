import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Star,
  X,
} from "lucide-react";
import { packageApi } from "../../services/api";
import type { Package, FilterOptions, PackageFilterOptions } from "../../types";
import { debounce, formatCategories } from "../../utils/security";
import { buildFilterQuery, parseFilterParams } from "../../utils/query";
import { Card } from "../../components/common/Card";
import { PackageCardSkeleton } from "../../components/common/Loading";
import { Button } from "../../components/common/Button";
import { t, currentLang } from "../../i18n";
import { useNavigationState } from "../../contexts/NavigationContext";
import { useDataCache } from "../../contexts/DataCacheContext";

export const PackagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const { endNavigation, startNavigation } = useNavigationState();
  const [showFilters, setShowFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<FilterOptions>({
    ...parseFilterParams(searchParams as any),
    status: "published",
  } as FilterOptions);

  const [options, setOptions] = useState<PackageFilterOptions>({
    categories: [],
    destinations: [],
    currencies: [],
    availability: [],
  });
  const { filterOptions: cachedOptions, prefetchFilterOptions } =
    useDataCache();

  useEffect(() => {
    prefetchFilterOptions();
    if (cachedOptions) {
      setOptions(cachedOptions);
    } else {
      packageApi
        .getOptions(currentLang() === "zh" ? "zh" : "en")
        .then((res) => {
          if (res.success && res.data) {
            setOptions(res.data);
          }
        })
        .catch((e) => {
          console.warn("Failed to load filter options", e);
        });
    }
  }, [cachedOptions, prefetchFilterOptions]);

  useEffect(() => {
    loadPackages();
  }, [filters]);

  const loadPackages = async () => {
    setIsLoading(true);
    startNavigation();
    const lang = currentLang();
    try {
      const response = await packageApi.getAll(
        filters,
        lang === "zh" ? "zh" : "en",
      );
      if (response.success) {
        setPackages(response.data);
        setTotalPages(response.pagination.totalPages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total || response.data.length);
      }
    } catch (error) {
      console.error("Failed to load packages:", error);
    } finally {
      setIsLoading(false);
      endNavigation();
    }
  };

  const handleSearchChange = debounce((value: string) => {
    updateFilter("search", value);
  }, 500);

  const syncSearchParams = (obj: FilterOptions) => {
    const q = buildFilterQuery(obj);
    const params = new URLSearchParams(q);
    setSearchParams(params);
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const newFilters: FilterOptions = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    syncSearchParams(newFilters);
  };

  const updateCategories = (cat: string, checked: boolean) => {
    const current = new Set(filters.categories || []);
    if (checked) current.add(cat);
    else current.delete(cat);
    const categories = Array.from(current);
    const newFilters = { ...filters, categories, category: "", page: 1 };
    setFilters(newFilters);
    syncSearchParams(newFilters);
  };

  const clearFilters = () => {
    const defaults: FilterOptions = {
      search: "",
      category: "",
      categories: [],
      categoryMode: "any",
      destination: "",
      sortBy: "newest",
      featuredOnly: false,
      notFeatured: false,
      status: "published",
      page: 1,
      limit: 12,
    };
    setFilters(defaults);
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    (filters.search && filters.search !== "") ||
    (filters.category && filters.category !== "") ||
    (filters.categories && filters.categories.length > 0) ||
    (filters.destination && filters.destination !== "") ||
    (filters.destinations && filters.destinations.length > 0) ||
    (filters.availability && filters.availability !== "") ||
    filters.featuredOnly ||
    filters.notFeatured,
  );

  const paginationItems = useMemo<(number | "ellipsis")[]>(() => {
    const items: (number | "ellipsis")[] = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }
    if (currentPage <= 4) {
      items.push(1, 2, 3, 4, 5, "ellipsis", totalPages - 1, totalPages);
      return items;
    }
    if (currentPage >= totalPages - 4) {
      items.push(1, 2, "ellipsis");
      for (let i = totalPages - 4; i <= totalPages; i++) items.push(i);
      return items;
    }
    // Middle window
    items.push(
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
      "ellipsis",
      totalPages - 1,
      totalPages,
    );
    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-sky-50 min-h-screen">
      <div
        className="text-white py-16"
        style={{
          background: "linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("packages_page_title")}
          </h1>
          <p className="text-xl text-cyan-100 relative">
            {t("packages_page_subtitle")}
            <span className="block mt-4 h-1 w-32 bg-gradient-to-r from-white/70 to-cyan-200 rounded"></span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                defaultValue={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>{t("filters")}</span>
              {hasActiveFilters && (
                <span className="bg-[#0891b2] text-white text-xs px-2 py-1 rounded-full">
                  {t("active")}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("categories")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(options.categories || []).map((cat) => (
                    <label
                      key={cat}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={!!filters.categories?.includes(cat)}
                        onChange={(e) =>
                          updateCategories(cat, e.target.checked)
                        }
                      />
                      <span className="capitalize">{cat}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="text-sm text-gray-600 mr-3">
                    {t("match")}
                  </label>
                  <select
                    value={filters.categoryMode || "any"}
                    onChange={(e) =>
                      updateFilter("categoryMode", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  >
                    <option value="any">{t("any")}</option>
                    <option value="all">{t("all")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("destination")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(options.destinations || []).map((d) => (
                    <label
                      key={d}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={!!filters.destinations?.includes(d)}
                        onChange={(e) => {
                          const current = new Set(filters.destinations || []);
                          if (e.target.checked) current.add(d);
                          else current.delete(d);
                          const dests = Array.from(current);
                          const nf = {
                            ...filters,
                            destinations: dests,
                            destination: "",
                            page: 1,
                          };
                          setFilters(nf);
                          syncSearchParams(nf);
                        }}
                      />
                      <span className="capitalize">{d.replace("-", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("availability")}
                </label>
                <input
                  type="text"
                  value={filters.availability || ""}
                  onChange={(e) => updateFilter("availability", e.target.value)}
                  placeholder={
                    currentLang() === "zh"
                      ? "例如: 全年, 季节性"
                      : "e.g., year-round, seasonal"
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("sort_by")}
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter("sortBy", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                >
                  <option value="newest">{t("newest_first")}</option>
                  <option value="popular">{t("most_popular")}</option>
                  <option value="duration_asc">
                    {t("duration_short_long")}
                  </option>
                  <option value="duration_desc">
                    {t("duration_long_short")}
                  </option>
                  <option value="inquiries_desc">{t("inquiries_most")}</option>
                  <option value="inquiries_asc">{t("inquiries_least")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("featured")}
                </label>
                <select
                  value={
                    filters.featuredOnly
                      ? "featured"
                      : filters.notFeatured
                        ? "not"
                        : "all"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "featured") {
                      const nf = {
                        ...filters,
                        featuredOnly: true,
                        notFeatured: false,
                        page: 1,
                      };
                      setFilters(nf);
                      syncSearchParams(nf);
                    } else if (val === "not") {
                      const nf = {
                        ...filters,
                        featuredOnly: false,
                        notFeatured: true,
                        page: 1,
                      };
                      setFilters(nf);
                      syncSearchParams(nf);
                    } else {
                      const nf = {
                        ...filters,
                        featuredOnly: false,
                        notFeatured: false,
                        page: 1,
                      };
                      setFilters(nf);
                      syncSearchParams(nf);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t("all")}</option>
                  <option value="featured">{t("featured_only")}</option>
                  <option value="not">{t("not_featured")}</option>
                </select>
              </div>

              {/* Price filter removed as requested */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("duration_days")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Min"
                    className="w-full px-3 py-2 border rounded"
                    value={String(searchParams.get("durationMin") || "")}
                    onChange={(e) =>
                      updateFilter(
                        "durationMin",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Max"
                    className="w-full px-3 py-2 border rounded"
                    value={String(searchParams.get("durationMax") || "")}
                    onChange={(e) =>
                      updateFilter(
                        "durationMax",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("participants")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Min"
                    className="w-full px-3 py-2 border rounded"
                    value={String(searchParams.get("participantsMin") || "")}
                    onChange={(e) =>
                      updateFilter(
                        "participantsMin",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Max"
                    className="w-full px-3 py-2 border rounded"
                    value={String(searchParams.get("participantsMax") || "")}
                    onChange={(e) =>
                      updateFilter(
                        "participantsMax",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="md:col-span-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-[#0891b2] hover:text-cyan-700"
                  >
                    <X className="h-4 w-4" />
                    <span>{t("clear_all_filters")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 text-sm md:text-base">
            {isLoading
              ? t("loading")
              : currentLang() === "zh"
                ? `${t("showing")} ${packages.length} / ${totalItems} ${t("packages_label")}` +
                  (totalPages > 1
                    ? ` (第 ${currentPage} / ${totalPages} ${t("pages")})`
                    : "")
                : `${t("showing")} ${packages.length} ${t("of")} ${totalItems} ${t("packages_label")}` +
                  (totalPages > 1
                    ? ` (${t("page")} ${currentPage} of ${totalPages})`
                    : "")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <PackageCardSkeleton key={i} />
              ))}
            </>
          ) : packages.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-xl text-gray-600 mb-4">{t("no_packages")}</p>
              <Button onClick={clearFilters}>{t("clear_filters")}</Button>
            </div>
          ) : (
            packages.map((pkg) => {
              const { visible: visibleCategories, remaining: remainingCount } =
                formatCategories(pkg.categories || [], 3);

              return (
                <div key={pkg.id}>
                  <Card hover className="h-full flex flex-col group">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={
                          Array.isArray(pkg.images) &&
                          pkg.images.length > 0 &&
                          pkg.images[0]?.url
                            ? pkg.images[0]?.url
                            : "https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg"
                        }
                        alt={pkg.title}
                        loading="lazy"
                        className="w-full h-full object-contain bg-gray-100 transition-transform duration-500 hover:scale-110"
                      />
                      {pkg.featured && (
                        <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current" />
                          {t("featured")}
                        </div>
                      )}
                      {/* Categories chips overlay */}
                      {visibleCategories.length > 0 && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[calc(100%-8rem)]">
                          {visibleCategories.map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-xs font-semibold shadow-sm"
                            >
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
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {currentLang() === "zh"
                          ? pkg.titleZh || pkg.title
                          : pkg.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {currentLang() === "zh"
                          ? pkg.shortDescriptionZh || pkg.shortDescription
                          : pkg.shortDescription}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-cyan-600" />
                          <span>
                            {currentLang() === "zh"
                              ? pkg.destinationZh || pkg.destination
                              : pkg.destination}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-cyan-600" />
                          <span>
                            {pkg.duration}{" "}
                            {currentLang() === "zh"
                              ? pkg.durationUnit === "days"
                                ? "天"
                                : pkg.durationUnit === "nights"
                                  ? "晚"
                                  : pkg.durationUnit === "hours"
                                    ? "小时"
                                    : pkg.durationUnit
                              : pkg.durationUnit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-4 border-t mt-auto">
                        <Link
                          to={`/packages/${pkg.slug}`}
                          className="px-6 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-cyan-700 transition-colors shadow-sm font-medium"
                        >
                          {currentLang() === "zh" ? "立刻预订！" : "Book Now!"}
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div
            className="flex flex-wrap justify-center gap-2"
            aria-label="Pagination navigation"
          >
            {/* Previous & First */}
            <Button
              disabled={currentPage === 1}
              onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
            >
              {t("previous")}
            </Button>
            <Button
              disabled={currentPage === 1}
              onClick={() => setFilters({ ...filters, page: 1 })}
              variant={currentPage === 1 ? "primary" : "outline"}
              aria-label="First page"
            >
              «
            </Button>
            {/* Page numbers */}
            {paginationItems.map((it, idx) =>
              it === "ellipsis" ? (
                <span
                  key={`e-${idx}`}
                  aria-hidden="true"
                  role="presentation"
                  className="px-3 py-2 text-gray-500 select-none"
                >
                  …
                </span>
              ) : (
                <Button
                  key={it}
                  variant={currentPage === it ? "primary" : "outline"}
                  aria-current={currentPage === it ? "page" : undefined}
                  onClick={() => setFilters({ ...filters, page: it })}
                >
                  {it}
                </Button>
              ),
            )}
            {/* Last & Next */}
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setFilters({ ...filters, page: totalPages })}
              variant={currentPage === totalPages ? "primary" : "outline"}
              aria-label="Last page"
            >
              »
            </Button>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
              aria-label="Next page"
            >
              {t("next")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface ColumnFilter {
  key: string;
  value: string;
}

export function useTableFilters<T extends Record<string, any>>(
  data: T[],
  searchableKeys: (keyof T)[]
) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });

  const updateColumnFilter = useCallback((key: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setGlobalSearch('');
    setColumnFilters({});
    setSortConfig({ key: '', direction: null });
  }, []);

  const toggleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { key: '', direction: null };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply global search
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase().trim();
      result = result.filter(item => 
        searchableKeys.some(key => {
          const value = item[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue.trim()) {
        const filterLower = filterValue.toLowerCase().trim();
        result = result.filter(item => {
          const value = item[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(filterLower);
        });
      }
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [data, globalSearch, columnFilters, sortConfig, searchableKeys]);

  const hasActiveFilters = globalSearch.trim() !== '' || 
    Object.values(columnFilters).some(v => v.trim() !== '');

  return {
    globalSearch,
    setGlobalSearch,
    columnFilters,
    updateColumnFilter,
    sortConfig,
    toggleSort,
    clearAllFilters,
    filteredData: filteredAndSortedData,
    hasActiveFilters,
    totalCount: data.length,
    filteredCount: filteredAndSortedData.length
  };
}

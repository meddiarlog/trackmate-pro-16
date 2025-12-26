import * as React from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X, List, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SortConfig, SortDirection } from "@/hooks/useTableFilters";

export interface FilterableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface FilterableTableProps<T> {
  data: T[];
  columns: FilterableColumn<T>[];
  globalSearch: string;
  onGlobalSearchChange: (value: string) => void;
  columnFilters: Record<string, string>;
  onColumnFilterChange: (key: string, value: string) => void;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalCount: number;
  filteredCount: number;
  showViewToggle?: boolean;
  viewMode?: 'table' | 'cards';
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  renderCard?: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') {
    return <ArrowUp className="h-3 w-3" />;
  }
  if (direction === 'desc') {
    return <ArrowDown className="h-3 w-3" />;
  }
  return <ArrowUpDown className="h-3 w-3 opacity-50" />;
}

export function FilterableTable<T extends Record<string, any>>({
  data,
  columns,
  globalSearch,
  onGlobalSearchChange,
  columnFilters,
  onColumnFilterChange,
  sortConfig,
  onSort,
  onClearFilters,
  hasActiveFilters,
  totalCount,
  filteredCount,
  showViewToggle = false,
  viewMode = 'table',
  onViewModeChange,
  renderCard,
  emptyMessage = "Nenhum registro encontrado",
  keyExtractor,
  onRowClick,
  isLoading = false,
}: FilterableTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Header with global search and view toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="FILTRAR"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            className="pl-10 pr-10 bg-background"
          />
          {globalSearch && (
            <button
              onClick={() => onGlobalSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          )}
          
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredCount} de {totalCount}
          </span>

          {showViewToggle && onViewModeChange && (
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-2"
                onClick={() => onViewModeChange('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-2"
                onClick={() => onViewModeChange('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {/* Column Headers */}
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableHead
                      key={String(column.key)}
                      className={cn(
                        "whitespace-nowrap font-semibold",
                        column.sortable && "cursor-pointer select-none hover:bg-muted",
                        column.headerClassName
                      )}
                      onClick={column.sortable ? () => onSort(String(column.key)) : undefined}
                    >
                      <div className="flex items-center gap-1">
                        <span>{column.header}</span>
                        {column.sortable && (
                          <SortIcon 
                            direction={sortConfig.key === String(column.key) ? sortConfig.direction : null} 
                          />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
                {/* Column Filters */}
                <TableRow className="bg-background hover:bg-background border-b">
                  {columns.map((column) => (
                    <TableHead key={`filter-${String(column.key)}`} className="p-1">
                      {column.filterable !== false ? (
                        <Input
                          placeholder="FILTRAR"
                          value={columnFilters[String(column.key)] || ''}
                          onChange={(e) => onColumnFilterChange(String(column.key), e.target.value)}
                          className="h-7 text-xs bg-background"
                        />
                      ) : (
                        <div className="h-7" />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-muted-foreground">Carregando...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => (
                    <TableRow 
                      key={keyExtractor(item)}
                      className={cn(onRowClick && "cursor-pointer")}
                      onClick={onRowClick ? () => onRowClick(item) : undefined}
                    >
                      {columns.map((column) => (
                        <TableCell 
                          key={`${keyExtractor(item)}-${String(column.key)}`}
                          className={column.className}
                        >
                          {column.render 
                            ? column.render(item, index)
                            : String(item[column.key as keyof T] ?? '')
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && renderCard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center h-24">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-muted-foreground">Carregando...</span>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8">
              {emptyMessage}
            </div>
          ) : (
            data.map((item, index) => (
              <React.Fragment key={keyExtractor(item)}>
                {renderCard(item, index)}
              </React.Fragment>
            ))
          )}
        </div>
      )}
    </div>
  );
}

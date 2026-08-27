import React from 'react';
import { Category, FilterState, Cluster } from '../types';
import { Search, X, Layers, Atom, Cpu, FlaskConical, Sparkles, Folder, CheckCircle2, FileText, BarChart3, Building2 } from 'lucide-react';

interface SidebarProps {
  categories: Category[];
  clusters: Cluster[];
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  totalSimulatorsCount: number;
  totalViewsCount: number;
  isAdmin: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  Atom: <Atom className="w-4 h-4 text-amber-400" />,
  Cpu: <Cpu className="w-4 h-4 text-cyan-400" />,
  FlaskConical: <FlaskConical className="w-4 h-4 text-emerald-400" />,
  Sparkles: <Sparkles className="w-4 h-4 text-purple-400" />,
  Folder: <Folder className="w-4 h-4 text-sky-400" />
};

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  clusters,
  filterState,
  onFilterChange,
  totalSimulatorsCount,
  totalViewsCount,
  isAdmin,
}) => {
  return (
    <aside id="sidebar-filter" className="w-full lg:w-72 flex-shrink-0 space-y-6">
      
      {/* Cluster SaaS Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-purple-400" />
          Filter Cluster Institusi
        </span>
        <select
          id="select-cluster-filter"
          value={filterState.clusterId || 'all'}
          onChange={(e) => onFilterChange({ clusterId: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500 font-medium"
        >
          <option value="all">Semua Cluster Institusi</option>
          {clusters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Search Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Pencarian Simulator
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-simulator"
            type="text"
            placeholder="Cari judul, topik, atau tag..."
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-8 py-2.5 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
          />
          {filterState.searchQuery && (
            <button
              id="btn-clear-search"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Kategori Lab
          </span>
          {filterState.categoryId !== 'all' && (
            <button
              id="btn-reset-category"
              onClick={() => onFilterChange({ categoryId: 'all' })}
              className="text-[11px] text-sky-400 hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-1">
          <button
            id="cat-filter-all"
            onClick={() => onFilterChange({ categoryId: 'all' })}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              filterState.categoryId === 'all'
                ? 'bg-sky-950 text-sky-300 border border-sky-800/80 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-sky-400" />
              <span>Semua Kategori</span>
            </div>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
              {totalSimulatorsCount}
            </span>
          </button>

          {categories.map((cat) => {
            const isActive = filterState.categoryId === cat.id;
            const iconNode = iconMap[cat.icon || 'Folder'] || <Folder className="w-4 h-4 text-sky-400" />;

            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                onClick={() => onFilterChange({ categoryId: cat.id })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-950 text-sky-300 border border-sky-800/80 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {iconNode}
                  <span className="truncate">{cat.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Status Filter */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Status Publikasi (Admin)
          </span>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              id="btn-status-all"
              onClick={() => onFilterChange({ statusFilter: 'all' })}
              className={`py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                filterState.statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              id="btn-status-published"
              onClick={() => onFilterChange({ statusFilter: 'published' })}
              className={`py-1.5 text-[11px] font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${
                filterState.statusFilter === 'published'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Publik
            </button>
            <button
              id="btn-status-draft"
              onClick={() => onFilterChange({ statusFilter: 'draft' })}
              className={`py-1.5 text-[11px] font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${
                filterState.statusFilter === 'draft'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3 text-amber-400" />
              Draft
            </button>
          </div>
        </div>
      )}

      {/* Platform Statistics */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Statistik Platform
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-lg font-bold text-sky-400">{totalSimulatorsCount}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total Modul Lab</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-lg font-bold text-emerald-400">{totalViewsCount}</div>
            <div className="text-[11px] text-slate-500 font-medium">Akses Sesi Lab</div>
          </div>
        </div>
      </div>

    </aside>
  );
};

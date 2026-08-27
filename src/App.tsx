import React, { useState, useEffect, useMemo } from 'react';
import { Category, Simulator, User, FilterState, Cluster } from './types';
import { api } from './lib/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SimulatorCard } from './components/SimulatorCard';
import { SimulatorViewer } from './components/SimulatorViewer';
import { UploadModal } from './components/UploadModal';
import { CategoryModal } from './components/CategoryModal';
import { CodeInspectorModal } from './components/CodeInspectorModal';
import { AuthModal } from './components/AuthModal';
import { ClusterModal } from './components/ClusterModal';
import { Atom, Sparkles, FolderPlus, Layers, Search, AlertCircle, Info, MonitorPlay, Building2, Crown, GraduationCap, Shield } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [simulators, setSimulators] = useState<Simulator[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [isClusterOpen, setIsClusterOpen] = useState<boolean>(false);
  const [editingSimulator, setEditingSimulator] = useState<Simulator | null>(null);
  const [inspectingSimulator, setInspectingSimulator] = useState<Simulator | null>(null);

  // Active Selected Simulator for Viewer
  const [activeSimulator, setActiveSimulator] = useState<Simulator | null>(null);

  // Filters
  const [filterState, setFilterState] = useState<FilterState>({
    categoryId: 'all',
    searchQuery: '',
    statusFilter: 'all',
    clusterId: 'all'
  });

  // Initial Load & Auth Check
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);

        const cats = await api.getCategories();
        setCategories(cats);

        const clusterList = await api.getClusters();
        setClusters(clusterList);

        const sims = await api.getSimulators();
        setSimulators(sims);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memuat data awal');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Refresh simulators
  const refreshSimulators = async () => {
    try {
      const sims = await api.getSimulators();
      setSimulators(sims);
    } catch (err: any) {
      console.error('Error refreshing simulators:', err);
    }
  };

  // Refresh categories
  const refreshCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err: any) {
      console.error('Error refreshing categories:', err);
    }
  };

  // Refresh clusters
  const refreshClusters = async () => {
    try {
      const clusterList = await api.getClusters();
      setClusters(clusterList);
    } catch (err: any) {
      console.error('Error refreshing clusters:', err);
    }
  };

  // Auth Handlers
  const handleLogin = async (username: string, pass: string) => {
    const res = await api.login(username, pass);
    setUser(res.user);
    await refreshSimulators();
    await refreshClusters();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    refreshSimulators();
  };

  // Filter Update Handler
  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  };

  // Currently Selected Cluster
  const selectedCluster = useMemo(() => {
    if (user?.clusterId) {
      return clusters.find(c => c.id === user.clusterId) || null;
    }
    if (filterState.clusterId && filterState.clusterId !== 'all') {
      return clusters.find(c => c.id === filterState.clusterId) || null;
    }
    return null;
  }, [user, filterState.clusterId, clusters]);

  // Filtered Simulators
  const filteredSimulators = useMemo(() => {
    return simulators.filter((sim) => {
      // Role & Publish status check: non-teachers/admins see only published
      const canSeeDrafts = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_CLUSTER' || user?.role === 'TEACHER_CLUSTER';
      if (!canSeeDrafts && !sim.isPublished) {
        return false;
      }

      // Status filter for Admins/Teachers
      if (canSeeDrafts && filterState.statusFilter !== 'all') {
        if (filterState.statusFilter === 'published' && !sim.isPublished) return false;
        if (filterState.statusFilter === 'draft' && sim.isPublished) return false;
      }

      // Cluster filter
      if (filterState.clusterId && filterState.clusterId !== 'all') {
        if (sim.clusterId !== filterState.clusterId) return false;
      }

      // User's own cluster bound for non-super admins if cluster bound
      if (user?.role !== 'SUPER_ADMIN' && user?.clusterId) {
        if (sim.clusterId && sim.clusterId !== user.clusterId) return false;
      }

      // Category filter
      if (filterState.categoryId !== 'all' && sim.categoryId !== filterState.categoryId) {
        return false;
      }

      // Search query
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchTitle = sim.title.toLowerCase().includes(q);
        const matchDesc = sim.description.toLowerCase().includes(q);
        const matchTags = sim.tags.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }

      return true;
    });
  }, [simulators, filterState, user]);

  // Total Views
  const totalViewsCount = useMemo(() => {
    return simulators.reduce((acc, s) => acc + (s.viewsCount || 0), 0);
  }, [simulators]);

  // Can user edit/delete a given simulator
  const checkCanEdit = (sim: Simulator) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'ADMIN_CLUSTER' && user.clusterId === sim.clusterId) return true;
    if (user.role === 'TEACHER_CLUSTER' && user.clusterId === sim.clusterId) return true;
    return false;
  };

  // Simulator Actions
  const handleSelectSimulator = async (sim: Simulator | null) => {
    if (sim) {
      try {
        const fullSim = await api.getSimulatorById(sim.id);
        setActiveSimulator(fullSim);
        refreshSimulators();
      } catch {
        setActiveSimulator(sim);
      }
    } else {
      setActiveSimulator(null);
    }
  };

  const handleCreateOrUpdateSimulator = async (formData: FormData) => {
    if (editingSimulator) {
      await api.updateSimulator(editingSimulator.id, formData);
    } else {
      await api.createSimulator(formData);
    }
    setEditingSimulator(null);
    await refreshSimulators();
  };

  const handleDeleteSimulator = async (sim: Simulator) => {
    if (confirm(`Apakah Anda yakin ingin menghapus simulator "${sim.title}"?`)) {
      await api.deleteSimulator(sim.id);
      if (activeSimulator?.id === sim.id) {
        setActiveSimulator(null);
      }
      await refreshSimulators();
    }
  };

  const handleTogglePublish = async (sim: Simulator) => {
    const formData = new FormData();
    formData.append('isPublished', String(!sim.isPublished));
    await api.updateSimulator(sim.id, formData);
    await refreshSimulators();
  };

  // Category Actions
  const handleCreateCategory = async (cat: Omit<Category, 'id'>) => {
    await api.createCategory(cat);
    await refreshCategories();
  };

  const handleUpdateCategory = async (id: string, cat: Partial<Category>) => {
    await api.updateCategory(id, cat);
    await refreshCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    await refreshCategories();
    await refreshSimulators();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      
      {/* Header Bar */}
      <Header
        user={user}
        selectedCluster={selectedCluster}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenUploadModal={() => {
          setEditingSimulator(null);
          setIsUploadOpen(true);
        }}
        onOpenCategoryModal={() => setIsCategoryOpen(true)}
        onOpenClusterModal={() => setIsClusterOpen(true)}
        onSelectSimulator={handleSelectSimulator}
        selectedSimulatorId={activeSimulator?.id || null}
      />

      {/* Main Content Layout */}
      {activeSimulator ? (
        /* Interactive Sandbox Stage Viewer View */
        <SimulatorViewer
          simulator={activeSimulator}
          category={categories.find(c => c.id === activeSimulator.categoryId)}
          onBack={() => setActiveSimulator(null)}
          onViewCode={(sim) => setInspectingSimulator(sim)}
        />
      ) : (
        /* Curator Hub Catalog Grid View */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Cluster Specific Dashboard Hero Banner ("Tiap cluster punya tampilan dashboard masing-masing") */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800/80 rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
            <div className="max-w-3xl space-y-3 relative z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950 border border-purple-800/80 rounded-full text-xs font-semibold text-purple-300">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>{selectedCluster ? `Dashboard Cluster: ${selectedCluster.name}` : 'Platform Multi-Tenant SaaS Institusi'}</span>
                </div>
                {selectedCluster && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Paket {selectedCluster.subscriptionTier}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {selectedCluster
                  ? `Ruang Lab Interaktif — ${selectedCluster.name}`
                  : 'Koleksi Simulator Interaktif & Virtual Lab Edukasi'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedCluster
                  ? selectedCluster.description || `Platform kurasi simulator virtual terisolasi untuk civitas akademika ${selectedCluster.name}.`
                  : 'Platform kurasi terpusat SaaS untuk mengumpulkan, mengorganisasi, dan memublikasikan simulator single-file HTML bagi sekolah dan perguruan tinggi.'}
              </p>

              {/* Quick Role & Cluster Metrics */}
              {selectedCluster && (
                <div className="pt-3 flex flex-wrap gap-3 text-xs text-slate-300">
                  <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Quota: <strong>{selectedCluster.simulatorsCount || filteredSimulators.length}</strong> / {selectedCluster.maxSimulators} Simulator</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-sky-400" />
                    <span>Pengajar/Kontributor: <strong>{selectedCluster.teachersCount || 0}</strong> Guru</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar Filters */}
            <Sidebar
              categories={categories}
              clusters={clusters}
              filterState={filterState}
              onFilterChange={handleFilterChange}
              totalSimulatorsCount={simulators.length}
              totalViewsCount={totalViewsCount}
              isAdmin={user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_CLUSTER'}
            />

            {/* Grid Catalog Cards */}
            <div className="flex-1 w-full space-y-6">
              
              {/* Header Bar Catalog */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MonitorPlay className="w-4 h-4 text-sky-400" />
                  <h2 className="font-bold text-sm text-slate-200">
                    {filterState.categoryId !== 'all'
                      ? categories.find(c => c.id === filterState.categoryId)?.name || 'Kategori Terpilih'
                      : 'Semua Simulator'}
                  </h2>
                  <span className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800">
                    {filteredSimulators.length} modul
                  </span>
                </div>

                {!user && (
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-sky-400" />
                    <span>Mode Tamu / Akses Publik</span>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-64 animate-pulse space-y-4">
                      <div className="h-4 bg-slate-800 rounded w-1/3" />
                      <div className="h-6 bg-slate-800 rounded w-3/4" />
                      <div className="h-16 bg-slate-800 rounded" />
                      <div className="h-10 bg-slate-800 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && filteredSimulators.length === 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 text-base">Tidak ada simulator yang cocok</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Coba ubah kata kunci pencarian, pilih cluster institusi lain, atau pilih kategori simulator yang berbeda.
                    </p>
                  </div>
                  <button
                    onClick={() => setFilterState({ categoryId: 'all', searchQuery: '', statusFilter: 'all', clusterId: 'all' })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              )}

              {/* Simulator Cards Grid */}
              {!isLoading && filteredSimulators.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredSimulators.map((sim) => (
                    <SimulatorCard
                      key={sim.id}
                      simulator={sim}
                      category={categories.find(c => c.id === sim.categoryId)}
                      canEdit={checkCanEdit(sim)}
                      onSelect={(s) => handleSelectSimulator(s)}
                      onViewCode={(s) => setInspectingSimulator(s)}
                      onEdit={(s) => {
                        setEditingSimulator(s);
                        setIsUploadOpen(true);
                      }}
                      onDelete={(s) => handleDeleteSimulator(s)}
                      onTogglePublish={(s) => handleTogglePublish(s)}
                    />
                  ))}
                </div>
              )}

            </div>

          </div>

        </main>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setEditingSimulator(null);
        }}
        categories={categories}
        clusters={clusters}
        editingSimulator={editingSimulator}
        onSubmit={handleCreateOrUpdateSimulator}
      />

      <CategoryModal
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <ClusterModal
        isOpen={isClusterOpen}
        onClose={() => setIsClusterOpen(false)}
        currentUser={user}
        onClusterChange={() => {
          refreshClusters();
          refreshSimulators();
        }}
      />

      <CodeInspectorModal
        simulator={inspectingSimulator}
        onClose={() => setInspectingSimulator(null)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
      />

    </div>
  );
}

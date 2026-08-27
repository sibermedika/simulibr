import React from 'react';
import { User, Cluster } from '../types';
import { Atom, PlusCircle, FolderCog, Building2, Crown, GraduationCap, UserCheck, LogOut, LogIn, MonitorPlay, Sparkles } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  selectedCluster: Cluster | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenUploadModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenClusterModal: () => void;
  onSelectSimulator: (sim: null) => void;
  selectedSimulatorId: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  selectedCluster,
  onOpenAuthModal,
  onLogout,
  onOpenUploadModal,
  onOpenCategoryModal,
  onOpenClusterModal,
  onSelectSimulator,
  selectedSimulatorId,
}) => {
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isClusterAdmin = user?.role === 'ADMIN_CLUSTER';
  const isTeacher = user?.role === 'TEACHER_CLUSTER';
  const canUpload = isSuperAdmin || isClusterAdmin || isTeacher;
  const canManageCategories = isSuperAdmin || isClusterAdmin;

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectSimulator(null)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Atom className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                EduSim Hub
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase bg-purple-950 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-full">
                SaaS Curator Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              {selectedCluster ? `Cluster: ${selectedCluster.name}` : 'Platform Kurasi & Virtual Lab AI Institusi'}
            </p>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {selectedSimulatorId && (
            <button
              id="btn-back-to-hub"
              onClick={() => onSelectSimulator(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <MonitorPlay className="w-3.5 h-3.5 text-sky-400" />
              <span>Daftar Simulator</span>
            </button>
          )}

          {/* SaaS Cluster Management Button */}
          <button
            id="btn-manage-clusters"
            onClick={onOpenClusterModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 rounded-lg transition-all"
            title="SaaS Cluster Institusi"
          >
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Cluster SaaS</span>
          </button>

          {canManageCategories && (
            <button
              id="btn-manage-categories"
              onClick={onOpenCategoryModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Kelola Kategori"
            >
              <FolderCog className="w-3.5 h-3.5 text-indigo-400" />
              <span>Kategori</span>
            </button>
          )}

          {canUpload && (
            <button
              id="btn-add-simulator"
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-550 rounded-lg shadow-md shadow-sky-500/20 transition-all hover:shadow-sky-500/30 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">+ Upload HTML Simulator</span>
              <span className="sm:hidden">+ Baru</span>
            </button>
          )}

          {/* Role Status & Auth Button */}
          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs">
                {isSuperAdmin ? (
                  <Crown className="w-3.5 h-3.5 text-purple-400" />
                ) : isClusterAdmin ? (
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                ) : isTeacher ? (
                  <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="font-medium text-slate-200 capitalize max-w-[100px] truncate">{user.name || user.username}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  isSuperAdmin ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                  isClusterAdmin ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  isTeacher ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {user.role.replace('_CLUSTER', '')}
                </span>
              </div>

              <button
                id="btn-logout"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-open-login"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Masuk / Role SaaS</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

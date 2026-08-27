import React, { useState, useEffect } from 'react';
import { Cluster, User } from '../types';
import { api } from '../lib/api';
import { Building2, Plus, Users, Shield, Trash2, CheckCircle, Crown, Layers, Key, AlertCircle, X, Sparkles } from 'lucide-react';

interface ClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onClusterChange: () => void;
}

export const ClusterModal: React.FC<ClusterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onClusterChange
}) => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'clusters' | 'users' | 'add_cluster' | 'add_user'>('clusters');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New Cluster Form State
  const [newClusterName, setNewClusterName] = useState('');
  const [newClusterCode, setNewClusterCode] = useState('');
  const [newClusterDesc, setNewClusterDesc] = useState('');
  const [newClusterTier, setNewClusterTier] = useState<'FREE_TRIAL' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [newClusterAdminUser, setNewClusterAdminUser] = useState('');
  const [newClusterAdminPass, setNewClusterAdminPass] = useState('');

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN_CLUSTER' | 'TEACHER_CLUSTER' | 'STUDENT_CLUSTER'>('TEACHER_CLUSTER');
  const [newUserClusterId, setNewUserClusterId] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const clusterList = await api.getClusters();
      setClusters(clusterList);

      if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN_CLUSTER') {
        const userList = await api.getUsers();
        setUsers(userList);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data cluster');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.createCluster({
        name: newClusterName,
        code: newClusterCode,
        description: newClusterDesc,
        subscriptionTier: newClusterTier,
        adminUsername: newClusterAdminUser,
        adminPassword: newClusterAdminPass
      });

      setSuccess(`Cluster berlangganan "${newClusterName}" berhasil ditambahkan!`);
      setNewClusterName('');
      setNewClusterCode('');
      setNewClusterDesc('');
      setNewClusterAdminUser('');
      setNewClusterAdminPass('');
      setActiveTab('clusters');
      fetchData();
      onClusterChange();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat cluster baru');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const targetClusterId = isSuperAdmin ? newUserClusterId : currentUser?.clusterId;
      await api.createUser({
        name: newUserName,
        username: newUserUsername,
        password: newUserPassword,
        role: newUserRole,
        clusterId: targetClusterId
      });

      setSuccess(`Pengguna baru "${newUserUsername}" berhasil didaftarkan!`);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setActiveTab('users');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCluster = async (id: string, name: string) => {
    if (!confirm(`Hapus cluster "${name}" dan seluruh akses institusinya?`)) return;
    try {
      await api.deleteCluster(id);
      fetchData();
      onClusterChange();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus cluster');
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Hapus akun pengguna "${username}"?`)) return;
    try {
      await api.deleteUser(id);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus pengguna');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/80 text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Manajemen Multi-Tenant SaaS Cluster</h3>
              <p className="text-xs text-slate-400">Kurasi Institusi, Langganan AI, &amp; Manajemen Pengguna</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('clusters')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'clusters'
                ? 'border-purple-500 text-purple-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Daftar Cluster Berlangganan</span>
          </button>

          {(isSuperAdmin || currentUser?.role === 'ADMIN_CLUSTER') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-purple-500 text-purple-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Daftar Pengguna / Kontributor</span>
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('add_cluster')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'add_cluster'
                  ? 'border-purple-500 text-purple-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Buat Cluster Baru</span>
            </button>
          )}

          {(isSuperAdmin || currentUser?.role === 'ADMIN_CLUSTER') && (
            <button
              onClick={() => setActiveTab('add_user')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'add_user'
                  ? 'border-purple-500 text-purple-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Tambah Pengguna</span>
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: CLUSTERS LIST */}
          {activeTab === 'clusters' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Cluster SaaS Institusi</h4>
                  <p className="text-xs text-slate-400">Setiap cluster memiliki dashboard, domain virtual, dan simulator khusus</p>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => setActiveTab('add_cluster')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Cluster SaaS</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-100 text-sm">{cluster.name}</h5>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/60">
                              {cluster.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cluster.description}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                          {cluster.subscriptionTier}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Simulator</span>
                        <span className="font-bold text-slate-200 text-xs">{cluster.simulatorsCount || 0} / {cluster.maxSimulators}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Guru/Pengajar</span>
                        <span className="font-bold text-slate-200 text-xs">{cluster.teachersCount || 0} / {cluster.maxTeachers}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Siswa Active</span>
                        <span className="font-bold text-slate-200 text-xs">{cluster.studentsCount || 0}</span>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleDeleteCluster(cluster.id, cluster.name)}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Cluster</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: USERS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Daftar Pengguna Institusi</h4>
                  <p className="text-xs text-slate-400">Pengelola, Guru (Kontributor Simulator), dan Siswa</p>
                </div>
                <button
                  onClick={() => setActiveTab('add_user')}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengguna</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Nama / Username</th>
                      <th className="p-3">Role Akses</th>
                      <th className="p-3">Cluster Institusi</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {users.map((u) => {
                      const cluster = clusters.find(c => c.id === u.clusterId);
                      return (
                        <tr key={u.id} className="hover:bg-slate-900/50">
                          <td className="p-3">
                            <div className="font-bold text-slate-100">{u.name || u.username}</div>
                            <div className="text-[10px] text-slate-400 font-mono">@{u.username} ({u.email})</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.role === 'SUPER_ADMIN' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                              u.role === 'ADMIN_CLUSTER' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                              u.role === 'TEACHER_CLUSTER' ? 'bg-sky-950 text-sky-300 border-sky-800' :
                              'bg-emerald-950 text-emerald-300 border-emerald-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-300">
                            {cluster ? `${cluster.name} (${cluster.code})` : 'Global Platform'}
                          </td>
                          <td className="p-3 text-right">
                            {u.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CREATE CLUSTER FORM */}
          {activeTab === 'add_cluster' && isSuperAdmin && (
            <form onSubmit={handleCreateCluster} className="space-y-4 max-w-xl mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Crown className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-slate-100 text-sm">Registrasi Cluster SaaS Institusi Baru</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nama Institusi / Sekolah</label>
                  <input
                    type="text"
                    placeholder="Contoh: SMA Negeri 1 Jakarta"
                    value={newClusterName}
                    onChange={(e) => setNewClusterName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Kode Unik Cluster (Slug)</label>
                  <input
                    type="text"
                    placeholder="Contoh: sman1"
                    value={newClusterCode}
                    onChange={(e) => setNewClusterCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Deskripsi Institusi</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat institusi berlangganan..."
                  value={newClusterDesc}
                  onChange={(e) => setNewClusterDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Paket Langganan (Subscription Tier)</label>
                <select
                  value={newClusterTier}
                  onChange={(e: any) => setNewClusterTier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="PRO">PRO Tier (Max 50 Simulator, 15 Guru)</option>
                  <option value="ENTERPRISE">ENTERPRISE Tier (Unlimited Simulator &amp; Guru)</option>
                  <option value="FREE_TRIAL">FREE TRIAL (Max 5 Simulator, 2 Guru)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800/80 space-y-3">
                <span className="text-xs font-bold text-amber-400 block">Buat Akun Admin_[Cluster] Pertama:</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Username Admin (misal: admin_sman1)"
                    value={newClusterAdminUser}
                    onChange={(e) => setNewClusterAdminUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                  <input
                    type="password"
                    placeholder="Password Admin"
                    value={newClusterAdminPass}
                    onChange={(e) => setNewClusterAdminPass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20"
              >
                {isLoading ? 'Memproses...' : 'Daftarkan Cluster SaaS Baru'}
              </button>
            </form>
          )}

          {/* TAB 4: CREATE USER FORM */}
          {activeTab === 'add_user' && (
            <form onSubmit={handleCreateUser} className="space-y-4 max-w-xl mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Users className="w-5 h-5 text-sky-400" />
                <h4 className="font-bold text-slate-100 text-sm">Tambah Pengguna / Kontributor Institusi</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pak Budi (Guru Fisika)"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Username</label>
                  <input
                    type="text"
                    placeholder="Contoh: budi_fisika"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Role Pengguna</label>
                  <select
                    value={newUserRole}
                    onChange={(e: any) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="TEACHER_CLUSTER">Teacher_[Cluster] (Kontributor HTML)</option>
                    <option value="STUDENT_CLUSTER">Student_[Cluster] (Siswa Virtual Lab)</option>
                    {isSuperAdmin && <option value="ADMIN_CLUSTER">Admin_[Cluster] (Pengelola Cluster)</option>}
                  </select>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Pilih Cluster Institusi Target</label>
                  <select
                    value={newUserClusterId}
                    onChange={(e) => setNewUserClusterId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    required
                  >
                    <option value="">-- Pilih Cluster --</option>
                    {clusters.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20"
              >
                {isLoading ? 'Memproses...' : 'Simpan Akun Pengguna'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

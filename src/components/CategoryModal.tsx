import React, { useState } from 'react';
import { Category } from '../types';
import { X, FolderPlus, Trash2, Edit2, AlertCircle, Atom, Cpu, FlaskConical, Sparkles, Folder } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCreateCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  onUpdateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const iconsList = [
  { name: 'Atom', node: <Atom className="w-4 h-4 text-amber-400" /> },
  { name: 'Cpu', node: <Cpu className="w-4 h-4 text-cyan-400" /> },
  { name: 'FlaskConical', node: <FlaskConical className="w-4 h-4 text-emerald-400" /> },
  { name: 'Sparkles', node: <Sparkles className="w-4 h-4 text-purple-400" /> },
  { name: 'Folder', node: <Folder className="w-4 h-4 text-sky-400" /> },
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Atom');
  const [color, setColor] = useState('blue');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const startEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'Atom');
    setColor(cat.color || 'blue');
  };

  const resetForm = () => {
    setEditingCatId(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('Atom');
    setColor('blue');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama kategori wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (editingCatId) {
        await onUpdateCategory(editingCatId, { name, slug: generatedSlug, description, icon, color });
      } else {
        await onCreateCategory({ name, slug: generatedSlug, description, icon, color });
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini? Semua simulator dalam kategori ini akan ikut terhapus.')) {
      try {
        await onDeleteCategory(id);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal menghapus kategori');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800/80 text-indigo-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Manajemen Kategori Lab</h3>
              <p className="text-xs text-slate-400">Tambah, edit, atau hapus kategori simulator</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Create/Edit */}
          <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="font-semibold text-xs text-sky-400 uppercase tracking-wider">
              {editingCatId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Nama Kategori *</label>
                <input
                  type="text"
                  placeholder="Contoh: Termodinamika"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Ikon Kategori</label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  {iconsList.map((ic) => (
                    <option key={ic.name} value={ic.name}>
                      {ic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-300">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Penjelasan singkat modul lab..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingCatId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {editingCatId ? 'Simpan' : '+ Tambah'}
              </button>
            </div>
          </form>

          {/* List Categories */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Daftar Kategori Terdaftar
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-100 flex items-center gap-2">
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({cat.slug})</span>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-slate-400">{cat.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

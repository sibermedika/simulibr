import React, { useState, useEffect } from 'react';
import { Category, Simulator, Cluster } from '../types';
import { X, UploadCloud, FileCode, Sparkles, Check, AlertCircle, FileText, Tag, User, Layers, Building2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  clusters?: Cluster[];
  editingSimulator?: Simulator | null;
  onSubmit: (formData: FormData) => Promise<void>;
}

const PRESET_TEMPLATES = [
  {
    name: "Mekanika Pendulum Lab",
    categoryId: "cat-physics",
    html: `<!DOCTYPE html>\n<html>\n<head><style>body { background: #0f172a; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }</style></head>\n<body>\n  <div style="text-align: center;">\n    <h2>🔬 Simulator Pendulum Custom</h2>\n    <p>Simulasi siap dikustomisasi!</p>\n  </div>\n</body>\n</html>`
  },
  {
    name: "Sirkuit Logika Digital",
    categoryId: "cat-electronics",
    html: `<!DOCTYPE html>\n<html>\n<head><style>body { background: #090d16; color: #38bdf8; font-family: sans-serif; text-align: center; padding: 40px; }</style></head>\n<body>\n  <h2>⚡ Gerbang Logika Custom</h2>\n  <p>Input A dan B</p>\n</body>\n</html>`
  }
];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  categories,
  clusters = [],
  editingSimulator,
  onSubmit,
}) => {
  const [method, setMethod] = useState<'upload' | 'code' | 'preset'>('upload');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [clusterId, setClusterId] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('Pengajar EduHub');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [htmlCode, setHtmlCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingSimulator) {
      setTitle(editingSimulator.title);
      setSlug(editingSimulator.slug);
      setCategoryId(editingSimulator.categoryId);
      setDescription(editingSimulator.description);
      setAuthor(editingSimulator.author || 'Pengajar EduHub');
      setTags(editingSimulator.tags ? editingSimulator.tags.join(', ') : '');
      setIsPublished(editingSimulator.isPublished);
      setHtmlCode(editingSimulator.htmlContent || '');
      setMethod('code');
    } else {
      setTitle('');
      setSlug('');
      setCategoryId(categories[0]?.id || '');
      setDescription('');
      setAuthor('Pengajar EduHub');
      setTags('Edukasi, Interaktif, Lab');
      setIsPublished(true);
      setSelectedFile(null);
      setHtmlCode('');
      setMethod('upload');
    }
    setErrorMsg('');
  }, [editingSimulator, isOpen, categories]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        setSelectedFile(file);
        setErrorMsg('');
      } else {
        setErrorMsg('File harus berformat single-file HTML (.html / .htm)');
        setSelectedFile(null);
      }
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setHtmlCode(preset.html);
    if (preset.categoryId) setCategoryId(preset.categoryId);
    setMethod('code');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul simulator tidak boleh kosong.');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Pilih kategori untuk simulator.');
      return;
    }

    if (method === 'upload' && !selectedFile && !editingSimulator) {
      setErrorMsg('Pilih file .html yang akan diunggah.');
      return;
    }

    if (method === 'code' && !htmlCode.trim() && !editingSimulator) {
      setErrorMsg('Masukkan kode HTML simulator.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      formData.append('categoryId', categoryId);
      if (clusterId) formData.append('clusterId', clusterId);
      formData.append('description', description);
      formData.append('author', author);
      formData.append('isPublished', String(isPublished));

      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      formData.append('tags', JSON.stringify(tagArray));

      if (method === 'upload' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (htmlCode) {
        formData.append('htmlContent', htmlCode);
      }

      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan simulator');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-800/80 text-sky-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {editingSimulator ? 'Edit Simulator' : 'Tambah Simulator Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Unggah file .html mandiri atau tempel kode HTML interaktif
              </p>
            </div>
          </div>
          <button
            id="btn-close-upload-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setMethod('upload')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                method === 'upload' ? 'bg-sky-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload File HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('code')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                method === 'code' ? 'bg-sky-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Paste Kode HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('preset')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                method === 'preset' ? 'bg-sky-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Preset Template</span>
            </button>
          </div>

          {/* Method 1: File Uploader */}
          {method === 'upload' && (
            <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/80 rounded-xl p-6 text-center bg-slate-950/50 transition-colors cursor-pointer relative">
              <input
                id="file-input-html"
                type="file"
                accept=".html,.htm"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-10 h-10 text-sky-400 mx-auto mb-2 animate-bounce" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-semibold text-emerald-400">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB • Klik untuk ganti</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Tarik & Lepas file <span className="text-sky-400">.html</span> di sini, atau Klik untuk Browse
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mendukung single-file HTML dengan embedded CSS/JS (Maks. 15 MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Method 2: HTML Textarea */}
          {method === 'code' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex justify-between">
                <span>Kode HTML Simulator</span>
                <span className="text-slate-500">Single-file dengan &lt;style&gt; &amp; &lt;script&gt;</span>
              </label>
              <textarea
                id="textarea-html-content"
                rows={6}
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                placeholder="<!DOCTYPE html><html>...</html>"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {/* Method 3: Preset Templates */}
          {method === 'preset' && (
            <div className="grid grid-cols-2 gap-3">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyPreset(tmpl)}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-sky-500 rounded-xl cursor-pointer transition-all space-y-1"
                >
                  <div className="font-semibold text-xs text-sky-300 flex items-center justify-between">
                    <span>{tmpl.name}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-[11px] text-slate-500">Klik untuk memuat pola awal HTML</p>
                </div>
              ))}
            </div>
          )}

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Title */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Judul Simulator *</label>
              <input
                id="input-sim-title"
                type="text"
                placeholder="Contoh: Virtual Lab: Gelombang Bunyi Interaktif"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Kategori Lab *</label>
              <select
                id="select-sim-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cluster Institusi Target Dropdown */}
            {clusters && clusters.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Cluster Institusi Target</label>
                <select
                  id="select-sim-cluster"
                  value={clusterId}
                  onChange={(e) => setClusterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Cluster Bawaan Akun Anda --</option>
                  {clusters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Author */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Pengajar / Penyusun</label>
              <input
                id="input-sim-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Deskripsi &amp; Panduan Eksperimen</label>
              <textarea
                id="textarea-sim-desc"
                rows={3}
                placeholder="Jelaskan tujuan lab, variabel eksperimen, dan petunjuk penggunaan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Tag (Dipisah Koma)</label>
              <input
                id="input-sim-tags"
                type="text"
                placeholder="Fisika, Mekanika, Gelombang"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Status Switch */}
            <div className="space-y-1 flex flex-col justify-end">
              <label className="text-xs font-semibold text-slate-300">Status Publikasi</label>
              <div
                onClick={() => setIsPublished(!isPublished)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                  isPublished ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-amber-950/60 border-amber-800 text-amber-300'
                }`}
              >
                <span className="text-xs font-semibold">
                  {isPublished ? 'Dipublikasikan (Akses Publik)' : 'Simpan sebagai Konsep (Draft)'}
                </span>
                <div className={`w-4 h-4 rounded-full border border-current flex items-center justify-center ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              id="btn-cancel-upload"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>

            <button
              id="btn-submit-upload"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : editingSimulator ? 'Simpan Perubahan' : 'Terbitkan Simulator'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

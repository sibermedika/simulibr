import React from 'react';
import { Category, Simulator } from '../types';
import { Eye, Code, Edit2, Trash2, CheckCircle2, FileText, Play, User, Calendar, Tag, Building2 } from 'lucide-react';

interface SimulatorCardProps {
  simulator: Simulator;
  category?: Category;
  canEdit: boolean;
  onSelect: (sim: Simulator) => void;
  onViewCode: (sim: Simulator) => void;
  onEdit: (sim: Simulator) => void;
  onDelete: (sim: Simulator) => void;
  onTogglePublish: (sim: Simulator) => void;
}

const colorBadgeMap: Record<string, string> = {
  amber: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
  cyan: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
  emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
  purple: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
  blue: 'bg-blue-950/80 text-blue-300 border-blue-800/60'
};

export const SimulatorCard: React.FC<SimulatorCardProps> = ({
  simulator,
  category,
  canEdit,
  onSelect,
  onViewCode,
  onEdit,
  onDelete,
  onTogglePublish,
}) => {
  const badgeStyle = colorBadgeMap[category?.color || 'blue'] || colorBadgeMap.blue;

  return (
    <div
      id={`sim-card-${simulator.id}`}
      className="group relative bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-sky-950/20 hover:-translate-y-1"
    >
      {/* Top Header & Status */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          {/* Category & Cluster Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
              {category?.name || 'Simulator'}
            </span>
            {simulator.clusterName && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/80 flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5 text-purple-400" />
                <span>{simulator.clusterName}</span>
              </span>
            )}
          </div>

          {/* Published vs Draft Status Badge */}
          {canEdit && (
            <button
              id={`btn-toggle-publish-${simulator.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePublish(simulator);
              }}
              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-opacity hover:opacity-80 ${
                simulator.isPublished
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
              title="Klik untuk mengubah status publikasi"
            >
              {simulator.isPublished ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Publik</span>
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Draft</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(simulator)}
          className="font-bold text-slate-100 group-hover:text-sky-400 text-base leading-snug cursor-pointer transition-colors line-clamp-2"
        >
          {simulator.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
          {simulator.description}
        </p>

        {/* Tags */}
        {simulator.tags && simulator.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {simulator.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-slate-950 text-slate-400 border border-slate-800/80 px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                <Tag className="w-2.5 h-2.5 text-slate-500" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-slate-400">
            <User className="w-3 h-3 text-slate-500" />
            {simulator.author || 'Educator'}
          </span>

          <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
            <Eye className="w-3 h-3 text-sky-400" />
            <span>{simulator.viewsCount} x</span>
          </span>
        </div>

        {/* Button Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            id={`btn-launch-sim-${simulator.id}`}
            onClick={() => onSelect(simulator)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Jalankan Simulator</span>
          </button>

          <button
            id={`btn-code-sim-${simulator.id}`}
            onClick={() => onViewCode(simulator)}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-lg transition-colors"
            title="Lihat Kode HTML/JS"
          >
            <Code className="w-4 h-4" />
          </button>

          {canEdit && (
            <>
              <button
                id={`btn-edit-sim-${simulator.id}`}
                onClick={() => onEdit(simulator)}
                className="p-2 text-slate-400 hover:text-amber-300 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-lg transition-colors"
                title="Edit Simulator"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                id={`btn-delete-sim-${simulator.id}`}
                onClick={() => onDelete(simulator)}
                className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-lg transition-colors"
                title="Hapus Simulator"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

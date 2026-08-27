import React, { useState, useRef } from 'react';
import { Category, Simulator } from '../types';
import { ArrowLeft, RotateCcw, Code, Download, Maximize2, Monitor, Tablet, Smartphone, Shield, Eye, Sparkles } from 'lucide-react';

interface SimulatorViewerProps {
  simulator: Simulator;
  category?: Category;
  onBack: () => void;
  onViewCode: (sim: Simulator) => void;
}

export const SimulatorViewer: React.FC<SimulatorViewerProps> = ({
  simulator,
  category,
  onBack,
  onViewCode,
}) => {
  const [viewport, setViewport] = useState<'responsive' | 'tablet' | 'mobile'>('responsive');
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleReload = () => {
    setIframeKey(Date.now());
  };

  const handleDownload = () => {
    const blob = new Blob([simulator.htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${simulator.slug || 'simulator'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  const rawUrl = `/api/simulators/${simulator.id}/raw?t=${iframeKey}`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Top Interactive Stage Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            id="btn-viewer-back"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-100 line-clamp-1">
                {simulator.title}
              </h2>
              {category && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/80">
                  {category.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                Terisolasi dalam Sandbox
              </span>
              <span>•</span>
              <span>Oleh: {simulator.author}</span>
            </div>
          </div>
        </div>

        {/* Center: Viewport Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
          <button
            id="btn-viewport-responsive"
            onClick={() => setViewport('responsive')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded ${
              viewport === 'responsive' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tampilan Penuh (Desktop)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          <button
            id="btn-viewport-tablet"
            onClick={() => setViewport('tablet')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded ${
              viewport === 'tablet' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tampilan Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>

          <button
            id="btn-viewport-mobile"
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded ${
              viewport === 'mobile' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tampilan Ponsel (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Ponsel</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            id="btn-viewer-reload"
            onClick={handleReload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            title="Muat Ulang Simulasi"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            id="btn-viewer-code"
            onClick={() => onViewCode(simulator)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            title="Inspeksi Kode Sumber HTML"
          >
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Kode Sumber</span>
          </button>

          <button
            id="btn-viewer-download"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            title="Unduh File HTML"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Unduh .HTML</span>
          </button>

          <button
            id="btn-viewer-fullscreen"
            onClick={handleFullscreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
            title="Layar Penuh (Fullscreen)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main iFrame Canvas Area */}
      <div className="flex-1 bg-slate-950 flex justify-center items-center p-2 overflow-auto relative">
        <div
          className={`h-full transition-all duration-300 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl ${
            viewport === 'responsive'
              ? 'w-full'
              : viewport === 'tablet'
              ? 'w-[768px]'
              : 'w-[375px]'
          }`}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={rawUrl}
            title={simulator.title}
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
            className="w-full h-full border-none bg-slate-900"
          />
        </div>
      </div>

    </div>
  );
};

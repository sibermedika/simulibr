import React, { useState } from 'react';
import { Simulator } from '../types';
import { X, Code, Copy, Check, FileText } from 'lucide-react';

interface CodeInspectorModalProps {
  simulator: Simulator | null;
  onClose: () => void;
}

export const CodeInspectorModal: React.FC<CodeInspectorModalProps> = ({
  simulator,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!simulator) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(simulator.htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800/80 text-indigo-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Kode Sumber: {simulator.title}
              </h3>
              <p className="text-xs text-slate-400">Single-file HTML (Embedded CSS &amp; JavaScript)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-code"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>

            <button
              id="btn-close-code-modal"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Body */}
        <div className="p-4 bg-slate-950 flex-1 overflow-auto">
          <pre className="text-xs font-mono text-sky-300 leading-relaxed whitespace-pre-wrap break-all selection:bg-sky-900 selection:text-white">
            {simulator.htmlContent}
          </pre>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { SourceCitation } from '../types/chat';
import { FileText, ChevronDown, ChevronUp, ExternalLink, Percent } from 'lucide-react';

interface SourceViewerProps {
  sources: SourceCitation[];
}

export const SourceViewer: React.FC<SourceViewerProps> = ({ sources }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-800/80">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Retrieved Citations ({sources.length})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {sources.map((source, index) => {
          const isExpanded = expandedIndex === index;
          const scorePercent = Math.round(source.similarityScore * 100);

          return (
            <div
              key={index}
              className="rounded-xl bg-slate-950/60 border border-slate-800/90 overflow-hidden hover:border-slate-700/80 transition-all text-xs"
            >
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-slate-200 truncate">{source.filename}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Chunk #{source.chunkNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                    {scorePercent}% match
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 text-slate-300 text-xs font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
                  {source.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

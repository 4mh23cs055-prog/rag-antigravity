import React from 'react';
import { Cpu } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-4 py-4 px-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 max-w-3xl animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 ring-1 ring-white/20">
        <Cpu className="w-4 h-4 text-white animate-pulse" />
      </div>

      <div className="flex items-center gap-2 py-1.5">
        <span className="text-xs font-medium text-slate-400">Searching Pinecone & Generating answer</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

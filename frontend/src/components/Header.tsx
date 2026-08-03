import React from 'react';
import { useChatContext } from '../context/ChatContext';
import { Sparkles, UploadCloud, RefreshCw, Activity, Terminal } from 'lucide-react';

export const Header: React.FC = () => {
  const { health, refreshHealth, setIsUploadModalOpen, clearChatHistory } = useChatContext();

  const isHealthy = health?.status === 'healthy' || health?.status === 'ok';

  return (
    <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-6 flex items-center justify-between z-10 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {health?.config?.groqModel || 'Groq llama-3.3-70b-versatile'}
          </span>
        </div>

        <button
          onClick={() => refreshHealth()}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Refresh Backend Status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={clearChatHistory}
          className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          Clear Chat
        </button>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Files</span>
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import { useChatContext } from '../context/ChatContext';
import {
  Plus,
  FileText,
  Trash2,
  UploadCloud,
  Database,
  Moon,
  Sun,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    documents,
    clearDocuments,
    setIsUploadModalOpen,
    darkMode,
    toggleDarkMode,
    clearChatHistory,
    health,
  } = useChatContext();

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunksCount || 0), 0);

  return (
    <aside className="w-80 bg-slate-950/90 border-r border-slate-800/80 flex flex-col h-full select-none z-20 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 tracking-wide flex items-center gap-1.5 font-outfit">
              Groq RAG Stack <Sparkles className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
            </h1>
            <p className="text-[11px] text-slate-400">LangChain & Pinecone</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 space-y-2">
        <button
          onClick={clearChatHistory}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-blue-600/20 ring-1 ring-white/20 transition-all transform active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm border border-slate-700/60 transition-all"
        >
          <UploadCloud className="w-4 h-4 text-blue-400" />
          <span>Upload Documents</span>
        </button>
      </div>

      {/* Indexed Knowledge Base Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" /> Knowledge Base
            </span>
            <span className="text-[11px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
              {documents.length} docs ({totalChunks} chunks)
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-slate-400 font-medium">No documents indexed</p>
              <p className="text-[11px] text-slate-500 mt-1">Upload PDF, TXT, MD, HTML files to query your knowledge base.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {documents.map((doc, i) => (
                <div
                  key={doc.documentId || i}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/70 hover:border-slate-700/80 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">{doc.filename}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {doc.chunksCount} chunks • {doc.fileType.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vector DB Management & Footer */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
        {documents.length > 0 && (
          <button
            onClick={clearDocuments}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Vector Index</span>
          </button>
        )}

        {/* Model Status */}
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> LLM Model
            </span>
            <span className="font-mono text-blue-400 font-semibold truncate max-w-[120px]">
              {health?.config?.groqModel || 'llama-3.3-70b'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Embedding
            </span>
            <span className="font-mono text-indigo-400 text-[10px] truncate max-w-[120px]">
              bge-small-en
            </span>
          </div>
        </div>

        {/* Theme & Health Footer */}
        <div className="flex items-center justify-between pt-1 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pinecone DB</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      </div>
    </aside>
  );
};

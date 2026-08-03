import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types/chat';
import { SourceViewer } from './SourceViewer';
import { User, Cpu, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex items-start gap-4 py-5 px-4 md:px-6 rounded-2xl transition-all animate-fade-in ${
        isUser
          ? 'bg-slate-800/40 border border-slate-700/40 ml-auto max-w-2xl'
          : 'bg-slate-900/80 border border-slate-800/80 w-full'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ring-1 ring-white/10 ${
          isUser
            ? 'bg-gradient-to-tr from-slate-700 to-slate-600 text-slate-200'
            : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-blue-500/20'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              {isUser ? 'You' : 'Groq Assistant'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{message.timestamp}</span>
          </div>

          {!isUser && message.content && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Copy Answer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {isLast && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Regenerate Response"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Message Text / Markdown */}
        <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed">
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          ) : message.isStreaming ? (
            <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />
          ) : null}
        </div>

        {/* Error Flag */}
        {message.isError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-400 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Response failed. Check backend console log and API keys.</span>
          </div>
        )}

        {/* Source Citations */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceViewer sources={message.sources} />
        )}
      </div>
    </div>
  );
};

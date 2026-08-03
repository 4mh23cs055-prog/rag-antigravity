import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useChatContext } from '../context/ChatContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { ChatMessage } from '../components/ChatMessage';
import { TypingIndicator } from '../components/TypingIndicator';
import { SuggestedQuestions } from '../components/SuggestedQuestions';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { ToastContainer } from '../components/Toast';
import { Send, Square, Sparkles, UploadCloud, Bot } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { messages, isLoading, sendMessage, stopGeneration, regenerateAnswer } = useChat();
  const { documents, setIsUploadModalOpen } = useChatContext();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Layout */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-900/60 relative">
        <Header />

        {/* Messages Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 ring-1 ring-white/20">
                <Bot className="w-9 h-9 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-100 font-outfit tracking-tight">
                  What would you like to know?
                </h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
                  Ask questions about your uploaded PDFs, Markdown, TXT, or HTML files. Powered by Pinecone vector storage & Groq LLM inference.
                </p>
              </div>

              {documents.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto">
                  <UploadCloud className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-80" />
                  <h3 className="text-sm font-semibold text-slate-200">No documents indexed yet</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Upload your documents to unlock Retrieval-Augmented Generation responses.
                  </p>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
                  >
                    Upload Documents Now
                  </button>
                </div>
              ) : (
                <SuggestedQuestions onSelect={(q) => sendMessage(q)} />
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id || index}
                  message={msg}
                  isLast={index === messages.length - 1}
                  onRegenerate={regenerateAnswer}
                />
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <TypingIndicator />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Bar */}
        <div className="p-4 md:p-6 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl shadow-xl focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  documents.length === 0
                    ? 'Upload documents to query your knowledge base...'
                    : 'Ask any question based on your uploaded documents...'
                }
                rows={1}
                className="w-full bg-transparent py-3.5 pl-4 pr-24 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none max-h-32 min-h-[48px]"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md shadow-rose-600/20"
                    title="Stop Generation"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all shadow-md shadow-blue-600/20"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-500 mt-2 font-mono">
              Strict RAG pipeline • Groq LLM answers exclusively from retrieved vector context.
            </p>
          </form>
        </div>
      </div>

      {/* Modals & Notifications */}
      <DocumentUploadModal />
      <ToastContainer />
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, IndexedDocument, HealthStatus, ToastNotification } from '../types/chat';
import { checkHealth, clearVectorIndex } from '../services/api';

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  documents: IndexedDocument[];
  addDocuments: (newDocs: IndexedDocument[]) => void;
  clearDocuments: () => Promise<void>;
  health: HealthStatus | null;
  refreshHealth: () => Promise<void>;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  clearChatHistory: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<IndexedDocument[]>(() => {
    const saved = localStorage.getItem('rag_indexed_documents');
    return saved ? JSON.parse(saved) : [];
  });
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem('rag_indexed_documents', JSON.stringify(documents));
  }, [documents]);

  const refreshHealth = async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      console.warn('Backend API health check unreachable:', err);
    }
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addDocuments = (newDocs: IndexedDocument[]) => {
    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const clearDocuments = async () => {
    try {
      await clearVectorIndex();
      setDocuments([]);
      addToast({
        type: 'success',
        title: 'Index Cleared',
        message: 'All vector embeddings removed from Pinecone.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Clear Failed',
        message: (error as Error).message,
      });
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const clearChatHistory = () => {
    setMessages([]);
    addToast({
      type: 'info',
      title: 'Chat Reset',
      message: 'Conversation history cleared.',
    });
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        documents,
        addDocuments,
        clearDocuments,
        health,
        refreshHealth,
        isUploadModalOpen,
        setIsUploadModalOpen,
        toasts,
        addToast,
        removeToast,
        darkMode,
        toggleDarkMode,
        clearChatHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

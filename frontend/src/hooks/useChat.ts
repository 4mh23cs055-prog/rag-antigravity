import { useState, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import { Message, SourceCitation } from '../types/chat';
import { streamChatMessage } from '../services/api';

export function useChat() {
  const { messages, setMessages, addToast } = useChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantId = (Date.now() + 1).toString();
    const initialAssistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    const updatedHistory = [...messages, userMessage];
    setMessages([...updatedHistory, initialAssistantMessage]);
    setIsLoading(true);

    const historyPayload = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    abortControllerRef.current = new AbortController();

    try {
      await streamChatMessage(
        userText.trim(),
        historyPayload,
        (sources: SourceCitation[]) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantId ? { ...msg, sources } : msg))
          );
        },
        (chunkText: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + chunkText }
                : msg
            )
          );
        },
        abortControllerRef.current.signal
      );

      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantId ? { ...msg, isStreaming: false } : msg))
      );
    } catch (error: any) {
      if (error.name === 'AbortError') {
        addToast({
          type: 'info',
          title: 'Stopped',
          message: 'Generation was cancelled by user.',
        });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: msg.content + ' [Generation stopped]', isStreaming: false }
              : msg
          )
        );
      } else {
        addToast({
          type: 'error',
          title: 'Chat Error',
          message: error.message || 'Failed to receive RAG stream.',
        });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: 'Error generating answer. Please ensure backend server and API keys are running properly.',
                  isError: true,
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const regenerateAnswer = () => {
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex !== -1) {
      const realIndex = messages.length - 1 - lastUserIndex;
      const lastUserMsg = messages[realIndex];
      // remove messages after last user message
      setMessages((prev) => prev.slice(0, realIndex));
      sendMessage(lastUserMsg.content);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    stopGeneration,
    regenerateAnswer,
  };
}

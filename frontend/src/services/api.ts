import axios from 'axios';
import { HealthStatus, SourceCitation } from '../types/chat';

const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function checkHealth(): Promise<HealthStatus> {
  const response = await apiClient.get<HealthStatus>('/health');
  return response.data;
}

export async function uploadDocuments(
  files: File[],
  onProgress?: (progress: number) => void
) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('documents', file);
  });

  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.(percentCompleted);
      }
    },
  });

  return response.data;
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const response = await apiClient.post('/chat', {
    message,
    history,
  });
  return response.data;
}

export async function streamChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  onMetadata: (sources: SourceCitation[]) => void,
  onChunk: (chunkText: string) => void,
  signal?: AbortSignal
) {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP error ${response.status}: ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('ReadableStream not supported on response body.');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line.trim());
        if (parsed.type === 'metadata') {
          onMetadata(parsed.sources || []);
        } else if (parsed.type === 'chunk') {
          onChunk(parsed.text || '');
        }
      } catch (e) {
        onChunk(line);
      }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer.trim());
      if (parsed.type === 'chunk') onChunk(parsed.text || '');
    } catch {
      onChunk(buffer);
    }
  }
}

export async function clearVectorIndex() {
  const response = await apiClient.delete('/documents');
  return response.data;
}

export interface SourceCitation {
  filename: string;
  chunkNumber: number;
  similarityScore: number;
  text: string;
  documentId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  timestamp: string;
  isStreaming?: boolean;
  isError?: boolean;
  latencyMs?: number;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IndexedDocument {
  documentId: string;
  filename: string;
  fileType: string;
  chunksCount: number;
  indexedAt: string;
  status: 'indexed' | 'failed';
  error?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  services: {
    express: 'healthy';
    groq: 'healthy' | 'connected' | 'not_configured' | 'unhealthy';
    pinecone: 'healthy' | 'connected' | 'not_configured' | 'unhealthy';
  };
  config: {
    groqModel: string;
    embeddingModel: string;
    pineconeIndex: string;
    pineconeNamespace: string;
  };
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

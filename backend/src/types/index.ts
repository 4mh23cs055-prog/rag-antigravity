import { Document } from '@langchain/core/documents';

export interface DocumentChunkMetadata {
  documentId: string;
  filename: string;
  fileType: string;
  chunkIndex: number;
  totalChunks: number;
  uploadTimestamp: string;
  sourceUrl?: string;
  [key: string]: any;
}

export interface SourceCitation {
  filename: string;
  chunkNumber: number;
  similarityScore: number;
  text: string;
  documentId: string;
}

export interface ChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  namespace?: string;
  documentIds?: string[];
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  metrics: {
    latencyMs: number;
    tokensUsed?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export interface ProcessedDocument {
  documentId: string;
  filename: string;
  fileType: string;
  chunksCount: number;
  indexedAt: string;
  status: 'indexed' | 'failed';
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  documents: ProcessedDocument[];
  totalChunksIndexed: number;
  vectorsUploaded?: number;
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

export interface VectorSearchResult {
  document: Document<DocumentChunkMetadata>;
  score: number;
}

export interface VectorStoreAdapter {
  init(): Promise<void>;
  addDocuments(documents: Document<DocumentChunkMetadata>[], vectors: number[][], namespace?: string): Promise<void>;
  similaritySearch(queryVector: number[], k: number, namespace?: string, filter?: Record<string, any>): Promise<VectorSearchResult[]>;
  deleteNamespace(namespace?: string): Promise<void>;
  deleteByDocumentId(documentId: string, namespace?: string): Promise<void>;
}

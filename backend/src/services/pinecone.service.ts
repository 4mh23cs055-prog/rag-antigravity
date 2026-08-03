import { PineconeVectorStore } from '../vectorstore/pinecone.js';
import { Document } from '@langchain/core/documents';
import { DocumentChunkMetadata, VectorSearchResult } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export class PineconeService {
  private vectorStore: PineconeVectorStore;

  constructor() {
    this.vectorStore = new PineconeVectorStore();
  }

  async initialize(): Promise<void> {
    await this.vectorStore.init();
  }

  async storeChunks(
    chunks: Document<DocumentChunkMetadata>[],
    embeddings: number[][],
    namespace?: string
  ): Promise<void> {
    Logger.info(`Indexing ${chunks.length} chunks into Pinecone namespace: ${namespace || 'default'}`);
    await this.vectorStore.addDocuments(chunks, embeddings, namespace);
    Logger.info(`Successfully stored ${chunks.length} vector embeddings.`);
  }

  async searchSimilar(
    queryEmbedding: number[],
    topK: number,
    namespace?: string,
    filter?: Record<string, any>
  ): Promise<VectorSearchResult[]> {
    return await this.vectorStore.similaritySearch(queryEmbedding, topK, namespace, filter);
  }

  async clearIndex(namespace?: string): Promise<void> {
    Logger.info(`Deleting all vectors from namespace: ${namespace || 'default'}`);
    await this.vectorStore.deleteNamespace(namespace);
  }

  async deleteDocument(documentId: string, namespace?: string): Promise<void> {
    Logger.info(`Deleting documentId ${documentId} from namespace: ${namespace || 'default'}`);
    await this.vectorStore.deleteByDocumentId(documentId, namespace);
  }

  isConfigured(): boolean {
    return this.vectorStore.getIsConnected();
  }
}

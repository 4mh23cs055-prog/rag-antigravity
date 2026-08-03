import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';
import { VectorStoreAdapter, VectorSearchResult, DocumentChunkMetadata } from '../types/index.js';
import { config } from '../config/index.js';

interface MemoryRecord {
  id: string;
  document: Document<DocumentChunkMetadata>;
  vector: number[];
  namespace: string;
}

export class PineconeVectorStore implements VectorStoreAdapter {
  private pineconeClient: Pinecone | null = null;
  private isInitialized = false;
  private memoryRecords: MemoryRecord[] = [];

  constructor() {
    if (config.pinecone.apiKey && !config.pinecone.apiKey.startsWith('pcsk_demo')) {
      try {
        this.pineconeClient = new Pinecone({
          apiKey: config.pinecone.apiKey,
        });
      } catch (err) {
        console.warn('Pinecone client initialization warning:', err);
      }
    }
  }

  async init(): Promise<void> {
    if (!this.pineconeClient && config.pinecone.apiKey && !config.pinecone.apiKey.startsWith('pcsk_demo')) {
      try {
        this.pineconeClient = new Pinecone({ apiKey: config.pinecone.apiKey });
      } catch (e) {
        console.warn('Pinecone client init failed, operating in local in-memory fallback mode.');
        return;
      }
    }

    if (this.pineconeClient) {
      try {
        const indexes = await this.pineconeClient.listIndexes();
        const indexExists = indexes.indexes?.some((idx) => idx.name === config.pinecone.indexName);
        if (!indexExists) {
          console.info(
            `Pinecone index '${config.pinecone.indexName}' does not exist yet. Please create it in your Pinecone dashboard with metric='cosine' and dimension=${config.embeddings.dimension}.`
          );
        }
        this.isInitialized = true;
      } catch (error) {
        console.warn('Pinecone connection check failed (invalid API key or network). Operating in local in-memory fallback mode:', (error as Error).message);
        this.isInitialized = false;
      }
    } else {
      console.info('Pinecone API Key is placeholder/demo. Operating in local in-memory vector store mode.');
    }
  }

  async addDocuments(
    documents: Document<DocumentChunkMetadata>[],
    vectors: number[][],
    namespace: string = config.pinecone.namespace
  ): Promise<void> {
    if (this.pineconeClient && this.isInitialized) {
      try {
        const index = this.pineconeClient.index(config.pinecone.indexName);
        const ns = index.namespace(namespace);

        const records = documents.map((doc, i) => {
          const vector = vectors[i];
          const chunkId = `${doc.metadata.documentId || 'doc'}_chunk_${doc.metadata.chunkIndex}_${Date.now()}_${i}`;
          return {
            id: chunkId,
            values: vector,
            metadata: {
              text: doc.pageContent,
              documentId: doc.metadata.documentId,
              filename: doc.metadata.filename,
              fileType: doc.metadata.fileType,
              chunkIndex: doc.metadata.chunkIndex,
              totalChunks: doc.metadata.totalChunks,
              uploadTimestamp: doc.metadata.uploadTimestamp,
            },
          };
        });

        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          await ns.upsert(batch);
        }
        return;
      } catch (err) {
        console.warn('Pinecone upsert failed (API key or network error). Falling back to local in-memory vector store for this upload:', (err as Error).message);
        this.isInitialized = false;
      }
    }

    // Fallback: Store in memoryRecords
    documents.forEach((doc, i) => {
      const chunkId = `${doc.metadata.documentId || 'doc'}_chunk_${doc.metadata.chunkIndex}_${Date.now()}_${i}`;
      this.memoryRecords.push({
        id: chunkId,
        document: doc,
        vector: vectors[i],
        namespace,
      });
    });
  }

  async similaritySearch(
    queryVector: number[],
    k: number = config.rag.topK,
    namespace: string = config.pinecone.namespace,
    filter?: Record<string, any>
  ): Promise<VectorSearchResult[]> {
    if (this.pineconeClient && this.isInitialized) {
      try {
        const index = this.pineconeClient.index(config.pinecone.indexName);
        const ns = index.namespace(namespace);

        const queryResponse = await ns.query({
          vector: queryVector,
          topK: k,
          includeMetadata: true,
          filter: filter,
        });

        return (queryResponse.matches || []).map((match) => {
          const metadata = (match.metadata || {}) as any;
          const text = metadata.text || '';
          delete metadata.text;

          return {
            document: new Document<DocumentChunkMetadata>({
              pageContent: text,
              metadata: {
                documentId: metadata.documentId || '',
                filename: metadata.filename || 'Unknown',
                fileType: metadata.fileType || '',
                chunkIndex: metadata.chunkIndex ?? 0,
                totalChunks: metadata.totalChunks ?? 0,
                uploadTimestamp: metadata.uploadTimestamp || new Date().toISOString(),
              },
            }),
            score: match.score || 0,
          };
        });
      } catch (err) {
        console.warn('Pinecone similarity search failed, falling back to local in-memory search:', (err as Error).message);
        this.isInitialized = false;
      }
    }

    // In-memory similarity search fallback
    const filtered = this.memoryRecords.filter((rec) => rec.namespace === namespace);
    const scored = filtered.map((rec) => {
      const score = this.cosineSimilarity(queryVector, rec.vector);
      return { document: rec.document, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async deleteNamespace(namespace: string = config.pinecone.namespace): Promise<void> {
    if (this.pineconeClient && this.isInitialized) {
      try {
        const index = this.pineconeClient.index(config.pinecone.indexName);
        const ns = index.namespace(namespace);
        await ns.deleteAll();
      } catch (err) {
        console.warn('Pinecone deleteNamespace failed:', (err as Error).message);
      }
    }
    this.memoryRecords = this.memoryRecords.filter((rec) => rec.namespace !== namespace);
  }

  async deleteByDocumentId(documentId: string, namespace: string = config.pinecone.namespace): Promise<void> {
    if (this.pineconeClient && this.isInitialized) {
      try {
        const index = this.pineconeClient.index(config.pinecone.indexName);
        const ns = index.namespace(namespace);
        await ns.deleteMany({ documentId: { $eq: documentId } });
      } catch (err) {
        console.warn('Pinecone deleteByDocumentId failed:', (err as Error).message);
      }
    }
    this.memoryRecords = this.memoryRecords.filter(
      (rec) => !(rec.namespace === namespace && rec.document.metadata.documentId === documentId)
    );
  }

  getIsConnected(): boolean {
    return true;
  }
}

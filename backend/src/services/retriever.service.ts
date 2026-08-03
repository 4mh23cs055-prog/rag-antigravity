import { EmbeddingService } from './embedding.service.js';
import { PineconeService } from './pinecone.service.js';
import { SourceCitation } from '../types/index.js';
import { config } from '../config/index.js';
import { Logger } from '../utils/logger.js';

export interface RetrievalResult {
  contextText: string;
  sources: SourceCitation[];
  hasRelevantContext: boolean;
}

export class RetrieverService {
  constructor(
    private embeddingService: EmbeddingService,
    private pineconeService: PineconeService
  ) {}

  async retrieveRelevantContext(
    query: string,
    namespace?: string,
    topK: number = config.rag.topK
  ): Promise<RetrievalResult> {
    const targetNs = (namespace && namespace.trim() !== '') ? namespace.trim() : (config.pinecone.namespace || 'default-namespace');
    
    Logger.info(`Embedding search query for retrieval: "${query.substring(0, 60)}..."`);
    const queryEmbedding = await this.embeddingService.embedQuery(query);

    Logger.info(`Searching vector DB (Index: ${config.pinecone.indexName}, Namespace: ${targetNs}) with topK=${topK}...`);
    const searchResults = await this.pineconeService.searchSimilar(
      queryEmbedding,
      topK,
      targetNs
    );

    if (!searchResults || searchResults.length === 0) {
      Logger.warn(`No vector matches found in index '${config.pinecone.indexName}' (namespace '${targetNs}'). Please ensure documents are uploaded.`);
      return {
        contextText: '',
        sources: [],
        hasRelevantContext: false,
      };
    }

    const maxScore = Math.max(...searchResults.map((r) => r.score || 0));
    Logger.info(`✓ Found ${searchResults.length} vector matches (highest similarity score: ${maxScore.toFixed(3)})`);

    const filteredResults = searchResults.filter(
      (res) => (res.score || 0) >= config.rag.similarityThreshold
    );

    const targetResults = filteredResults.length > 0 ? filteredResults : searchResults;

    const sources: SourceCitation[] = targetResults.map((res) => {
      const meta = res.document.metadata;
      return {
        filename: meta.filename || 'Document',
        chunkNumber: meta.chunkIndex || 1,
        similarityScore: Math.round((res.score || 0) * 100) / 100,
        text: res.document.pageContent,
        documentId: meta.documentId || '',
      };
    });

    const contextText = targetResults
      .map(
        (res, idx) =>
          `[Source ${idx + 1}: ${res.document.metadata.filename} - Chunk ${res.document.metadata.chunkIndex}]\n${res.document.pageContent}`
      )
      .join('\n\n---\n\n');

    return {
      contextText,
      sources,
      hasRelevantContext: targetResults.length > 0,
    };
  }
}

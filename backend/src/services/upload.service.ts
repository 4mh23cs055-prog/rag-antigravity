import { v4 as uuidv4 } from 'uuid';
import { DocumentLoader } from '../loaders/document.loader.js';
import { TextSplitterUtil } from '../utils/textSplitter.js';
import { EmbeddingService } from './embedding.service.js';
import { PineconeService } from './pinecone.service.js';
import { ProcessedDocument, UploadResponse } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { MetricsTracker } from '../utils/metrics.js';
import { config } from '../config/index.js';

export class UploadService {
  private loader: DocumentLoader;
  private textSplitter: TextSplitterUtil;

  constructor(
    private embeddingService: EmbeddingService,
    private pineconeService: PineconeService
  ) {
    this.loader = new DocumentLoader();
    this.textSplitter = new TextSplitterUtil();
  }

  async processAndIndexFiles(
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
    namespace: string = config.pinecone.namespace
  ): Promise<UploadResponse> {
    const processedDocs: ProcessedDocument[] = [];
    let grandTotalChunks = 0;
    let grandTotalVectors = 0;

    for (const file of files) {
      const documentId = uuidv4();
      try {
        Logger.info(`====================================================`);
        Logger.info(`✓ Uploaded ${file.originalname} (${file.buffer.length} bytes)`);

        // 1. Load document & extract text
        const loadResult = await this.loader.loadFromBuffer(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        if (loadResult.textLength === 0) {
          throw new Error('PDF contains no extractable text. It may be a scanned image.');
        }

        Logger.info(`✓ Text length: ${loadResult.textLength}`);
        Logger.info(`✓ First 500 chars: ${JSON.stringify(loadResult.preview)}`);
        Logger.info(`✓ Documents loaded: 1`);

        // 2. Split document into chunks
        const chunks = await this.textSplitter.splitDocument(loadResult.document, documentId);
        Logger.info(`✓ Chunks created: ${chunks.length}`);

        if (chunks.length === 0) {
          throw new Error('No chunks were generated from the document.');
        }

        // 3. Generate embeddings
        const chunkTexts = chunks.map((c) => c.pageContent);
        Logger.info(`Generating embeddings for ${chunks.length} chunk(s)...`);
        const embeddings = await this.embeddingService.embedDocuments(chunkTexts);
        Logger.info(`✓ Embeddings generated: ${embeddings.length}`);

        if (embeddings.length === 0) {
          throw new Error('Failed to generate vector embeddings for document chunks.');
        }

        // 4. Store in Pinecone Vector DB
        Logger.info(`✓ Pinecone Index: ${config.pinecone.indexName}`);
        Logger.info(`✓ Pinecone Namespace: ${namespace}`);
        await this.pineconeService.storeChunks(chunks, embeddings, namespace);
        Logger.info(`✓ Uploaded to Pinecone: ${chunks.length} vectors`);
        Logger.info(`====================================================`);

        grandTotalChunks += chunks.length;
        grandTotalVectors += embeddings.length;
        MetricsTracker.recordDocumentUpload(chunks.length);

        processedDocs.push({
          documentId,
          filename: file.originalname,
          fileType: loadResult.document.metadata.fileType || 'txt',
          chunksCount: chunks.length,
          indexedAt: new Date().toISOString(),
          status: 'indexed',
        });
      } catch (error) {
        const errorMsg = (error as Error).message || String(error);
        Logger.error(`✗ Failed to process ${file.originalname}: ${errorMsg}`);

        processedDocs.push({
          documentId,
          filename: file.originalname,
          fileType: file.originalname.split('.').pop() || 'unknown',
          chunksCount: 0,
          indexedAt: new Date().toISOString(),
          status: 'failed',
          error: errorMsg,
        });
      }
    }

    const successDocs = processedDocs.filter((d) => d.status === 'indexed');
    const successCount = successDocs.length;

    if (successCount === 0) {
      const firstError = processedDocs[0]?.error || 'Document indexing failed.';
      return {
        success: false,
        message: firstError,
        documents: processedDocs,
        totalChunksIndexed: 0,
        vectorsUploaded: 0,
      };
    }

    const docUnit = successCount === 1 ? 'document' : 'documents';
    const message = `Successfully indexed ${successCount} ${docUnit}\nTotal chunks: ${grandTotalChunks}\nVectors uploaded: ${grandTotalVectors}`;

    return {
      success: true,
      message,
      documents: processedDocs,
      totalChunksIndexed: grandTotalChunks,
      vectorsUploaded: grandTotalVectors,
    };
  }
}

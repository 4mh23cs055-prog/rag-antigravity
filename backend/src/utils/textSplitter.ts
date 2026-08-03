import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { config } from '../config/index.js';
import { DocumentChunkMetadata } from '../types/index.js';

export class TextSplitterUtil {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(
    chunkSize: number = config.rag.chunkSize,
    chunkOverlap: number = config.rag.chunkOverlap
  ) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', ' ', ''],
    });
  }

  async splitDocument(
    document: Document,
    documentId: string
  ): Promise<Document<DocumentChunkMetadata>[]> {
    const rawChunks = await this.splitter.splitDocuments([document]);
    const totalChunks = rawChunks.length;

    return rawChunks.map((chunk, index) => {
      return new Document<DocumentChunkMetadata>({
        pageContent: chunk.pageContent,
        metadata: {
          ...document.metadata,
          documentId,
          filename: document.metadata.filename || 'uploaded_document',
          fileType: document.metadata.fileType || 'txt',
          chunkIndex: index + 1,
          totalChunks,
          uploadTimestamp: document.metadata.uploadTimestamp || new Date().toISOString(),
        },
      });
    });
  }
}

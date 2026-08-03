import pdfParse from 'pdf-parse';
import * as cheerio from 'cheerio';
import { Document } from '@langchain/core/documents';

export interface DocumentLoadResult {
  document: Document;
  extractedText: string;
  textLength: number;
  preview: string;
}

export class DocumentLoader {
  /**
   * Parses buffer or text input according to file extension or mime type.
   */
  async loadFromBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<DocumentLoadResult> {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    let extractedText = '';

    if (ext === 'pdf' || mimeType === 'application/pdf') {
      extractedText = await this.parsePdf(buffer);
    } else if (ext === 'html' || ext === 'htm' || mimeType === 'text/html') {
      extractedText = this.parseHtml(buffer.toString('utf-8'));
    } else if (ext === 'md' || ext === 'markdown') {
      extractedText = this.parseMarkdown(buffer.toString('utf-8'));
    } else if (ext === 'docx') {
      extractedText = await this.parseDocx(buffer);
    } else {
      // Default to plain text
      extractedText = buffer.toString('utf-8');
    }

    // Clean whitespace
    const cleanedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleanedText || cleanedText.length === 0) {
      throw new Error('PDF contains no extractable text. It may be a scanned image.');
    }

    const preview = cleanedText.slice(0, 500);

    const doc = new Document({
      pageContent: cleanedText,
      metadata: {
        filename,
        fileType: ext || 'txt',
        fileSizeBytes: buffer.length,
        uploadTimestamp: new Date().toISOString(),
      },
    });

    return {
      document: doc,
      extractedText: cleanedText,
      textLength: cleanedText.length,
      preview,
    };
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const parseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any)?.default;
      if (typeof parseFn !== 'function') {
        throw new Error('pdf-parse module is not executable function');
      }
      const data = await parseFn(buffer);
      return data?.text || '';
    } catch (error) {
      const errorMsg = (error as Error).message || String(error);
      if (errorMsg.includes('no extractable text')) {
        throw error;
      }
      throw new Error(`PDF Parsing Error: ${errorMsg}`);
    }
  }

  private parseHtml(htmlContent: string): string {
    try {
      const $ = cheerio.load(htmlContent);
      $('script, style, noscript, iframe, svg, nav, footer, header').remove();
      const text = $('body').text() || $.text();
      return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      throw new Error(`HTML Parsing Error: ${(error as Error).message}`);
    }
  }

  private parseMarkdown(mdContent: string): string {
    return mdContent.trim();
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    const rawStr = buffer.toString('binary');
    const matches = rawStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (matches && matches.length > 0) {
      return matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
    }
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
  }
}

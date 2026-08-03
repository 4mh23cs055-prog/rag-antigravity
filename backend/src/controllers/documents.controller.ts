import { Request, Response, NextFunction } from 'express';
import { PineconeService } from '../services/pinecone.service.js';

export class DocumentsController {
  constructor(private pineconeService: PineconeService) {}

  deleteDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const namespace = (req.query.namespace as string) || (req.body.namespace as string);
      const documentId = req.query.documentId as string;

      if (documentId) {
        await this.pineconeService.deleteDocument(documentId, namespace);
        res.status(200).json({
          success: true,
          message: `Successfully deleted document vectors for documentId: ${documentId}`,
        });
        return;
      }

      await this.pineconeService.clearIndex(namespace);
      res.status(200).json({
        success: true,
        message: `Successfully cleared vector database namespace: ${namespace || 'default'}`,
      });
    } catch (error) {
      next(error);
    }
  };
}

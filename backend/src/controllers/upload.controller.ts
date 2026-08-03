import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service.js';

export class UploadController {
  constructor(private uploadService: UploadService) {}

  uploadDocuments = async (req: Request, res: Response, NextFunction: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      const namespace = (req.body.namespace as string) || undefined;

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No documents attached to request. Please upload at least one file.',
          documents: [],
          totalChunksIndexed: 0,
          vectorsUploaded: 0,
        });
        return;
      }

      const filePayloads = files.map((file) => ({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      }));

      const result = await this.uploadService.processAndIndexFiles(filePayloads, namespace);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      NextFunction(error);
    }
  };
}

import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller.js';
import { uploadMiddleware } from '../middleware/upload.js';

export function createUploadRouter(uploadController: UploadController): Router {
  const router = Router();
  router.post('/upload', uploadMiddleware.array('documents', 10), uploadController.uploadDocuments);
  return router;
}

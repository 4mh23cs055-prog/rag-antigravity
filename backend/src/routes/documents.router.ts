import { Router } from 'express';
import { DocumentsController } from '../controllers/documents.controller.js';

export function createDocumentsRouter(documentsController: DocumentsController): Router {
  const router = Router();
  router.delete('/documents', documentsController.deleteDocuments);
  return router;
}

import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Services
import { EmbeddingService } from './services/embedding.service.js';
import { PineconeService } from './services/pinecone.service.js';
import { RetrieverService } from './services/retriever.service.js';
import { UploadService } from './services/upload.service.js';
import { ChatService } from './services/chat.service.js';

// Controllers
import { UploadController } from './controllers/upload.controller.js';
import { ChatController } from './controllers/chat.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { DocumentsController } from './controllers/documents.controller.js';

// Routes
import { createUploadRouter } from './routes/upload.router.js';
import { createChatRouter } from './routes/chat.router.js';
import { createHealthRouter } from './routes/health.router.js';
import { createDocumentsRouter } from './routes/documents.router.js';

export function createApp(): { app: Application; pineconeService: PineconeService } {
  const app: Application = express();

  // CORS Configuration supporting Netlify and local environments
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    config.clientUrl,
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (config.nodeEnv === 'development' || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive CORS fallback for production deployment
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(requestLogger);
  app.use('/api/', apiRateLimiter);

  // Dependency Injection Instantiations
  const embeddingService = new EmbeddingService();
  const pineconeService = new PineconeService();
  const retrieverService = new RetrieverService(embeddingService, pineconeService);
  const uploadService = new UploadService(embeddingService, pineconeService);
  const chatService = new ChatService(retrieverService);

  const uploadController = new UploadController(uploadService);
  const chatController = new ChatController(chatService);
  const healthController = new HealthController(pineconeService);
  const documentsController = new DocumentsController(pineconeService);

  // Direct Render health check endpoint (/health)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'rag-backend',
      environment: config.nodeEnv,
      pineconeConnected: pineconeService.isConfigured(),
    });
  });

  // Register API Router Modules
  app.use('/api', createUploadRouter(uploadController));
  app.use('/api', createChatRouter(chatController));
  app.use('/api', createHealthRouter(healthController));
  app.use('/api', createDocumentsRouter(documentsController));

  // Serve frontend build static files if present
  const frontendDistPath = path.resolve(process.cwd(), '../frontend/dist');
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.json({ message: 'RAG Pipeline Backend API is active', health: '/health', docs: '/api/health' });
    });
  }

  // Global Error Handler
  app.use(errorHandler);

  return { app, pineconeService };
}

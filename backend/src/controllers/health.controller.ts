import { Request, Response } from 'express';
import { PineconeService } from '../services/pinecone.service.js';
import { config } from '../config/index.js';
import { HealthStatus } from '../types/index.js';
import { MetricsTracker } from '../utils/metrics.js';

export class HealthController {
  constructor(private pineconeService: PineconeService) {}

  getHealth = async (_req: Request, res: Response): Promise<void> => {
    const isPineconeConnected = this.pineconeService.isConfigured();
    const isGroqConfigured = Boolean(config.groq.apiKey && config.groq.apiKey.trim() !== '');

    const isAllHealthy = isPineconeConnected && isGroqConfigured;

    const healthStatus: HealthStatus = {
      status: isAllHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: MetricsTracker.getUptimeSeconds(),
      services: {
        express: 'healthy',
        groq: isGroqConfigured ? 'healthy' : 'not_configured',
        pinecone: isPineconeConnected ? 'healthy' : 'not_configured',
      },
      config: {
        groqModel: config.groq.model,
        embeddingModel: config.embeddings.modelName,
        pineconeIndex: config.pinecone.indexName,
        pineconeNamespace: config.pinecone.namespace,
      },
    };

    const httpCode = isAllHealthy ? 200 : 200;
    res.status(httpCode).json(healthStatus);
  };
}

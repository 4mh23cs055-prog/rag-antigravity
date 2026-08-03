import { validateEnv, config } from './config/index.js';
import { Logger } from './utils/logger.js';

// 1. Run centralized environment validation before importing services or starting Express
const { isValid, missingVars } = validateEnv();

if (!isValid) {
  Logger.warn(`Environment check warning: Missing variable(s) [${missingVars.join(', ')}]. Operating with defaults or degraded service.`);
}

// 2. Import app factory after env validation is complete
import { createApp } from './app.js';

async function startServer() {
  try {
    const { app, pineconeService } = createApp();

    Logger.info('Initializing Pinecone Vector Database Service...');
    await pineconeService.initialize();

    app.listen(config.port, () => {
      Logger.info(`====================================================`);
      Logger.info(`🚀 Production RAG Server is running on port ${config.port}`);
      Logger.info(`   Environment: ${config.nodeEnv}`);
      Logger.info(`   Groq LLM Model: ${config.groq.model}`);
      Logger.info(`   Embedding Model: ${config.embeddings.modelName}`);
      Logger.info(`   Pinecone Index: ${config.pinecone.indexName}`);
      Logger.info(`   Health endpoint: http://localhost:${config.port}/api/health`);
      Logger.info(`====================================================`);
    });
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

import { RetrieverService } from './retriever.service.js';
import { RAGChainManager } from '../langchain/chains.js';
import { MemoryManager } from '../langchain/memory.js';
import { ChatRequest, ChatResponse } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { MetricsTracker } from '../utils/metrics.js';

export class ChatService {
  private chainManager: RAGChainManager;

  constructor(private retrieverService: RetrieverService) {
    this.chainManager = new RAGChainManager();
  }

  async processChat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    MetricsTracker.recordQuery();

    const { message, history = [], namespace } = request;
    Logger.info(`Incoming chat query: "${message}"`);

    // 1. Setup Conversation Memory
    const memory = new MemoryManager(history);
    const formattedHistory = memory.getFormattedHistory();

    // 2. Retrieve Relevant Context and Citations
    const retrievalResult = await this.retrieverService.retrieveRelevantContext(
      message,
      namespace
    );

    let answer = '';

    // If context is completely missing
    if (!retrievalResult.hasRelevantContext) {
      answer = "I couldn't find this information in the uploaded documents.";
    } else {
      // 3. Execute LCEL Chain
      answer = await this.chainManager.executeChain({
        question: message,
        context: retrievalResult.contextText,
        chat_history: formattedHistory,
      });
    }

    const latencyMs = Date.now() - startTime;
    
    // Estimate token usage (rough approximation: 1 token ~ 4 chars)
    const promptTokens = Math.ceil((message.length + retrievalResult.contextText.length) / 4);
    const completionTokens = Math.ceil(answer.length / 4);

    return {
      answer,
      sources: retrievalResult.sources,
      metrics: {
        latencyMs,
        tokensUsed: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      },
    };
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    MetricsTracker.recordQuery();
    const { message, history = [], namespace } = request;

    const memory = new MemoryManager(history);
    const formattedHistory = memory.getFormattedHistory();

    const retrievalResult = await this.retrieverService.retrieveRelevantContext(
      message,
      namespace
    );

    if (!retrievalResult.hasRelevantContext) {
      yield JSON.stringify({ type: 'metadata', sources: [] });
      yield JSON.stringify({
        type: 'chunk',
        text: "I couldn't find this information in the uploaded documents.",
      });
      return;
    }

    // Send metadata chunk first containing source citations
    yield JSON.stringify({ type: 'metadata', sources: retrievalResult.sources }) + '\n';

    const stream = this.chainManager.streamChain({
      question: message,
      context: retrievalResult.contextText,
      chat_history: formattedHistory,
    });

    for await (const chunk of stream) {
      yield JSON.stringify({ type: 'chunk', text: chunk }) + '\n';
    }
  }
}

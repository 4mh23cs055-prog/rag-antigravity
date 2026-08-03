import { ChatGroq } from '@langchain/groq';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ragPrompt } from './prompts.js';
import { config } from '../config/index.js';
import { Logger } from '../utils/logger.js';

export class RAGChainManager {
  private llm: ChatGroq | null = null;
  private outputParser: StringOutputParser;

  constructor() {
    this.outputParser = new StringOutputParser();
    this.initLLM();
  }

  private initLLM() {
    if (config.groq.apiKey) {
      try {
        this.llm = new ChatGroq({
          apiKey: config.groq.apiKey,
          model: config.groq.model,
          temperature: 0.1,
          maxTokens: 2048,
        });
        Logger.info(`Initialized Groq LLM model: ${config.groq.model}`);
      } catch (err) {
        Logger.warn('Failed to initialize ChatGroq instance:', err);
      }
    } else {
      Logger.warn('GROQ_API_KEY is not set. RAG chain will run in degraded/mock mode.');
    }
  }

  /**
   * Executes LCEL RunnableSequence pipeline.
   */
  async executeChain(inputs: {
    question: string;
    context: string;
    chat_history: string;
  }): Promise<string> {
    if (!this.llm) {
      if (config.groq.apiKey) {
        this.initLLM();
      }
    }

    if (!this.llm) {
      // Fallback if GROQ API key is missing
      if (!inputs.context || inputs.context.trim().length === 0) {
        return "I couldn't find this information in the uploaded documents.";
      }
      return `[Mock Response - Add GROQ_API_KEY to backend/.env to activate live Groq ${config.groq.model} inference]\n\nBased on your documents:\n${inputs.context.substring(0, 300)}...`;
    }

    const chain = RunnableSequence.from([
      ragPrompt,
      this.llm,
      this.outputParser,
    ]);

    const result = await chain.invoke(inputs);
    return result;
  }

  /**
   * Streams response tokens via generator.
   */
  async *streamChain(inputs: {
    question: string;
    context: string;
    chat_history: string;
  }): AsyncGenerator<string, void, unknown> {
    if (!this.llm) {
      const text = await this.executeChain(inputs);
      const words = text.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise((res) => setTimeout(res, 30));
      }
      return;
    }

    const chain = RunnableSequence.from([
      ragPrompt,
      this.llm,
      this.outputParser,
    ]);

    const stream = await chain.stream(inputs);
    for await (const chunk of stream) {
      yield chunk;
    }
  }
}

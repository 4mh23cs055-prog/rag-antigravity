import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// 1. Locate .env file across standard project root locations
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(currentDir, '../../.env'),
  path.resolve(currentDir, '../.env'),
  path.resolve(currentDir, '.env'),
];

let loadedEnvPath: string | null = null;
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    loadedEnvPath = envPath;
    break;
  }
}

// Fallback to .env.example if .env is not found
if (!loadedEnvPath) {
  const candidateExamplePaths = [
    path.resolve(process.cwd(), '.env.example'),
    path.resolve(process.cwd(), 'backend', '.env.example'),
    path.resolve(currentDir, '../../.env.example'),
    path.resolve(currentDir, '../.env.example'),
    path.resolve(currentDir, '.env.example'),
  ];
  for (const examplePath of candidateExamplePaths) {
    if (fs.existsSync(examplePath)) {
      dotenv.config({ path: examplePath });
      loadedEnvPath = examplePath;
      break;
    }
  }
}

// Required environment variables to validate
const REQUIRED_ENV_VARS = [
  'GROQ_API_KEY',
  'GROQ_MODEL',
  'PINECONE_API_KEY',
  'PINECONE_INDEX',
  'PINECONE_NAMESPACE',
  'EMBEDDING_MODEL',
] as const;

/**
 * Validates environment variables on startup and logs status.
 */
export function validateEnv(): { isValid: boolean; missingVars: string[] } {
  console.log('====================================================');
  console.log('🔍 Environment Variables Diagnostic Check:');
  
  const missingVars: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    const val = process.env[key];
    const isLoaded = Boolean(val && val.trim() !== '');
    if (isLoaded) {
      console.log(`  ✓ ${key} loaded`);
    } else {
      console.log(`  ✗ ${key} missing`);
      missingVars.push(key);
    }
  }
  
  if (loadedEnvPath) {
    console.log(`📁 Loaded environment from: ${loadedEnvPath}`);
  } else {
    console.warn(`⚠️ No .env or .env.example file found on disk.`);
  }
  console.log('====================================================');

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

export const config = {
  get port(): number {
    return parseInt(process.env.PORT || '5000', 10);
  },
  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  },
  get clientUrl(): string {
    return process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  },
  groq: {
    get apiKey(): string {
      return process.env.GROQ_API_KEY || '';
    },
    get model(): string {
      return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    },
  },
  pinecone: {
    get apiKey(): string {
      return process.env.PINECONE_API_KEY || '';
    },
    get indexName(): string {
      return process.env.PINECONE_INDEX || 'rag-index';
    },
    get namespace(): string {
      return process.env.PINECONE_NAMESPACE || 'default-namespace';
    },
  },
  embeddings: {
    get modelName(): string {
      return process.env.EMBEDDING_MODEL || 'BAAI/bge-small-en';
    },
    get huggingFaceApiKey(): string {
      return process.env.HUGGINGFACE_API_KEY || '';
    },
    dimension: 384,
  },
  rag: {
    get chunkSize(): number {
      return parseInt(process.env.CHUNK_SIZE || '1000', 10);
    },
    get chunkOverlap(): number {
      return parseInt(process.env.CHUNK_OVERLAP || '200', 10);
    },
    get topK(): number {
      return parseInt(process.env.TOP_K_RESULTS || '4', 10);
    },
    get similarityThreshold(): number {
      return parseFloat(process.env.SIMILARITY_SCORE_THRESHOLD || '0.3');
    },
  },
};

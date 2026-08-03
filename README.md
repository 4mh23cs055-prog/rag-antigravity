# Enterprise Full-Stack Retrieval-Augmented Generation (RAG) System

A production-grade, scalable full-stack RAG application built with Node.js, Express, TypeScript, LangChain (LCEL), Pinecone Vector Database, Groq LLM (`llama-3.3-70b-versatile`), BAAI/bge-small-en embeddings, and a modern React/Vite/TailwindCSS ChatGPT-style interface.

---

## 🌟 Key Features

- **High-Performance Inference**: Powered by **Groq** (`llama-3.3-70b-versatile`) for sub-second LLM generation.
- **State-of-the-Art Vector DB**: Integrated with **Pinecone** for similarity search over vector embeddings.
- **Configurable Embeddings**: Native support for `BAAI/bge-small-en` (384 dimensions) via HuggingFace Inference API & fallback feature extraction.
- **Multi-Format Ingestion**: Process and index **PDF**, **TXT**, **Markdown**, **HTML**, and **DOCX** files.
- **Recursive Character Splitting**: Splitting documents with `chunkSize: 1000` and `chunkOverlap: 200`.
- **Modular Vector Abstraction**: Adapter pattern (`src/vectorstore/vectorstore.interface.ts`) enabling effortless swapping of vector databases.
- **Strict RAG Grounding**: Prompt engineering that prohibits hallucinations (*"I couldn't find this information in the uploaded documents."* when ungrounded).
- **Rich Source Citations**: Each answer displays source filename, chunk number, similarity score %, and expandable context text.
- **Real-Time Streaming**: Server-Sent Events (SSE) streaming with stop generation capability.
- **ChatGPT-Style Frontend**: Dark mode theme, drag & drop uploader with progress tracking, typing animation, markdown rendering, copy answer, regenerate, and toast notifications.

---

## 🏗️ Architecture & Pipeline Flow

```text
Upload Document (PDF/TXT/MD/HTML/DOCX)
       ↓
Extract Raw Text (pdf-parse / cheerio)
       ↓
Split Text (RecursiveCharacterTextSplitter: 1000 / 200)
       ↓
Generate Embeddings (BAAI/bge-small-en: 384d)
       ↓
Store Vectors in Pinecone DB
       ↓
User Questions
       ↓
Embed Query & Similarity Search in Pinecone (Top-K)
       ↓
Pass Context + Question + Conversation History to Groq LLM via LCEL
       ↓
Stream Answer & Return Source Citations (Filename, Chunk #, Score %)
```

---

## 📁 Project Directory Structure

```text
rag-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment parser & validation
│   │   ├── controllers/     # API route controllers (Upload, Chat, Health, Documents)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic services (Embedding, Pinecone, Retriever, Upload, Chat)
│   │   ├── langchain/       # LCEL chains, custom prompts, memory, output parsers
│   │   ├── vectorstore/     # Modular vector database abstraction & Pinecone implementation
│   │   ├── loaders/         # Multi-format document parsing service
│   │   ├── middleware/      # Global error handler, rate limiter, multer, logger
│   │   ├── utils/           # Text splitter, token/latency trackers, logger
│   │   ├── types/           # TypeScript interfaces & types
│   │   ├── app.ts           # Express app initialisation & DI container
│   │   └── server.ts        # Server entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Header, ChatMessage, SourceViewer, UploadModal, etc.
│   │   ├── context/         # React Context for Chat, Documents, Theme, & Notifications
│   │   ├── hooks/           # Custom React hooks (useChat, useUpload)
│   │   ├── services/        # Axios API client & streaming fetch decoder
│   │   ├── styles/          # TailwindCSS styles
│   │   ├── pages/           # ChatPage container
│   │   ├── App.tsx          # App root
│   │   └── main.tsx         # React entrypoint
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 🚀 Environment Setup

### 1. Groq Setup
1. Sign up at [Groq Console](https://console.groq.com/).
2. Create an API Key (`GROQ_API_KEY`).
3. Model default: `llama-3.3-70b-versatile`.

### 2. Pinecone Setup
1. Create a free index on [Pinecone Dashboard](https://app.pinecone.io/).
2. Name your index: `rag-index` (or configure via `PINECONE_INDEX`).
3. Set Metric: `cosine`.
4. Set Dimension: `384` (for `BAAI/bge-small-en`).
5. Copy your Pinecone API key (`PINECONE_API_KEY`).

---

## ⚙️ Configuration (.env)

Create a `.env` file inside `backend/` using `backend/.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Groq LLM
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=rag-index
PINECONE_NAMESPACE=default-namespace

# Embeddings
EMBEDDING_MODEL=BAAI/bge-small-en
HUGGINGFACE_API_KEY=hf_your_huggingface_api_key_optional

# RAG Parameters
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=4
SIMILARITY_SCORE_THRESHOLD=0.3
```

---

## 💻 Running Locally

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
The Express backend server will launch on `http://localhost:5000`.

### Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The React Vite frontend will open at `http://localhost:5173`.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload and index documents (`multipart/form-data`) |
| `POST` | `/api/chat` | Send question and receive JSON answer with sources |
| `POST` | `/api/chat/stream` | Stream LLM response chunks (Server-Sent Events) |
| `GET` | `/api/health` | Diagnostic status of Groq, Pinecone, and server |
| `DELETE` | `/api/documents` | Clear vector database namespace |

---

## 🚢 Deployment Guide

### Backend Deployment (Render / Railway)
1. Push your repository to GitHub.
2. Create a new Web Service on **Render** or **Railway** pointing to the `/backend` root.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Configure Environment Variables (`GROQ_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `EMBEDDING_MODEL`).

### Frontend Deployment (Vercel)
1. Connect your GitHub repository to **Vercel**.
2. Set Framework Preset to **Vite**.
3. Set Root Directory to `frontend`.
4. Configure Environment Variable: `VITE_API_BASE_URL=https://your-backend-service.onrender.com/api`

---

## 🛠️ Troubleshooting

- **Pinecone dimension mismatch**: Ensure your Pinecone index is created with `384` dimensions for `BAAI/bge-small-en`.
- **Groq API key error**: Verify that `GROQ_API_KEY` is set correctly in `backend/.env`.
- **Cors origin restriction**: Update `CLIENT_URL` in `backend/.env` if serving frontend on custom domain.

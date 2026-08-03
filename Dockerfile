FROM node:20-alpine

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build backend and frontend applications
RUN npm run build

# Expose default Hugging Face Space port 7860
EXPOSE 7860

ENV PORT=7860
ENV NODE_ENV=production

# Start unified Express full-stack application
CMD ["npm", "start"]

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy full source code
COPY . .

# Build frontend and backend
RUN npm run build

# Stage 2: Production runtime
FROM node:18-alpine

WORKDIR /app

# Only copy what is needed to run
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Expose port used by Express (assumed to be 3000)
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]

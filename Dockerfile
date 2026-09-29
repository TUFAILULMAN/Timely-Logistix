# Production Multi-Stage Dockerfile for Freight Dispatch & TMS
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for fast layer caching
COPY package*.json ./
RUN npm ci

# Copy full application code and build static assets
COPY . .
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install lightweight HTTP static server
RUN npm install -g serve

# Copy compiled output and metadata
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/sample-company-template.json ./dist/sample-company-template.json

EXPOSE 3000

# Serve application on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

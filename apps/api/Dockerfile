# ============================================================
# Dockerfile for NestJS Backend API (apps/api)
# Multi-stage build for optimal image size & security
# ============================================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma needs OpenSSL to select the correct Alpine query engine.
RUN apk add --no-cache openssl

# Copy dependency definitions and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and build NestJS
COPY . .
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Keep Prisma's runtime query engine compatible with Alpine.
RUN apk add --no-cache openssl

# Copy dependency definitions and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies and re-generate Prisma Client for production runtime
RUN npm ci --omit=dev && npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main"]

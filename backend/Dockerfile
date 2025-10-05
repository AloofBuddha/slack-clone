# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engines on Alpine and configure Prisma to use OpenSSL 3
RUN apk add --no-cache openssl
ENV PRISMA_OPENSSL_LIBRARIES=openssl-3

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma engines on Alpine and configure Prisma to use OpenSSL 3
RUN apk add --no-cache openssl
ENV PRISMA_OPENSSL_LIBRARIES=openssl-3

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# (Optional) copy Prisma schema for runtime db commands
COPY prisma ./prisma/

# Copy generated Prisma client and engines from builder (generated there with dev deps)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Optional: set environment and expose port (Railway sets PORT dynamically)
ENV NODE_ENV=production
EXPOSE 3000

# Create uploads directory
RUN mkdir -p uploads

# Start application
CMD ["npm", "run", "start:prod"]

# ── Stage 1: install deps + build ───────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
COPY src/database/prisma/schema.prisma ./src/database/prisma/schema.prisma
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

# ── Stage 2: production deps only ───────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY src/database/prisma/schema.prisma ./src/database/prisma/schema.prisma
RUN npm ci --omit=dev && npm run prisma:generate

# ── Stage 3: minimal runtime image ──────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user
RUN addgroup -S awms && adduser -S awms -G awms

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/prisma ./src/database/prisma
COPY package*.json ./

USER awms

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/api/v1/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main"]

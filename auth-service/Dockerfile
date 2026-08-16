# ---- Base ----
FROM node:18-alpine AS base
WORKDIR /app

# ---- Dependencies (cached layer) ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Runner ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Don't run as root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001
CMD ["node", "src/index.js"]
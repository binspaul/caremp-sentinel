# ==========================================
# Stage 1: Base & Dependencies
# ==========================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install build tools required for native modules (e.g., bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools again for native module rebuilding / pruning
RUN apk add --no-cache python3 make g++

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Compile TypeScript into dist/
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --omit=dev

# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install dumb-init for proper process signal forwarding (SIGINT/SIGTERM)
RUN apk add --no-cache dumb-init

# Copy production node_modules and compiled output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Use non-privileged user for container security
USER node

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

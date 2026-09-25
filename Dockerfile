# Production image, used by Railway (see railway.json) or any Docker host.
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# The build doesn't touch the real database; a throwaway file keeps Prisma happy.
RUN DATABASE_URL="file:/tmp/build.db" npx prisma generate && DATABASE_URL="file:/tmp/build.db" npm run build

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

# Applies migrations and loads the bundled instruments before every start (both are safe to repeat).
CMD ["npm", "run", "start:production"]

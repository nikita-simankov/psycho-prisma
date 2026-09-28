# Production image, used by Railway (see railway.json) or any Docker host.
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown node:node /app

# Runs as the image's unprivileged user rather than root.
USER node

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node prisma ./prisma
RUN npm ci

COPY --chown=node:node . .

# The build doesn't connect to the database; the placeholder address only has to be valid.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate && DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

# Applies migrations and loads the bundled instruments before every start (both are safe to repeat).
CMD ["npm", "run", "start:production"]

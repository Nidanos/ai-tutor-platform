# The API and its queue workers (one process, src/server.ts). Built from the repo root:
#   docker build -f apps/api/Dockerfile .
# Dev dependencies stay in: migrations (drizzle-kit) and the seed and admin scripts (tsx) run in this image.
FROM node:22-bookworm-slim
WORKDIR /app
# pnpm is fetched once at build time into a shared folder, so `pnpm` works offline as the node user.
ENV COREPACK_HOME=/opt/corepack COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Manifests first, so a code change doesn't reinstall. The lockfile covers the whole workspace, so every
# package's manifest is copied; only the API and what it depends on are installed.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/types/package.json packages/types/
COPY packages/report-pdf/package.json packages/report-pdf/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @ai-tutor/api...

COPY packages/config packages/config
COPY packages/types packages/types
COPY apps/api apps/api
RUN pnpm --filter @ai-tutor/api build && chmod -R a+rX /opt/corepack

ENV NODE_ENV=production
WORKDIR /app/apps/api
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3001) + '/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "dist/server.js"]

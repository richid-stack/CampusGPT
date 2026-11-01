# syntax=docker/dockerfile:1
FROM node:24-slim AS build
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/campus-gpt run build \
 && pnpm --filter @workspace/api-server run build

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080 STATIC_DIR=/app/public
COPY --from=build /app/artifacts/api-server/dist ./dist
COPY --from=build /app/artifacts/campus-gpt/dist/public ./public
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--enable-source-maps", "dist/index.mjs"]

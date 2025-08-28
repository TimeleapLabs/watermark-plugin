FROM oven/bun:1.1.35 AS builder
WORKDIR /build

COPY package.json bun.lock ./

COPY apps/client/package.json ./apps/client/package.json
COPY shared/models/package.json ./shared/models/package.json

RUN bun install

COPY apps/client ./apps/client
COPY shared ./shared

RUN bun --filter '@shared/models' build && bun --filter '@apps/client' build

FROM oven/bun:1.1.35
WORKDIR /project

COPY --from=builder /build/apps/client/dist ./dist
COPY --from=builder /build/apps/client/debug.jpg .

ENTRYPOINT ["bun","run","dist/index.js"]

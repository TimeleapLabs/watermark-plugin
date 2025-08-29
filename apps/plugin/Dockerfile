FROM oven/bun:1.1.35 AS builder
WORKDIR /build

COPY package.json bun.lock ./

COPY apps/plugin/package.json ./apps/plugin/
COPY shared/models/package.json ./shared/models/

RUN bun install

COPY apps/plugin ./apps/plugin
COPY shared/models ./shared/models

RUN bun --filter '@shared/models' build && bun --filter '@apps/plugin' build

FROM oven/bun:1.1.35
WORKDIR /project

COPY --from=builder /build/apps/plugin/dist ./dist
COPY --from=builder /build/package.json .
COPY --from=builder /build/bun.lock .
COPY --from=builder /build/node_modules ./node_modules

RUN bun install --production

EXPOSE 80
ENTRYPOINT ["bun", "run", "dist/index.js"]

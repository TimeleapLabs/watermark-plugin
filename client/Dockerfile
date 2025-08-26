FROM oven/bun:1.1.35 AS builder
WORKDIR /build

COPY . .

RUN bun install
RUN bun --filter '@repo/models' build && bun --filter 'client' build

FROM oven/bun:1.1.35
WORKDIR /app

COPY --from=builder /build/client/dist .
COPY --from=builder /build/client/debug.jpg .

ENTRYPOINT ["bun","run","index.js"]
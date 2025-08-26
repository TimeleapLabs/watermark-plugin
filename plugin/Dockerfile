FROM oven/bun:1.1.35 AS builder
WORKDIR /build

COPY package.json bun.lock ./

COPY client/package.json ./client/package.json
COPY plugin/package.json ./plugin/package.json
COPY models/package.json ./models/package.json

RUN bun install --filter plugin --filter @repo/models

COPY . .

RUN bun --filter @repo/models build && bun --filter plugin build

FROM oven/bun:1.1.35
WORKDIR /app

COPY package.json bun.lock ./

COPY plugin/package.json ./plugin/package.json
COPY models/package.json ./models/package.json
COPY client/package.json ./client/package.json

RUN bun install --production --filter plugin --filter @repo/models

COPY --from=builder /build/plugin/dist .

EXPOSE 80
ENTRYPOINT ["bun", "run", "index.js"]

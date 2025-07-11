FROM oven/bun:1 AS base

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN bun install

COPY . .

EXPOSE 5000

RUN ls

CMD ["bun", "run", "start"]

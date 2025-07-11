FROM oven/bun:latest

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN bun install

COPY . .

# Build TypeScript
RUN bun run build

EXPOSE 5000

CMD ["bun", "run", "start"]

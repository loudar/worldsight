# WorldSight

## Prerequisites

- Docker (you can use [Docker Desktop](https://www.docker.com/products/docker-desktop/) if you want visual info about your containers)
- [bun](https://bun.sh)

## Running the Application

1. Clone the repository:
   ```bash
   git clone https://github.com/loudar/worldsight.git
   cd worldsight
   ```

2. Copy the [.env.example](./backend/.env.example) to `./backend/.env` and fill in the xxx values

Then, choose any of the following options:

### Option 1: Docker Compose

1. Start the application using Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

### Option 2: Run on host

1. Install the dependencies:
   
   ```bash
   cd ./backend
   bun install
   ```
   
   ```bash
   cd ../frontend
   bun install
   ```

2. Run backend + frontend:
   ```bash
   cd ./backend
   bun run dev
   ```
   
   ```bash
   cd ../frontend
   bun run start
   ```

Now, you can access the application in your browser under [http://localhost:3000](http://localhost:3000)

## Seeing location data

`Right click` to show info

## APIs

| Env var         | Where to get                             |
|-----------------|------------------------------------------|
| NEWS_API_KEY    | https://newsapi.org/                     |
| WEATHER_API_KEY | https://home.openweathermap.org/api_keys |
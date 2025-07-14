# WorldSight

## Prerequisites

- Docker (you can use Docker Desktop)

## Running the Application

1. Clone the repository:
   ```
   git clone https://github.com/loudar/worldsight.git
   cd worldsight
   ```

2. Copy the [.env.example](./backend/.env.example) to `./backend/.env` and fill in the xxx values

3. Start the application using Docker Compose:
   ```
   docker-compose up -d --build
   ```

4. Access the application in your browser:
   ```
   http://localhost:3000
   ```

## Seeing location data

`Right click` to show info

## APIs

| Env var         | Where to get                             |
|-----------------|------------------------------------------|
| NEWS_API_KEY    | https://newsapi.org/                     |
| WEATHER_API_KEY | https://home.openweathermap.org/api_keys |
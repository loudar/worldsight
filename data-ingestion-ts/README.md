# Data Ingestion

This is a TypeScript implementation of the data ingestion system for WorldSight, built with Bun.

## Prerequisites

- [Bun](https://bun.sh/) (latest version)
- PostgreSQL database with PostGIS extension

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
bun install
```

4. Create a `.env` file based on the `.env.example` template:

```bash
cp .env.example .env
```

5. Update the `.env` file with your database connection string.

## Usage

### Development

To run the application in development mode with automatic reloading:

```bash
bun dev
```

### Production

To build the application for production:

```bash
bun build
```

To run the application in production mode:

```bash
bun start
```

## How It Works

The application performs the following steps:

1. Generates a grid of geographical points covering the Earth
2. For each point:
   - Fetches climate data from NASA's POWER API
   - Determines the climate type based on temperature and precipitation
   - Fetches additional data about the location
   - Inserts or updates the data in the PostgreSQL database
3. Runs periodically (every 24 hours) to keep the data up to date

## Project Structure

- `src/index.ts` - Main entry point
- `src/gridGenerator.ts` - Grid generation functionality
- `src/climateService.ts` - Climate data fetching and processing
- `src/database.ts` - Database operations
- `src/models/types.ts` - TypeScript interfaces for data structures

## License

MIT
# WorldSight - Interactive Globe Visualization

WorldSight is an interactive 3D globe visualization that displays climate data and geographic information for locations around the world. The application allows users to explore temperature and precipitation data visualized as heat maps on a 3D Earth model.

## Features

- Interactive 3D globe using Three.js
- Climate data visualization with temperature and precipitation layers
- Detailed information about selected locations
- Automatic data ingestion from NASA's POWER API
- PostgreSQL with PostGIS for geospatial data storage

## Architecture

The application consists of four main components:

1. **Frontend**: React application with Three.js for 3D globe rendering
2. **Backend API**: Express.js server providing data endpoints
3. **Database**: PostgreSQL with PostGIS extension for geographic data
4. **Data Ingestion Service**: Python service that fetches climate data from external sources

## Prerequisites

- Docker and Docker Compose

## Running the Application

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/worldsight.git
   cd worldsight
   ```

2. Start the application using Docker Compose:
   ```
   docker-compose up
   ```

3. Access the application in your browser:
   ```
   http://localhost:3000
   ```

## How It Works

- The frontend renders a 3D globe using Three.js with Earth textures
- Climate data is visualized as a heat map layer over the globe
- Users can switch between temperature and precipitation data layers
- Clicking on a location displays detailed information about that place
- The data ingestion service periodically fetches updated climate data from NASA's POWER API
- The backend API provides endpoints for the frontend to access the climate data

## Data Sources

- Earth textures: NASA Blue Marble imagery
- Climate data: NASA POWER API (https://power.larc.nasa.gov/)
- Additional geographic information: Static data (in a production environment, this would be fetched from various APIs)

## Development

### Frontend

The frontend is built with React and Three.js. The main components are:

- `App.js`: Main component that sets up the Three.js scene and renders the globe
- Earth textures are loaded from external URLs

### Backend

The backend is an Express.js server that provides API endpoints:

- `/api/climate-data`: Returns climate data for all locations
- `/api/locations/:id`: Returns detailed information about a specific location
- `/api/health`: Health check endpoint

### Database

PostgreSQL with PostGIS extension is used to store geographic and climate data:

- The `climate_data` table stores location information, temperature, precipitation, and additional data
- PostGIS functions are used for geographic queries

### Data Ingestion

The data ingestion service is a Python script that:

- Fetches climate data from NASA's POWER API
- Processes and transforms the data
- Stores the data in the PostgreSQL database
- Runs periodically to keep the data updated

## License

MIT
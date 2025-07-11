#!/usr/bin/env python3
import os
import time
import json
import logging
import requests
import psycopg2
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime
from grid_generator import generate_reduced_grid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database connection parameters
DB_URL = os.getenv('DATABASE_URL')

# Generate a grid of points covering the Earth with 5km precision
# For testing, we use a reduced grid with a maximum of 1000 points
# In production, you would use the full grid with generate_earth_grid(5)
GRID_POINTS = generate_reduced_grid(precision_km=5, max_points=1000)

def connect_to_db():
    """Establish a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(DB_URL)
        logger.info("Connected to the database successfully")
        return conn
    except Exception as e:
        logger.error(f"Error connecting to the database: {e}")
        raise

def fetch_nasa_data(lat, lon):
    """Fetch climate data from NASA's POWER API."""
    try:
        url = f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,RH2M&community=RE&longitude={lon}&latitude={lat}&start=20200101&end=20201231&format=JSON"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        # Extract average temperature and precipitation
        if 'properties' in data and 'parameter' in data['properties']:
            params = data['properties']['parameter']
            temp_data = params.get('T2M', {})
            precip_data = params.get('PRECTOTCORR', {})

            # Calculate averages
            temp_values = [v for k, v in temp_data.items() if isinstance(v, (int, float))]
            precip_values = [v for k, v in precip_data.items() if isinstance(v, (int, float))]

            avg_temp = sum(temp_values) / len(temp_values) if temp_values else None
            avg_precip = sum(precip_values) * 365 if precip_values else None  # Annual precipitation

            return {
                "temperature": avg_temp,
                "precipitation": avg_precip
            }
        return None
    except Exception as e:
        logger.error(f"Error fetching NASA data for coordinates ({lat}, {lon}): {e}")
        return None

def determine_climate_type(temp, precip):
    """Determine the climate type based on temperature and precipitation."""
    if temp is None or precip is None:
        return "Unknown"

    if temp > 18:
        if precip < 500:
            return "Hot desert"
        elif precip < 1000:
            return "Tropical savanna"
        else:
            return "Tropical rainforest"
    elif temp > 10:
        if precip < 500:
            return "Semi-arid"
        elif precip < 1000:
            return "Mediterranean"
        else:
            return "Humid subtropical"
    else:
        if precip < 500:
            return "Cold desert"
        elif precip < 1000:
            return "Continental"
        else:
            return "Oceanic"

def fetch_additional_data(city):
    """Fetch additional data about the city."""
    try:
        return {
            "population": 0,
            "elevation": 0
        }
    except Exception as e:
        logger.error(f"Error fetching additional data for {city['name']}: {e}")
        return {}

def insert_or_update_climate_data(conn, city_data):
    """Insert or update climate data in the database."""
    try:
        cursor = conn.cursor()

        # Check if the city already exists
        cursor.execute(
            "SELECT id FROM climate_data WHERE location_name = %s",
            (city_data["name"],)
        )
        result = cursor.fetchone()

        if result:
            # Update existing record
            cursor.execute(
                """
                UPDATE climate_data
                SET location = ST_GeographyFromText(%s),
                    temperature = %s,
                    precipitation = %s,
                    climate_type = %s,
                    additional_data = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (
                    f"POINT({city_data['lon']} {city_data['lat']})",
                    city_data["temperature"],
                    city_data["precipitation"],
                    city_data["climate_type"],
                    json.dumps(city_data["additional_data"]),
                    result[0]
                )
            )
            logger.info(f"Updated climate data for {city_data['name']}")
        else:
            # Insert new record
            cursor.execute(
                """
                INSERT INTO climate_data (
                    location_name, location, temperature, precipitation, 
                    climate_type, additional_data
                )
                VALUES (%s, ST_GeographyFromText(%s), %s, %s, %s, %s)
                """,
                (
                    city_data["name"],
                    f"POINT({city_data['lon']} {city_data['lat']})",
                    city_data["temperature"],
                    city_data["precipitation"],
                    city_data["climate_type"],
                    json.dumps(city_data["additional_data"])
                )
            )
            logger.info(f"Inserted climate data for {city_data['name']}")

        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Error inserting/updating climate data for {city_data['name']}: {e}")

def main():
    """Main function to ingest climate data."""
    logger.info("Starting climate data ingestion")
    logger.info(f"Processing {len(GRID_POINTS)} grid points with 5km precision")

    try:
        conn = connect_to_db()

        for point in GRID_POINTS:
            logger.info(f"Processing data for {point['name']}")

            # Fetch climate data from NASA
            climate_data = fetch_nasa_data(point["lat"], point["lon"])

            if climate_data:
                # Determine climate type
                climate_type = determine_climate_type(
                    climate_data["temperature"],
                    climate_data["precipitation"]
                )

                # Fetch additional data
                additional_data = fetch_additional_data(point)

                # Prepare point data for database
                point_data = {
                    "name": point["name"],
                    "lat": point["lat"],
                    "lon": point["lon"],
                    "temperature": climate_data["temperature"],
                    "precipitation": climate_data["precipitation"],
                    "climate_type": climate_type,
                    "additional_data": additional_data
                }

                # Insert or update in database
                insert_or_update_climate_data(conn, point_data)
            else:
                logger.warning(f"No climate data available for {point['name']}")

        conn.close()
        logger.info("Climate data ingestion completed successfully")
    except Exception as e:
        logger.error(f"Error in climate data ingestion: {e}")

if __name__ == "__main__":
    # Run once immediately
    main()

    # Then run periodically (e.g., once a day)
    while True:
        # Sleep for 24 hours (in seconds)
        time.sleep(86400)
        main()

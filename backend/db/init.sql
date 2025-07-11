-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create climate_data table
CREATE TABLE IF NOT EXISTS climate_data (
  id SERIAL PRIMARY KEY,
  location_name VARCHAR(255) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  temperature NUMERIC(5, 2),
  precipitation NUMERIC(8, 2),
  climate_type VARCHAR(100),
  additional_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index on location
CREATE INDEX IF NOT EXISTS climate_data_location_idx ON climate_data USING GIST (location);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_climate_data_updated_at
BEFORE UPDATE ON climate_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

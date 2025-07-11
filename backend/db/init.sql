-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create climate_data table
CREATE TABLE IF NOT EXISTS climate_data (
  id SERIAL PRIMARY KEY,
  location_name VARCHAR(255) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  temperature NUMERIC(5, 2),
  precipitation NUMERIC(6, 2),
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

-- Create sample data (will be replaced by actual data from ingestion service)
INSERT INTO climate_data (location_name, location, temperature, precipitation, climate_type, additional_data)
VALUES 
  ('New York', ST_GeographyFromText('POINT(-74.006 40.7128)'), 12.5, 1200.5, 'Humid subtropical', '{"population": 8336817, "elevation": 10, "timezone": "America/New_York"}'),
  ('London', ST_GeographyFromText('POINT(-0.1278 51.5074)'), 11.0, 621.3, 'Temperate oceanic', '{"population": 8982000, "elevation": 11, "timezone": "Europe/London"}'),
  ('Tokyo', ST_GeographyFromText('POINT(139.6917 35.6895)'), 15.4, 1530.8, 'Humid subtropical', '{"population": 13960000, "elevation": 40, "timezone": "Asia/Tokyo"}'),
  ('Sydney', ST_GeographyFromText('POINT(151.2093 -33.8688)'), 17.7, 1213.0, 'Temperate', '{"population": 5312000, "elevation": 3, "timezone": "Australia/Sydney"}'),
  ('Cairo', ST_GeographyFromText('POINT(31.2357 30.0444)'), 21.5, 18.0, 'Hot desert', '{"population": 9500000, "elevation": 23, "timezone": "Africa/Cairo"}'),
  ('Rio de Janeiro', ST_GeographyFromText('POINT(-43.1729 -22.9068)'), 23.8, 1278.0, 'Tropical savanna', '{"population": 6748000, "elevation": 2, "timezone": "America/Sao_Paulo"}'),
  ('Moscow', ST_GeographyFromText('POINT(37.6173 55.7558)'), 5.8, 707.0, 'Humid continental', '{"population": 12500000, "elevation": 156, "timezone": "Europe/Moscow"}'),
  ('Mumbai', ST_GeographyFromText('POINT(72.8777 19.0760)'), 27.2, 2167.0, 'Tropical wet and dry', '{"population": 12478447, "elevation": 14, "timezone": "Asia/Kolkata"}'),
  ('Los Angeles', ST_GeographyFromText('POINT(-118.2437 34.0522)'), 18.6, 379.0, 'Mediterranean', '{"population": 3990000, "elevation": 93, "timezone": "America/Los_Angeles"}'),
  ('Cape Town', ST_GeographyFromText('POINT(18.4241 -33.9249)'), 16.2, 515.0, 'Mediterranean', '{"population": 4618000, "elevation": 0, "timezone": "Africa/Johannesburg"}');
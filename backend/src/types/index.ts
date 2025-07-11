/**
 * Geometry type for GeoJSON
 */
export interface Geometry {
  type: string;
  coordinates: number[];
}

/**
 * Climate data type
 */
export interface ClimateData {
  id: number;
  location_name: string;
  geometry: Geometry;
  temperature: number;
  precipitation: number;
  climate_type: string;
}

/**
 * Location details type (extends ClimateData with additional data)
 */
export interface LocationDetails extends ClimateData {
  additional_data?: Record<string, any>;
}

/**
 * Health check response type
 */
export interface HealthCheckResponse {
  status: string;
  timestamp: Date;
}
/**
 * Represents a geographical point on the Earth's grid.
 */
export interface GridPoint {
  name: string;
  lat: number;
  lon: number;
  country_code: string;
}

/**
 * Represents climate data fetched from NASA's POWER API.
 */
export interface ClimateData {
  temperature: number | null;
  precipitation: number | null;
}

/**
 * Represents additional data about a location.
 */
export interface AdditionalData {
  population: number;
  elevation: number;
  [key: string]: any;
}

/**
 * Represents complete data about a point ready for database insertion.
 */
export interface PointData {
  name: string;
  lat: number;
  lon: number;
  temperature: number | null;
  precipitation: number | null;
  climate_type: string;
  additional_data: AdditionalData;
}

/**
 * Represents NASA API response structure.
 */
export interface NasaApiResponse {
  properties?: {
    parameter?: {
      T2M?: Record<string, number>;
      PRECTOTCORR?: Record<string, number>;
      RH2M?: Record<string, number>;
      [key: string]: Record<string, number> | undefined;
    };
    [key: string]: any;
  };
  [key: string]: any;
}
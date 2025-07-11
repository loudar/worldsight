/**
 * Climate data type
 */
export interface ClimateData {
  id: number;
  location_name: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
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
 * Props for the Earth component
 */
export interface EarthProps {
  climateData: ClimateData[] | null;
  dataLayer: string;
  onLocationSelect: (location: LocationDetails) => void;
}

/**
 * Props for the Controls component
 */
export interface ControlsProps {
  dataLayer: string;
  onLayerChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * Props for the InfoPanel component
 */
export interface InfoPanelProps {
  selectedLocation: LocationDetails | null;
  onClose: () => void;
}
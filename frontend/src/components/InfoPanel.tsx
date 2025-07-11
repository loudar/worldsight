import React from 'react';
import { InfoPanelProps } from '../types';

/**
 * InfoPanel component for displaying location details
 */
const InfoPanel: React.FC<InfoPanelProps> = ({ selectedLocation, onClose }) => {
  if (!selectedLocation) return null;

  return (
    <div className="info-panel">
      <h3>{selectedLocation.location_name}</h3>
      <p>Temperature: {selectedLocation.temperature}°C</p>
      <p>Precipitation: {selectedLocation.precipitation} mm</p>
      <p>Climate: {selectedLocation.climate_type}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default InfoPanel;
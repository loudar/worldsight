import React from 'react';
import { ControlsProps } from '../types';

/**
 * Controls component for UI controls
 */
const Controls: React.FC<ControlsProps> = ({ dataLayer, onLayerChange }) => {
  return (
    <div className="controls">
      <h3>Data Layer</h3>
      <select value={dataLayer} onChange={onLayerChange}>
        <option value="temperature">Temperature</option>
        <option value="precipitation">Precipitation</option>
      </select>
    </div>
  );
};

export default Controls;
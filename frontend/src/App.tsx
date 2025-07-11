import React, { useEffect, useState } from 'react';
import './App.css';
import Earth from './components/Earth';
import Controls from './components/Controls';
import InfoPanel from './components/InfoPanel';
import { ClimateService } from './services/climateService';
import { ClimateData, LocationDetails } from './types';

/**
 * Main App component
 */
const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [climateData, setClimateData] = useState<ClimateData[] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);
  const [dataLayer, setDataLayer] = useState<string>('temperature'); // Options: temperature, precipitation, etc.

  useEffect(() => {
    // Fetch climate data from our API
    const fetchClimateData = async () => {
      try {
        const data = await ClimateService.getClimateData();
        setClimateData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching climate data:', error);
        setLoading(false);
      }
    };

    fetchClimateData();
  }, []);

  const handleLayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDataLayer(e.target.value);
  };

  const handleLocationSelect = (location: LocationDetails) => {
    setSelectedLocation(location);
  };

  return (
    <div className="App">
      {loading ? (
        <div className="loading">Loading climate data...</div>
      ) : (
        <>
          <Controls dataLayer={dataLayer} onLayerChange={handleLayerChange} />
          
          <InfoPanel 
            selectedLocation={selectedLocation} 
            onClose={() => setSelectedLocation(null)} 
          />
          
          <Earth 
            climateData={climateData} 
            dataLayer={dataLayer} 
            onLocationSelect={handleLocationSelect} 
          />
        </>
      )}
    </div>
  );
};

export default App;
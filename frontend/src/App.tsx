import React, {useState} from 'react';
import './App.css';
import Earth from './components/Earth';
import Controls from './components/Controls';
import InfoPanel from './components/InfoPanel';

/**
 * Main App component
 */
const App: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [locationInfo, setLocationInfo] = useState<string>("");
    const [dataLayer, setDataLayer] = useState<string>('temperature');
    const [searchRadius, setSearchRadius] = useState<number>(10);

    const handleLayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDataLayer(e.target.value);
    };

    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchRadius(Number(e.target.value));
    };

    return (
        <div className="App">
            <Controls dataLayer={dataLayer} onLayerChange={handleLayerChange}/>

            <div className="radius-control">
                <label htmlFor="radius-slider">Search Radius: {searchRadius} km</label>
                <input 
                    id="radius-slider"
                    type="range" 
                    min="1" 
                    max="100" 
                    value={searchRadius} 
                    onChange={handleRadiusChange}
                />
            </div>

            <InfoPanel
                loading={loading}
                locationInfo={locationInfo}
            />

            <Earth
                dataLayer={dataLayer}
                setLoading={setLoading}
                setLocationInfo={setLocationInfo}
                searchRadius={searchRadius}
            />
        </div>
    );
};

export default App;

import React, {useState} from 'react';
import './App.css';
import Earth from './components/Earth';
import Controls from './components/Controls';
import InfoPanel from './components/InfoPanel';
import {LocationInfo} from "./types";

/**
 * Main App component
 */
const App: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [locationInfo, setLocationInfo] = useState<LocationInfo>({});
    const [dataLayer, setDataLayer] = useState<string>('temperature');

    const handleLayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDataLayer(e.target.value);
    };

    return (
        <div className="App">
            <Controls dataLayer={dataLayer} onLayerChange={handleLayerChange}/>

            <InfoPanel
                loading={loading}
                locationInfo={locationInfo}
            />

            <Earth
                dataLayer={dataLayer}
                setLoading={setLoading}
                setLocationInfo={setLocationInfo}
            />
        </div>
    );
};

export default App;

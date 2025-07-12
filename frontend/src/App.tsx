import React, {useState} from 'react';
import './App.css';
import Earth from './components/Earth';
import InfoPanel from './components/InfoPanel';
import {LocationInfo} from "./types";

/**
 * Main App component
 */
const App: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [locationInfo, setLocationInfo] = useState<LocationInfo>({});

    return (
        <div className="App">
            <InfoPanel
                loading={loading}
                locationInfo={locationInfo}
            />

            <Earth
                setLoading={setLoading}
                setLocationInfo={setLocationInfo}
            />
        </div>
    );
};

export default App;

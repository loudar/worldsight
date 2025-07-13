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
    const [tileProvider, setTileProvider] = useState<string>(localStorage.getItem("tileProvider") ?? "google");

    return (
        <div className="App flex">
            <InfoPanel
                loading={loading}
                locationInfo={locationInfo}
                setTileProvider={setTileProvider}
                tileProvider={tileProvider}
            />

            <div className="globe-container">
                <Earth
                    setLoading={setLoading}
                    setLocationInfo={setLocationInfo}
                    tileProvider={tileProvider}
                />
            </div>
        </div>
    );
};

export default App;

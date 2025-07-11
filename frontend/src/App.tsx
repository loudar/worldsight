import React, {useEffect, useState} from 'react';
import './App.css';
import Earth from './components/Earth';
import Controls from './components/Controls';
import InfoPanel from './components/InfoPanel';
import Pagination from './components/Pagination';
import {ClimateService} from './services/climateService';
import {ClimateData, LocationDetails, PaginationMeta} from './types';

/**
 * Main App component
 */
const App: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [climateData, setClimateData] = useState<ClimateData[] | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);
    const [dataLayer, setDataLayer] = useState<string>('temperature'); // Options: temperature, precipitation, etc.
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        // Fetch climate data from our API
        const fetchClimateData = async () => {
            try {
                setLoading(true);
                const response = await ClimateService.getClimateData(currentPage, 100);
                setClimateData(response);
                //setPagination(response);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching climate data:', error);
                setLoading(false);
            }
        };

        fetchClimateData();
    }, [currentPage]);

    // Function to handle page changes
    const handlePageChange = (newPage: number) => {
        if (pagination && newPage > 0 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
        }
    };

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
                    <Controls dataLayer={dataLayer} onLayerChange={handleLayerChange}/>

                    <InfoPanel
                        selectedLocation={selectedLocation}
                        onClose={() => setSelectedLocation(null)}
                    />

                    <Earth
                        climateData={climateData}
                        dataLayer={dataLayer}
                        onLocationSelect={handleLocationSelect}
                    />

                    {pagination && (
                        <Pagination
                            pagination={pagination}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default App;

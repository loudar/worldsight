import React from 'react';
import {InfoPanelProps} from '../types';

/**
 * InfoPanel component for displaying location details
 */
const InfoPanel: React.FC<InfoPanelProps> = ({loading, locationInfo}) => {
    if (!locationInfo) {
        return null;
    }

    return (
        <div className="info-panel">{
            loading ? (<p>Loading...</p>) : <p>{locationInfo}</p>
        }</div>
    );
};

export default InfoPanel;
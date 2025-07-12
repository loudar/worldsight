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
            loading ? (<p>Loading...</p>) : <div>
                {(locationInfo.news ?? []).map((item) => {
                    return (
                        <p>{item}</p>
                    )
                })}
                <p>{locationInfo.position?.lat}</p>
                <p>{locationInfo.position?.lng}</p>
                <p>{locationInfo.name}</p>
            </div>
        }</div>
    );
};

export default InfoPanel;
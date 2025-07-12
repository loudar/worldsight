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
                <h1>{locationInfo.data?.location.name}</h1>
                <div className="flex spaced mono">
                    <p>LAT {locationInfo.position?.lat.toFixed(2)}</p>
                    <p>LON {locationInfo.position?.lng.toFixed(2)}</p>
                </div>
                <div className="flex-v spaced">
                    {(locationInfo.data?.news ?? []).map((article, index) => {
                        return (
                            <article key={index}>
                                <h2>{article.title}</h2>
                                <a href={article.url} target="_blank">{article.source}</a>
                            </article>
                        )
                    })}
                </div>
            </div>
        }</div>
    );
};

export default InfoPanel;
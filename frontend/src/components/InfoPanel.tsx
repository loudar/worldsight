import React, {ChangeEvent} from 'react';
import {InfoPanelProps} from '../types';

/**
 * InfoPanel component for displaying location details
 */
const InfoPanel: React.FC<InfoPanelProps> = ({loading, locationInfo, setTileProvider, tileProvider}) => {
    if (!locationInfo) {
        return null;
    }

    return (
        <div className="info-panel flex-v spaced">
            <div>
                <select name="tileProvider" id="tileProvider" onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    if (setTileProvider) {
                        localStorage.setItem("tileProvider", e.target.value);
                        setTileProvider(e.target.value);
                    }
                }}>
                    <option value="google">Google</option>
                    <option value="osm">OpenStreetMap</option>
                </select>
            </div>
            {
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
                    <div className="flex-v spaced">
                        {(locationInfo.data?.historicData ?? []).map((entry, index) => {
                            return (
                                <article key={index}>
                                    <div className="flex spread">
                                        <h2>{entry.title}</h2>
                                        <p>{entry.extract}</p>
                                    </div>
                                    <a href={entry.url} target="_blank">{entry.url}</a>
                                </article>
                            )
                        })}
                    </div>
                </div>
            }
        </div>
    );
};

export default InfoPanel;
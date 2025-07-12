import React from "react";
import {LocationResponse} from "./responses";

export interface EarthProps {
    setLoading?: (value: (((prevState: boolean) => boolean) | boolean)) => void,
    setLocationInfo?: (value: (((prevState: LocationInfo) => LocationInfo) | LocationInfo)) => void,
}

export interface ControlsProps {
    dataLayer: string;
    onLayerChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export interface InfoPanelProps {
    loading?: boolean,
    locationInfo?: LocationInfo,
}

export interface LocationInfo {
    position?: {
        lat: number;
        lng: number;
    },
    data?: LocationResponse
}
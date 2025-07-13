import {LocationResponse} from "./responses";

export interface EarthProps {
    setLoading?: (value: (((prevState: boolean) => boolean) | boolean)) => void,
    setLocationInfo?: (value: (((prevState: LocationInfo) => LocationInfo) | LocationInfo)) => void,
    tileProvider?: string,
}

export interface InfoPanelProps {
    loading?: boolean,
    locationInfo?: LocationInfo,
    setTileProvider?: (value: (((prevState: string) => string) | string)) => void,
    tileProvider?: string
}

export interface LocationInfo {
    position?: {
        lat: number;
        lng: number;
    },
    data?: LocationResponse
}
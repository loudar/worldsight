import React from "react";

/**
 * Props for the Earth component
 */
export interface EarthProps {
    dataLayer: string,
    setLoading?: (value: (((prevState: boolean) => boolean) | boolean)) => void,
    setLocationInfo?: (value: (((prevState: string) => string) | string)) => void,
    searchRadius?: number
}

/**
 * Props for the Controls component
 */
export interface ControlsProps {
    dataLayer: string;
    onLayerChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * Props for the InfoPanel component
 */
export interface InfoPanelProps {
    loading?: boolean,
    locationInfo?: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    pageSize: number;
    totalPages: number;
    total: number;
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}

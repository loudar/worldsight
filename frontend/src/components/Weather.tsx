import {WeatherResponse} from "../types/WeatherResponse";
import {Cloud, Droplets, Thermometer, Wind, Gauge, Sun, CloudRain} from 'lucide-react';
import React from "react";

export interface WeatherProps {
    weatherData: WeatherResponse | null | undefined;
}

const exampleData = {
    lat: 40.7128,
    lon: -74.0060,
    tz: "America/New_York",
    date: "2025-07-13",
    units: "metric",
    cloud_cover: {
        afternoon: 65
    },
    humidity: {
        afternoon: 78
    },
    precipitation: {
        total: 2.5
    },
    temperature: {
        min: 18,
        max: 28,
        afternoon: 26,
        night: 20,
        evening: 24,
        morning: 19
    },
    pressure: {
        afternoon: 1013
    },
    wind: {
        max: {
            speed: 15,
            direction: 225
        }
    }
};

const Weather: React.FC<WeatherProps> = ({weatherData}) => {
    if (!weatherData) {
        /*return (
            <div className="max-w-md mx-auto bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-3xl p-6 text-white shadow-2xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Weather Data</h2>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Thermometer className="w-8 h-8 text-gray-300"/>
                        <span className="text-lg">No data available</span>
                    </div>
                    <p className="text-gray-200 text-sm">Please check your connection and try again</p>
                </div>
            </div>
        );*/
        weatherData = exampleData;
    }

    const getWindDirection = (degrees: number) => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.round(degrees / 45) % 8];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const tempTimes = [
        {label: 'Morning', value: weatherData.temperature.morning, time: '6 AM', icon: Sun},
        {label: 'Afternoon', value: weatherData.temperature.afternoon, time: '2 PM', icon: Sun},
        {label: 'Evening', value: weatherData.temperature.evening, time: '6 PM', icon: Sun},
        {label: 'Night', value: weatherData.temperature.night, time: '10 PM', icon: Cloud}
    ];

    return (
        <div
            className="max-w-md weather-card">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-1">Weather Today</h2>
                <p className="text-blue-100 text-sm">{formatDate(weatherData.date)}</p>
                <p className="text-blue-100 text-xs">
                    {weatherData.lat.toFixed(2)}°, {weatherData.lon.toFixed(2)}°
                </p>
            </div>

            {/* Main Temperature */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <Thermometer className="w-8 h-8 text-yellow-300"/>
                    <div className="text-5xl font-bold">
                        {weatherData.temperature.afternoon}°
                    </div>
                </div>
                <div className="flex justify-center gap-6 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">
            Min {weatherData.temperature.min}°
          </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
            Max {weatherData.temperature.max}°
          </span>
                </div>
            </div>

            {/* Temperature Timeline */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                {tempTimes.map((temp, index) => (
                    <div key={index}
                         className="text-center bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                        <div className="text-xs text-blue-100 mb-1">{temp.time}</div>
                        <div className="font-semibold text-lg">{temp.value}°</div>
                        <div className="text-xs text-blue-200">{temp.label}</div>
                    </div>
                ))}
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-5 h-5 text-blue-200"/>
                        <span className="text-sm font-medium">Humidity</span>
                    </div>
                    <div className="text-2xl font-bold">{weatherData.humidity.afternoon}%</div>
                </div>

                <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <Cloud className="w-5 h-5 text-blue-200"/>
                        <span className="text-sm font-medium">Cloud Cover</span>
                    </div>
                    <div className="text-2xl font-bold">{weatherData.cloud_cover.afternoon}%</div>
                </div>

                <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <Wind className="w-5 h-5 text-blue-200"/>
                        <span className="text-sm font-medium">Wind</span>
                    </div>
                    <div className="text-lg font-bold">{weatherData.wind.max.speed} km/h</div>
                    <div className="text-xs text-blue-200">{getWindDirection(weatherData.wind.max.direction)}</div>
                </div>

                <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <Gauge className="w-5 h-5 text-blue-200"/>
                        <span className="text-sm font-medium">Pressure</span>
                    </div>
                    <div className="text-lg font-bold">{weatherData.pressure.afternoon}</div>
                    <div className="text-xs text-blue-200">hPa</div>
                </div>
            </div>

            {/* Precipitation */}
            {weatherData.precipitation.total > 0 && (
                <div className="mt-4 bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-5 h-5 text-blue-200"/>
                        <span className="text-sm font-medium">Precipitation</span>
                    </div>
                    <div className="text-xl font-bold">{weatherData.precipitation.total} mm</div>
                </div>
            )}

            {/* Footer */}
            <div className="text-center mt-6 text-blue-100 text-xs">
                Updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
}

export default Weather;
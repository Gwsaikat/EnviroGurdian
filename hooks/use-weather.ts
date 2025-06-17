import { useState, useEffect, useCallback } from 'react';

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  uvIndex: number;
  feelsLike: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  location: string;
  country: string;
  date: string;
  pressure: number;
  cloudCover: number;
  precipitation: number;
  isDay: boolean;
  forecast: ForecastDay[];
}

export interface ForecastDay {
  date: string;
  day: string;
  temperature: {
    max: number;
    min: number;
  };
  condition: string;
  icon: string;
  precipitation_probability: number;
  precipitation_sum: number;
  wind_speed: number;
  uv_index: number;
}

interface UseWeatherProps {
  latitude?: number | null;
  longitude?: number | null;
  refreshInterval?: number; // in milliseconds
}

export const useWeather = (params: UseWeatherProps) => {
  const { latitude, longitude, refreshInterval = 600000 } = params; // 10 minutes default
  
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Use useCallback to memoize the fetchWeather function
  const fetchWeather = useCallback(async () => {
    // Validate location data
    if (!latitude || !longitude) {
      console.log('useWeather: Missing location data', { latitude, longitude });
      setError('Location data is required to fetch weather');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Log the request with precise coordinates
      console.log(`useWeather: Requesting weather data for coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      
      // Make the API request with the exact coordinates
      const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('useWeather: Received data:', result);
      
      // Validate the received data
      if (!result || typeof result.temperature !== 'number') {
        throw new Error('Invalid weather data received from API');
      }
      
      setData(result);
      setLastFetch(new Date());
    } catch (err) {
      console.error('useWeather: Error fetching weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]); // Add dependencies to useCallback

  // Set up initial fetch and refresh interval
  useEffect(() => {
    console.log('useWeather: Setting up with coordinates:', { latitude, longitude });
    
    // Perform initial fetch
    fetchWeather();
    
    // Set up refresh interval
    console.log(`useWeather: Setting up refresh interval for ${refreshInterval}ms`);
    const intervalId = setInterval(fetchWeather, refreshInterval);
    
    // Cleanup function
    return () => {
      console.log('useWeather: Cleaning up interval');
      clearInterval(intervalId);
    };
  }, [latitude, longitude, refreshInterval, fetchWeather]); // Include all dependencies
  
  // Return hook data
  return {
    data,
    loading,
    error,
    lastFetch,
    refetch: fetchWeather // Expose refetch function for manual refreshes
  };
};
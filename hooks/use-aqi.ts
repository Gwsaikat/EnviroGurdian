import { useState, useEffect, useCallback } from 'react';

export interface AQIData {
  recommendation: string;
  aqi: number;
  level: string;
  pm25: number;
  pm10: number;
  timestamp: string;
  source?: string;
}

interface UseAQIProps {
  latitude?: number | null;
  longitude?: number | null;
  refreshInterval?: number; // in milliseconds
}

export const useAQI = (param: UseAQIProps | number | null, secondParam?: number | null, thirdParam?: number) => {
  // Handle both object and positional parameters for backward compatibility
  let latitude: number | null = null;
  let longitude: number | null = null;
  let refreshInterval = 300000; // 5 minutes default
  
  if (param !== null && typeof param === 'object') {
    // Object parameter style (preferred)
    latitude = param.latitude || null;
    longitude = param.longitude || null;
    refreshInterval = param.refreshInterval || 300000;
  } else if (typeof param === 'number' && typeof secondParam === 'number') {
    // Positional parameters style (legacy)
    latitude = param;
    longitude = secondParam;
    if (typeof thirdParam === 'number') refreshInterval = thirdParam;
  }
  const [data, setData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Use useCallback to memoize the fetchAQI function
  const fetchAQI = useCallback(async () => {
    // Validate location data
    if (!latitude || !longitude) {
      console.log('useAQI: Missing location data', { latitude, longitude });
      setError('Location data is required to fetch AQI');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Log the request with precise coordinates
      console.log(`useAQI: Requesting AQI data for coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      
      // Make the API request with the exact coordinates
      const response = await fetch(`/api/aqi?lat=${latitude}&lon=${longitude}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch AQI data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('useAQI: Received data:', result);
      
      // Validate the received data
      if (!result || typeof result.aqi !== 'number') {
        throw new Error('Invalid AQI data received from API');
      }
      
      setData(result);
      setLastFetch(new Date());
    } catch (err) {
      console.error('useAQI: Error fetching AQI data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AQI data');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]); // Add dependencies to useCallback

  // Set up initial fetch and refresh interval
  useEffect(() => {
    console.log('useAQI: Setting up with coordinates:', { latitude, longitude });
    
    // Perform initial fetch
    fetchAQI();
    
    // Set up refresh interval
    console.log(`useAQI: Setting up refresh interval for ${refreshInterval}ms`);
    const intervalId = setInterval(fetchAQI, refreshInterval);
    
    // Cleanup function
    return () => {
      console.log('useAQI: Cleaning up interval');
      clearInterval(intervalId);
    };
  }, [latitude, longitude, refreshInterval, fetchAQI]); // Include all dependencies
  
  // Return hook data
  return {
    data,
    loading,
    error,
    lastFetch,
    refetch: fetchAQI // Expose refetch function for manual refreshes
  };
}
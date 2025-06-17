'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useWeather, WeatherData } from '@/hooks/use-weather';
import { useAQI, AQIData } from '@/hooks/use-aqi';

interface EnvironmentContextType {
  // Location data
  latitude: number | null;
  longitude: number | null;
  locationLoading: boolean;
  locationError: string | null;
  refreshLocation: () => Promise<boolean>;
  
  // Weather data
  weatherData: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  weatherLastFetch: Date | null;
  refreshWeather: () => Promise<void>;
  
  // AQI data
  aqiData: AQIData | null;
  aqiLoading: boolean;
  aqiError: string | null;
  aqiLastFetch: Date | null;
  refreshAQI: () => Promise<void>;
  
  // Combined state
  isLoading: boolean;
  hasError: boolean;
  lastUpdated: Date | null;
  refreshAll: () => Promise<void>;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export function EnvironmentProvider({ children, refreshInterval = 300000 }: { children: ReactNode, refreshInterval?: number }) {
  // Get location data
  const { 
    latitude, 
    longitude, 
    error: locationError, 
    isLoading: locationLoading,
    refreshLocation 
  } = useGeolocation();
  
  // Get weather data with shorter refresh interval
  const { 
    data: weatherData, 
    loading: weatherLoading, 
    error: weatherError,
    lastFetch: weatherLastFetch,
    refetch: refreshWeather 
  } = useWeather({ 
    latitude, 
    longitude,
    refreshInterval: refreshInterval // Use the provided refresh interval
  });
  
  // Get AQI data with shorter refresh interval
  const { 
    data: aqiData, 
    loading: aqiLoading, 
    error: aqiError,
    lastFetch: aqiLastFetch,
    refetch: refreshAQI 
  } = useAQI({
    latitude,
    longitude,
    refreshInterval: refreshInterval // Use the provided refresh interval
  });
  
  // Combined loading state
  const isLoading = locationLoading || weatherLoading || aqiLoading;
  
  // Combined error state
  const hasError = Boolean(locationError || weatherError || aqiError);
  
  // Last updated timestamp (most recent of weather or AQI)
  const lastUpdated = (() => {
    if (weatherLastFetch && aqiLastFetch) {
      return new Date(Math.max(weatherLastFetch.getTime(), aqiLastFetch.getTime()));
    } else if (weatherLastFetch) {
      return weatherLastFetch;
    } else if (aqiLastFetch) {
      return aqiLastFetch;
    } else {
      return null;
    }
  })();
  
  // Function to refresh all data
  const refreshAll = useCallback(async () => {
    let locationSuccess = true;
    
    // If we don't have location data, try to get it
    if (latitude === null || longitude === null) {
      locationSuccess = await refreshLocation();
    }
    
    // Only fetch weather and AQI if we have location data
    if (locationSuccess || (latitude !== null && longitude !== null)) {
      await Promise.all([
        refreshWeather(),
        refreshAQI()
      ]);
    }
    
    return locationSuccess;
  }, [latitude, longitude, refreshLocation, refreshWeather, refreshAQI]);
  
  // Set up auto-refresh for all data
  useEffect(() => {
    // Initial refresh
    refreshAll();
    
    // Set up interval for periodic refresh
    const intervalId = setInterval(() => {
      refreshAll();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, refreshAll]);
  
  const value = {
    // Location
    latitude,
    longitude,
    locationLoading,
    locationError,
    refreshLocation,
    
    // Weather
    weatherData,
    weatherLoading,
    weatherError,
    weatherLastFetch,
    refreshWeather,
    
    // AQI
    aqiData,
    aqiLoading,
    aqiError,
    aqiLastFetch,
    refreshAQI,
    
    // Combined
    isLoading,
    hasError,
    lastUpdated,
    refreshAll
  };
  
  return (
    <EnvironmentContext.Provider value={{...value, refreshAll: async () => { await value.refreshAll(); }}}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  
  return context;
}
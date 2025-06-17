"use client"

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Map, Compass, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components with SSR disabled
const MapComponents = dynamic(
  () => import('./map-components'),
  { ssr: false }
);

interface ZoneData {
  lat: number;
  lon: number;
  aqi: number;
}

const getColor = (aqi: number) => {
  if (aqi <= 50) return "#00E400";
  if (aqi <= 100) return "#FFFF00";
  if (aqi <= 150) return "#FF7E00";
  if (aqi <= 200) return "#FF0000";
  return "#99004C";
};

const getTip = (aqi: number) => {
  if (aqi > 200) return "⚠️ Hazardous: Stay indoors!";
  if (aqi > 150) return "😷 Very Unhealthy: Avoid outdoor activity.";
  if (aqi > 100) return "🟠 Unhealthy: Sensitive groups beware.";
  if (aqi > 50) return "🟡 Moderate: Some pollution risk.";
  return "🟢 Good: Air is clean!";
};

import { useGeolocation } from "@/hooks/use-geolocation";
import { useAQI } from "@/hooks/use-aqi";

export function Heatmap() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [error, setError] = useState<string | null>(null);
  
  // Get user's location
  const { latitude, longitude, isLoading: locationLoading, error: locationError, refreshLocation } = useGeolocation();
  
  // Get AQI data for the user's location
  const { data: aqiData, loading: aqiLoading } = useAQI(latitude, longitude);
  
  useEffect(() => {
    // Set loading state based on location and AQI loading states
    setLoading(locationLoading || aqiLoading);
    
    // Handle location error
    if (locationError) {
      setError(`Location error: ${locationError}`);
      console.error('Location error:', locationError);
    }
    
    // If we have location and AQI data, create the zones
    if (latitude && longitude && aqiData && aqiData.aqi) {
      console.log(`Creating map zones around location: ${latitude}, ${longitude} with AQI: ${aqiData.aqi}`);
      
      // Create a zone for the user's current location
      const currentLocationZone = {
        lat: latitude,
        lon: longitude,
        aqi: aqiData.aqi
      };
      
      // Create some surrounding zones with slightly varied AQI values for visualization
      // These are based on the user's actual location, not hardcoded coordinates
      const surroundingZones = [
        { lat: latitude + 0.01, lon: longitude + 0.01, aqi: Math.max(0, aqiData.aqi - 10) },
        { lat: latitude - 0.01, lon: longitude - 0.01, aqi: Math.min(300, aqiData.aqi + 10) },
        { lat: latitude + 0.01, lon: longitude - 0.01, aqi: Math.max(0, aqiData.aqi - 20) },
        { lat: latitude - 0.01, lon: longitude + 0.01, aqi: Math.min(300, aqiData.aqi + 20) },
      ];
      
      setZones([currentLocationZone, ...surroundingZones]);
      setLoading(false);
    }
  }, [latitude, longitude, aqiData, locationLoading, aqiLoading, locationError]);
  
  // Use a random key to force re-initialization on each mount
  const mapKey = Math.random().toString(36).substring(2, 10);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card className="w-full h-full rounded-2xl overflow-hidden shadow-xl border border-border/50 glass-morphism glow-effect relative">
        <div className="flex items-center justify-between p-4 border-b border-border/30 backdrop-blur-sm bg-background/30 z-10 relative">
          <div className="flex items-center gap-2">
            <motion.div 
              className="bg-primary/10 p-2 rounded-full shadow-glow-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Map className="h-5 w-5 text-primary" />
            </motion.div>
            <h3 className="font-medium text-lg neon-text">Air Quality Map</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.div 
              className="flex p-1 bg-background/40 backdrop-blur-md rounded-lg border border-border/30 shadow-glow-sm"
              variants={itemVariants}
            >
              <Button
                variant={mapType === "standard" ? "default" : "ghost"}
                size="sm"
                className="h-8 rounded-lg flex items-center gap-1.5 text-xs"
                onClick={() => setMapType("standard")}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Standard</span>
              </Button>
              <Button
                variant={mapType === "satellite" ? "default" : "ghost"}
                size="sm"
                className="h-8 rounded-lg flex items-center gap-1.5 text-xs"
                onClick={() => setMapType("satellite")}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Satellite</span>
              </Button>
            </motion.div>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              className="w-full h-full flex items-center justify-center bg-background/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="flex flex-col items-center glass-morphism p-8 rounded-2xl border border-border/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <motion.div 
                    className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                  />
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-3 relative z-10" />
                </div>
                <p className="text-lg font-medium mb-1">Loading Map Data</p>
                <p className="text-sm text-muted-foreground">Fetching air quality information...</p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="map"
              className="absolute inset-0 top-[57px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MapComponents 
                mapKey={mapKey}
                center={latitude && longitude ? [latitude, longitude] as [number, number] : [28.62, 77.22]}
                zoom={13}
                mapType={mapType}
                zones={zones}
                getColor={getColor}
                getTip={getTip}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
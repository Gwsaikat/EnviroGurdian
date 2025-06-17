"use client"

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { AQIDisplay } from "@/components/aqi-display";
import { Notifications } from "@/components/notifications";
import { AIChat } from "@/components/ai-chat";
import { Heatmap } from "@/components/heatmap";
import { InsightsDashboard } from "@/components/insights-dashboard";
import { SearchVector } from "@/components/search-vector";
import { CameraAR } from "@/components/camera-ar";
import { WeatherDashboard } from "@/components/weather-dashboard";
import { MapPin, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EnvironmentProvider, useEnvironment } from "@/contexts/environment-context";

// Create a wrapper component that uses the environment context
function HomeContent() {
  const { 
    // Location data
    latitude, 
    longitude, 
    locationError, 
    refreshLocation,
    
    // AQI data
    aqiData, 
    aqiLoading, 
    aqiError,
    
    // Combined states
    isLoading,
    refreshAll,
    lastUpdated
  } = useEnvironment();
  
  const [locationName, setLocationName] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("weather"); // Default to weather tab
  
  // Function to open the Environment tab - can be called from other components
  const openEnvironmentTab = () => {
    setActiveTab("environment");
  };
  
  // Make the function available globally
  useEffect(() => {
    // @ts-ignore - Adding to window object
    window.openEnvironmentTab = openEnvironmentTab;
    
    return () => {
      // @ts-ignore - Cleanup
      delete window.openEnvironmentTab;
      // @ts-ignore - Cleanup location data
      delete window.locationData;
    };
  }, []);
  
  const handleRefreshLocation = async () => {
    setIsRefreshing(true);
    await refreshAll(); // Refresh all data instead of just location
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  // Store location data in a ref to make it accessible globally
  const locationDataRef = useRef<{name: string; state?: string; country?: string; fullName: string;} | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      // Fetch location name using reverse geocoding
      const fetchLocationName = async () => {
        try {
          console.log(`Fetching location name for coordinates: ${latitude}, ${longitude}`);
          // Use a more reliable geocoding service
          const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`);
          
          if (!response.ok) {
            throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Location data received:', data);
          
          if (Array.isArray(data) && data.length > 0) {
            // Include more location details when available
            const locationParts = [];
            
            if (data[0].name) locationParts.push(data[0].name);
            if (data[0].state && data[0].state !== data[0].name) locationParts.push(data[0].state);
            if (data[0].country) locationParts.push(data[0].country);
            
            // For India, check if this is Amta area based on coordinates
            if (data[0].country === "IN" && 
                latitude >= 22.5 && latitude <= 22.6 && 
                longitude >= 88.0 && longitude <= 88.1) {
              const fullName = "Amta, West Bengal, India";
              setLocationName(fullName);
              locationDataRef.current = {
                name: "Amta",
                state: "West Bengal",
                country: "India",
                fullName
              };
            } else {
              const fullName = locationParts.join(", ");
              setLocationName(fullName);
              locationDataRef.current = {
                name: data[0].name,
                state: data[0].state,
                country: data[0].country,
                fullName
              };
            }
            
            // Make location data available globally for other components
            // @ts-ignore
            window.locationData = locationDataRef.current;
          } else {
            // If we can't get a proper location name, use the coordinates
            const fallbackName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocationName(fallbackName);
            locationDataRef.current = {
              name: fallbackName,
              fullName: fallbackName
            };
            // @ts-ignore
            window.locationData = locationDataRef.current;
          }
        } catch (error) {
          console.error('Error fetching location name:', error);
          // Fallback to coordinates if there's an error
          const fallbackName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocationName(fallbackName);
          locationDataRef.current = {
            name: fallbackName,
            fullName: fallbackName
          };
          // @ts-ignore
          window.locationData = locationDataRef.current;
        }
      };
      
      fetchLocationName();
    }
  }, [latitude, longitude]);

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  return (
    <main className="container mx-auto px-2 md:px-4 lg:px-6 py-6 space-y-6 max-w-[1200px]">
      {/* Header with title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold tracking-tight neon-text mb-2">EnviroGuardian</h1>
        <p className="text-muted-foreground">Your real-time environmental assistant</p>
      </motion.div>
      
      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex justify-center mb-6"
      >
        <div className="inline-flex bg-slate-800/30 backdrop-blur-sm p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("weather")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "weather" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            Weather
          </button>
          <button
            onClick={() => setActiveTab("environment")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "environment" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            Environment
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "insights" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            Insights
          </button>
        </div>
      </motion.div>
      
      {/* Weather Dashboard Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "weather" && (
          <motion.div
            key="weather"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WeatherDashboard locationData={locationDataRef.current} />
          </motion.div>
        )}
        
        {/* Environment Tab */}
        {activeTab === "environment" && (
          <motion.div
            key="environment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location Card */}
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card className="p-4 hover-card glass-morphism rounded-2xl border border-border glow-effect">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Location</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full" 
                      onClick={handleRefreshLocation}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    {latitude && longitude ? (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="flex-1"
                      >
                        <p className="text-sm font-medium overflow-hidden text-ellipsis">
                          {locationName || "Detecting your location..."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
                        </p>
                      </motion.div>
                    ) : locationError ? (
                      <div className="flex-1">
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <p className="text-sm font-medium">Location Error</p>
                        </div>
                        <p className="text-xs text-destructive/80">{locationError}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Detecting your location...</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Air Quality Card */}
              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="float-animation"
              >
                <Card className="p-4 hover-card glass-morphism rounded-2xl border border-border glow-effect">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium">Air Quality</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={refreshAll}
                      disabled={isRefreshing}
                      className="h-8 w-8"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {aqiLoading ? (
                    <div className="flex justify-center items-center h-16">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : aqiData ? (
                    <div>
                      <AQIDisplay aqi={aqiData.aqi} level={aqiData.level} recommendation={aqiData.recommendation} />
                    </div>
                  ) : aqiError ? (
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="flex items-center gap-2 text-destructive mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm font-medium">Error</p>
                      </div>
                      <p className="text-xs text-destructive/80">{aqiError}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Waiting for location...</p>
                  )}
                </Card>
              </motion.div>

              {/* Recommendations Card */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card className="p-4 hover-card glass-morphism rounded-2xl border border-border glow-effect">
                  <div className="flex flex-col h-full">
                    <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                    {aqiLoading ? (
                      <div className="flex justify-center items-center h-16">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : aqiData ? (
                      <div className="space-y-2 flex-1">
                        <p className="text-sm">{aqiData.recommendation}</p>
                        {aqiData.aqi > 100 && (
                          <p className="text-sm text-amber-500 dark:text-amber-400 font-medium pulse-alert">
                            Consider using an air purifier indoors and limiting outdoor activities.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Waiting for air quality data...</p>
                    )}
                    
                    {/* Last Updated Indicator */}
                    <div className="mt-auto pt-2 border-t border-border/30 mt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Last updated</p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs">
                            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={refreshAll}
                            className="h-6 w-6 ml-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Notifications and Heatmap - Improved Layout */}
            <div className="grid grid-cols-1 gap-4 mt-6">
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card className="p-4 hover-card glass-morphism rounded-2xl border border-border glow-effect">
                  <h3 className="text-lg font-medium mb-4">Pollution Heatmap</h3>
                  <div className="h-[400px] w-full"> {/* Increased height for better visibility */}
                    <Heatmap />
                  </div>
                </Card>
              </motion.div>
              
              {/* AR Camera Component */}
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="mt-6"
              >
                <CameraAR aqi={aqiData?.aqi || null} level={aqiData?.level} latitude={latitude} longitude={longitude} />
              </motion.div>
              
              <motion.div
                custom={5}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="mt-6"
              >
                <Card className="p-4 hover-card glass-morphism rounded-2xl border border-border glow-effect">
                  <h3 className="text-lg font-medium mb-4">Notifications</h3>
                  <div className="max-h-[300px] overflow-y-auto pr-2"> {/* Added scrolling for overflow */}
                    <Notifications />
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
        
        {/* Insights Tab */}
        {activeTab === "insights" && (
          <motion.div
            key="insights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 hover-card glass-morphism rounded-2xl border border-border glow-effect">
              <h3 className="text-xl font-medium mb-6">Environmental Insights</h3>
              <InsightsDashboard />
            </Card>
            
            {/* Search Vector Component */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="mt-6"
            >
              <Card className="p-4 hover-card glass-morphism rounded-2xl border border-border glow-effect">
                <h3 className="text-lg font-medium mb-4">Environmental Data Search</h3>
                <SearchVector />
              </Card>
            </motion.div>
            
            {/* AI Assistant - Improved Layout */}
            <div className="grid grid-cols-1 gap-4 mt-6">
              <motion.div
                custom={5}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card className="p-4 hover-card glass-morphism rounded-2xl border border-border glow-effect">
                  <h3 className="text-lg font-medium mb-4">AI Assistant</h3>
                  <div className="h-[400px] overflow-hidden"> {/* Fixed height container */}
                    <AIChat />
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Export the main component wrapped with the EnvironmentProvider
export default function Home() {
  return (
    <EnvironmentProvider>
      <HomeContent />
    </EnvironmentProvider>
  );
}
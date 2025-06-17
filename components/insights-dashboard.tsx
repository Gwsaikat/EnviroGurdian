"use client"

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, TrendingUp, Thermometer, Droplets, RefreshCw } from "lucide-react";
import { useEnvironment } from "@/contexts/environment-context";

interface DataPoint {
  date: string;
  aqi_eu: number | null;
  aqi_us: number | null;
  pm25: number | null;
  pm10: number | null;
  co: number | null;
  no2: number | null;
  so2: number | null;
  o3: number | null;
  temperature?: number | null;
  humidity?: number | null;
}

export function InsightsDashboard() {
  const [activeTab, setActiveTab] = useState("daily");
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { 
    // Location data
    latitude, 
    longitude, 
    locationLoading, 
    locationError,
    
    // AQI data
    aqiData, 
    aqiLoading, 
    aqiError,
    
    // Combined states
    isLoading: envLoading,
    hasError,
    lastUpdated,
    refreshAll
  } = useEnvironment();

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!latitude || !longitude) {
        console.log('Missing coordinates for historical data fetch');
        return;
      }

      setIsLoading(true);
      try {
        // Fetch AQI historical data
        console.log(`Fetching historical AQI data for coordinates: ${latitude}, ${longitude}, period: ${activeTab}`);
        const aqiResponse = await fetch(`/api/historical-aqi?latitude=${latitude}&longitude=${longitude}&period=${activeTab}`);
        
        if (!aqiResponse.ok) {
          throw new Error(`HTTP error for AQI data! status: ${aqiResponse.status}`);
        }
        
        const aqiHistoricalData: DataPoint[] = await aqiResponse.json();
        console.log('AQI historical data received:', aqiHistoricalData);
        
        // Fetch weather historical data
        console.log(`Fetching historical weather data for coordinates: ${latitude}, ${longitude}, period: ${activeTab}`);
        const weatherResponse = await fetch(`/api/historical-weather?latitude=${latitude}&longitude=${longitude}&period=${activeTab}`);
        
        if (!weatherResponse.ok) {
          throw new Error(`HTTP error for weather data! status: ${weatherResponse.status}`);
        }
        
        const weatherHistoricalData = await weatherResponse.json();
        console.log('Weather historical data received:', weatherHistoricalData);
        
        // Merge AQI and weather data based on timestamps
        let mergedData: DataPoint[] = [];
        
        if (Array.isArray(aqiHistoricalData) && aqiHistoricalData.length > 0) {
          mergedData = aqiHistoricalData.map(aqiPoint => {
            // Find matching weather data point by date
            const matchingWeatherPoint = weatherHistoricalData.find(
              (w: any) => w.date === aqiPoint.date
            );
            
            return {
              ...aqiPoint,
              temperature: matchingWeatherPoint?.temperature || null,
              humidity: matchingWeatherPoint?.humidity || null
            };
          });
          
          setData(mergedData);
        } else {
          console.warn('Received empty or invalid historical data');
          setData([]); // Clear data if invalid
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
        setData([]); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [activeTab, latitude, longitude]);





  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-morphism p-3 rounded-lg shadow-xl border border-border">
          <p className="font-medium text-sm">{label}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {data.temperature !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                Temp: <span className="font-medium">{data.temperature}°C</span>
              </p>
            )}
            {data.humidity !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                Humidity: <span className="font-medium">{data.humidity}%</span>
              </p>
            )}
            {data.aqi_eu !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                AQI (EU): <span className="font-medium">{data.aqi_eu}</span>
              </p>
            )}
            {data.aqi_us !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                AQI (US): <span className="font-medium">{data.aqi_us}</span>
              </p>
            )}
            {data.pm25 !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                PM2.5: <span className="font-medium">{data.pm25} μg/m³</span>
              </p>
            )}
            {data.pm10 !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                PM10: <span className="font-medium">{data.pm10} μg/m³</span>
              </p>
            )}
            {data.co !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                CO: <span className="font-medium">{data.co} μg/m³</span>
              </p>
            )}
            {data.no2 !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                NO2: <span className="font-medium">{data.no2} μg/m³</span>
              </p>
            )}
            {data.so2 !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>
                SO2: <span className="font-medium">{data.so2} μg/m³</span>
              </p>
            )}
            {data.o3 !== null && (
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span>
                O3: <span className="font-medium">{data.o3} μg/m³</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

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
    >
      <Card className="w-full glass-morphism shadow-xl rounded-2xl border border-border overflow-hidden glow-effect">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-full">
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Historical Data</h3>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Updated: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
              <button 
                onClick={() => {
                  refreshAll();
                  setIsLoading(true);
                  // Refetch historical data after a short delay to allow the environment data to update
                  setTimeout(() => {
                    if (latitude && longitude) {
                      fetch(`/api/historical-aqi?latitude=${latitude}&longitude=${longitude}&period=${activeTab}`)
                        .then(res => res.json())
                        .then(historicalData => {
                          setData(historicalData);
                          setIsLoading(false);
                        })
                        .catch(err => {
                          console.error("Error refreshing historical data:", err);
                          setIsLoading(false);
                        });
                    }
                  }, 500);
                }} 
                className="p-1.5 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                title="Refresh all data"
              >
                <RefreshCw className="h-4 w-4 text-primary" />
              </button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 glass-morphism">
              <TabsTrigger 
                value="daily"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-glow-sm transition-all duration-300"
              >
                Daily
              </TabsTrigger>
              <TabsTrigger 
                value="weekly"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-glow-sm transition-all duration-300"
              >
                Weekly
              </TabsTrigger>
              <TabsTrigger 
                value="monthly"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-glow-sm transition-all duration-300"
              >
                Monthly
              </TabsTrigger>
            </TabsList>
          
            <AnimatePresence mode="wait">
              {["daily", "weekly", "monthly"].map((period) => (
                <TabsContent key={period} value={period} className="space-y-4">
                  {isLoading ? (
                    <motion.div 
                      className="flex justify-center items-center h-64"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="space-y-6">
                        <motion.div variants={itemVariants}>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <h4 className="text-sm font-medium text-muted-foreground">Air Quality Index</h4>
                          </div>
                          <div className="h-64 w-full glass-morphism rounded-xl p-2 border border-border/30">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 12 }} 
                                  tickMargin={10}
                                  stroke="currentColor"
                                  strokeOpacity={0.4}
                                />

                                <Line 
                                  type="monotone" 
                                  dataKey="aqi_eu" 
                                  name="AQI (EU)"
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  dot={{ r: 3, strokeWidth: 0, fill: "#3b82f6" }}
                                  activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
                                  animationDuration={1500}
                                  animationBegin={300}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="aqi_us" 
                                  name="AQI (US)"
                                  stroke="#f59e0b" 
                                  strokeWidth={2}
                                  dot={{ r: 3, strokeWidth: 0, fill: "#f59e0b" }}
                                  activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }}
                                  animationDuration={1500}
                                  animationBegin={600}
                                />
                                <Legend 
                                  verticalAlign="top" 
                                  height={36}
                                  iconType="circle"
                                  iconSize={8}
                                  wrapperStyle={{ fontSize: '12px' }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>
                        
                        <motion.div variants={itemVariants}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                              <Thermometer className="h-4 w-4 text-red-500" />
                              <Droplets className="h-4 w-4 text-blue-500" />
                            </div>
                            <h4 className="text-sm font-medium text-muted-foreground">Temperature & Humidity</h4>
                          </div>
                          <div className="h-64 w-full glass-morphism rounded-xl p-2 border border-border/30">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 12 }} 
                                  tickMargin={10}
                                  stroke="currentColor"
                                  strokeOpacity={0.4}
                                />

                                <YAxis 
                                  yAxisId="temp"
                                  tick={{ fontSize: 12 }} 
                                  tickMargin={10}
                                  stroke="currentColor"
                                  strokeOpacity={0.4}
                                  domain={[0, 40]}
                                />
                                <YAxis 
                                  yAxisId="humidity"
                                  orientation="right"
                                  tick={{ fontSize: 12 }} 
                                  tickMargin={10}
                                  stroke="currentColor"
                                  strokeOpacity={0.4}
                                  domain={[0, 100]}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                  yAxisId="temp"
                                  type="monotone" 
                                  dataKey="temperature" 
                                  name="Temperature (°C)"
                                  stroke="#ef4444" 
                                  strokeWidth={2}
                                  dot={{ r: 3, strokeWidth: 0, fill: "#ef4444" }}
                                  activeDot={{ r: 6, strokeWidth: 0, fill: "#ef4444" }}
                                  animationDuration={1500}
                                />
                                <Line 
                                  yAxisId="humidity"
                                  type="monotone" 
                                  dataKey="humidity" 
                                  name="Humidity (%)"
                                  stroke="#06b6d4" 
                                  strokeWidth={2}
                                  dot={{ r: 3, strokeWidth: 0, fill: "#06b6d4" }}
                                  activeDot={{ r: 6, strokeWidth: 0, fill: "#06b6d4" }}
                                  animationDuration={1500}
                                  animationBegin={300}
                                />
                                <Legend 
                                  verticalAlign="top" 
                                  height={36}
                                  iconType="circle"
                                  iconSize={8}
                                  wrapperStyle={{ fontSize: '12px' }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          variants={itemVariants}
                          className="glass-morphism rounded-xl p-4 border border-border/30 shadow-glow-sm"
                        >
                          <h4 className="text-sm font-medium mb-3">Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <motion.div 
                              whileHover={{ scale: 1.03 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <p className="text-muted-foreground mb-1">Average AQI</p>
                              <p className="font-medium text-lg">
                                {Math.round(data.reduce((sum, point) => sum + (point.aqi_eu || 0), 0) / data.length)}
                              </p>
                            </motion.div>
                            <motion.div 
                              whileHover={{ scale: 1.03 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <p className="text-muted-foreground mb-1">Max AQI</p>
                              <p className="font-medium text-lg">
                                {Math.max(...data.map(point => point.aqi_eu || 0))}
                              </p>
                            </motion.div>
                            <motion.div 
                              whileHover={{ scale: 1.03 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <p className="text-muted-foreground mb-1">Average PM2.5</p>
                              <p className="font-medium text-lg">
                                {Math.round(data.reduce((sum, point) => sum + (point.pm25 || 0), 0) / data.length)} μg/m³
                              </p>
                            </motion.div>
                            <motion.div 
                              whileHover={{ scale: 1.03 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <p className="text-muted-foreground mb-1">Average Temperature</p>
                              <p className="font-medium text-lg">
                                {(Math.round(data.reduce((sum, point) => sum + (point.temperature || 0), 0) / data.length * 10) / 10)}°C
                              </p>
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </TabsContent>
              ))}
            </AnimatePresence>
          </Tabs>
        </div>
      </Card>
    </motion.div>
  );
}
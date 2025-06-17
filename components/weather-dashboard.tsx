import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useAnimation, useInView, Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Wind, Droplets, Thermometer, Sun, Sunrise, Sunset, Cloud, CloudRain, 
  CloudLightning, AlertTriangle, RefreshCw, Umbrella, Gauge, Eye, 
  ChevronDown, ChevronUp, Calendar, Clock, Zap, Snowflake, Compass, MapPin } from "lucide-react";
import { useEnvironment } from "@/contexts/environment-context";
import { WeatherData, ForecastDay } from "@/hooks/use-weather";
import Image from "next/image";

// Enhanced animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      delay: custom * 0.1,
    },
  }),
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      delay: custom * 0.1,
    },
  }),
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      delay: custom * 0.1,
    },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const pulseAnimation: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const floatAnimation: Variants = {
  float: {
    y: ["-2%", "2%", "-2%"],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const weatherIconAnimation: Variants = {
  hidden: { scale: 0, opacity: 0, rotate: -10 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
      delay: 0.2,
    },
  },
  hover: {
    scale: 1.1,
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 0.5,
    },
  },
};

const gaugeAnimation: Variants = {
  hidden: { opacity: 0, pathLength: 0 },
  visible: (custom: number) => ({
    opacity: 1,
    pathLength: custom,
    transition: { delay: 0.3, duration: 1.5, ease: "easeInOut" },
  }),
};

const cardHoverAnimation: Variants = {
  initial: { boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" },
  hover: {
    y: -5,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { type: "spring", stiffness: 400, damping: 17 },
  },
};

const forecastItemAnimation: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      delay: custom * 0.05,
    },
  }),
  hover: {
    x: 5,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transition: { duration: 0.2 },
  },
};

const pathAnimation: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: "spring", duration: 1.5, bounce: 0 },
      opacity: { duration: 0.3 },
    },
  },
};

const shimmerAnimation: Variants = {
  animate: {
    backgroundPosition: ["-200%", "200%"],
    transition: {
      repeat: Infinity,
      repeatType: "mirror",
      duration: 2,
      ease: "linear"
    }
  }
};

const glowAnimation: Variants = {
  glow: {
    boxShadow: [
      "0 0 5px rgba(59, 130, 246, 0.3)",
      "0 0 20px rgba(59, 130, 246, 0.5)",
      "0 0 5px rgba(59, 130, 246, 0.3)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const rippleAnimation: Variants = {
  ripple: {
    scale: [1, 1.5],
    opacity: [0.6, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeOut"
    }
  }
};

// Helper function to format time
const formatTime = (hour: number) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}${ampm}`;
};

// Helper function to get AQI color
const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return "#4ade80"; // Good - Green
  if (aqi <= 100) return "#facc15"; // Moderate - Yellow
  if (aqi <= 150) return "#fb923c"; // Unhealthy for Sensitive Groups - Orange
  if (aqi <= 200) return "#ef4444"; // Unhealthy - Red
  if (aqi <= 300) return "#8b5cf6"; // Very Unhealthy - Purple
  return "#7f1d1d"; // Hazardous - Dark Red
};

// Helper function to get AQI text
const getAQIText = (aqi: number) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

// Define the type for the locationData prop
type LocationData = {
  name: string;
  state?: string;
  country?: string;
  fullName: string;
} | null;

interface WeatherDashboardProps {
  locationData?: LocationData;
}

export function WeatherDashboard({ locationData }: WeatherDashboardProps) {
  const {
    // Location data
    latitude,
    longitude,
    locationError,
    locationLoading,

    // Weather data
    weatherData,
    weatherLoading,
    weatherError,
    refreshWeather,

    // Combined states
    isLoading,
    hasError,
    lastUpdated,
    refreshAll,
  } = useEnvironment();

  const loading = isLoading || weatherLoading;
  const error = locationError || weatherError;

  // Animation controls
  const controls = useAnimation();
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  // Weather icon animation
  const [isAnimating, setIsAnimating] = useState(false);
  const [expandedForecast, setExpandedForecast] = useState(false);
  const [selectedForecastDay, setSelectedForecastDay] = useState<number | null>(null);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  useEffect(() => {
    // Trigger weather icon animation periodically
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Format time for last updated
  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 60000); // minutes

    if (diff < 1) return "just now";
    if (diff === 1) return "1 minute ago";
    if (diff < 60) return `${diff} minutes ago`;

    const hours = Math.floor(diff / 60);
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  };

  // Loading state with beautiful animation
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div
            className="relative w-24 h-24 mb-8"
          >
            {/* Multiple animated rings */}
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-${70 - (i * 20)}`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7 - (i * 0.2), 0.3 - (i * 0.1), 0.7 - (i * 0.2)]
                }}
                transition={{
                  duration: 2 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
                style={{ filter: `blur(${4 + i * 2}px)` }}
              />
            ))}
            
            <motion.div
              animate={{
                rotate: 360,
                transition: { duration: 3, repeat: Infinity, ease: "linear" },
              }}
              className="h-24 w-24 rounded-full flex items-center justify-center relative z-10"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: [0.8, 1.1, 0.8],
                  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <RefreshCw className="h-12 w-12 text-primary" />
              </motion.div>
            </motion.div>
          </motion.div>
          
          <motion.div
            className="h-3 w-64 rounded-full overflow-hidden bg-slate-200/10 relative mb-5"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: "easeInOut" 
              }}
            />
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="text-primary/80 font-medium text-lg"
          >
            Loading weather data...
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground mt-2"
          >
            Fetching the latest environmental information
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Error state with improved visuals
  if (error) {
    // Check if the error is related to location
    const isLocationError = error.toLowerCase().includes("location") || 
                           error.toLowerCase().includes("geolocation") || 
                           locationError !== null;
    
    // Use location error message if available, otherwise use the general error
    const displayError = locationError || error;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 text-center max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col items-center justify-center gap-4 mb-6"
        >
          <motion.div
            className="relative w-24 h-24 mb-2"
          >
            {/* Multiple animated rings */}
            {[1, 2].map((i) => (
              <motion.div 
                key={i}
                className={`absolute inset-0 rounded-full bg-${isLocationError ? "blue" : "amber"}-500/${30 - (i * 10)} opacity-${70 - (i * 20)}`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5 - (i * 0.2), 0.3 - (i * 0.1), 0.5 - (i * 0.2)]
                }}
                transition={{
                  duration: 2 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
                style={{ filter: `blur(${4 + i * 2}px)` }}
              />
            ))}
            
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                transition: { duration: 1, repeat: Infinity, repeatDelay: 1 },
              }}
              className="h-24 w-24 rounded-full flex items-center justify-center relative z-10"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: [0.8, 1.1, 0.8],
                  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                {isLocationError ? (
                  <MapPin className="h-14 w-14 text-blue-500" />
                ) : (
                  <AlertTriangle className="h-14 w-14 text-amber-500" />
                )}
              </motion.div>
            </motion.div>
          </motion.div>
          
          <h3 className="text-2xl font-semibold text-foreground">
            {isLocationError ? "Location Services Unavailable" : "Weather Data Unavailable"}
          </h3>
        </motion.div>
        
        <motion.div 
          className="bg-card/50 backdrop-blur-sm p-8 rounded-xl border border-border/50 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-muted-foreground mb-4">{displayError}</p>
          
          {isLocationError && (
            <div className="mb-6 text-sm bg-blue-950/30 p-4 rounded-lg border border-blue-500/20">
              <h4 className="font-medium text-blue-400 mb-2">Troubleshooting Tips:</h4>
              <ul className="text-left space-y-2 text-white/70">
                <li>• Make sure location services are enabled in your browser settings</li>
                <li>• Try refreshing the page and allowing location access when prompted</li>
                <li>• If using a mobile device, check your device location settings</li>
                <li>• Try using a different browser or device</li>
              </ul>
            </div>
          )}
          
          {!locationLoading && (
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary), 0.9)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refreshAll()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mx-auto shadow-lg"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Weather Data
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    );
  }

  if (!weatherData) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Weather data unavailable</p>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      variants={staggerContainer}
      initial="hidden"
      animate={controls}
      className="weather-dashboard grid grid-cols-1 lg:grid-cols-1 gap-5 lg:gap-6 xl:gap-8 max-w-[1200px] mx-auto px-2 md:px-4 lg:px-6"
    >
      {/* Main Weather Card - Redesigned with better visuals */}
      <motion.div variants={fadeInUp} custom={0} className="w-full">
        <motion.div whileHover="hover" variants={cardHoverAnimation} initial="initial">
          <Card className="weather-card main-card h-full bg-gradient-to-br from-blue-800/90 via-blue-900/95 to-indigo-950/90 text-white overflow-hidden relative p-6 border-0 shadow-xl rounded-3xl">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Dynamic weather background elements */}
              {weatherData.icon === 'clear-day' && (
                <>
                  <motion.div 
                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-yellow-400/20 blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                      rotate: [0, 45, 0]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </>
              )}
              
              {weatherData.icon === 'rain' && (
                <>
                  <motion.div 
                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-blue-400/20 blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                      y: [0, 10, 0]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </>
              )}
              
              {/* Default background elements */}
              <motion.div 
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                  rotate: [0, 45, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.4, 0.6, 0.4],
                  rotate: [45, 0, 45]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <motion.div variants={weatherIconAnimation} className="weather-icon-container mb-4">
                    <motion.div
                      animate={isAnimating ? {
                        y: [0, -10, 0],
                        scale: [1, 1.1, 1],
                        transition: { duration: 1 }
                      } : {}}
                      whileHover="hover"
                      className="weather-icon-wrapper p-5 bg-white/10 backdrop-blur-md rounded-full inline-block shadow-lg"
                    >
                      {weatherData.icon === 'clear-day' && <Sun className="h-14 w-14 text-yellow-300" />}
                      {weatherData.icon === 'clear-night' && <Sun className="h-14 w-14 text-blue-100" />}
                      {weatherData.icon === 'partly-cloudy-day' && <Cloud className="h-14 w-14 text-white/90" />}
                      {weatherData.icon === 'partly-cloudy-night' && <Cloud className="h-14 w-14 text-blue-100/90" />}
                      {weatherData.icon === 'cloudy' && <Cloud className="h-14 w-14 text-white/90" />}
                      {weatherData.icon === 'rain' && <CloudRain className="h-14 w-14 text-white/90" />}
                      {weatherData.icon === 'thunderstorm' && <CloudLightning className="h-14 w-14 text-yellow-300" />}
                      {weatherData.icon === 'snow' && <Snowflake className="h-14 w-14 text-blue-100" />}
                      {!['clear-day', 'clear-night', 'partly-cloudy-day', 'partly-cloudy-night', 'cloudy', 'rain', 'thunderstorm', 'snow'].includes(weatherData.icon) && (
                        <Cloud className="h-14 w-14 text-white/90" />
                      )}
                    </motion.div>
                  </motion.div>

                  <motion.h1
                    variants={fadeInUp}
                    custom={1}
                    className="text-6xl font-bold mb-1 flex items-end"
                  >
                    {weatherData.temperature}
                    <span className="text-3xl font-normal ml-1">°C</span>
                  </motion.h1>

                  <motion.p
                    variants={fadeInUp}
                    custom={2}
                    className="text-xl text-white/90 font-medium"
                  >
                    {weatherData.condition}
                  </motion.p>
                </div>

                <motion.div
                  variants={fadeInUp}
                  custom={1}
                  className="text-right"
                >
                  <p className="text-sm text-white/70 font-medium">{weatherData.date}</p>
                  <div className="flex items-center justify-end mt-2">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      onClick={() => refreshWeather()}
                      className="cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3 text-white/50 mr-1 hover:text-white/80 transition-colors" />
                    </motion.div>
                    <p className="text-xs text-white/50">Updated {formatLastUpdated()}</p>
                  </div>
                </motion.div>
              </div>

              {/* Location Info - Enhanced */}
              <motion.div
                variants={fadeInUp}
                custom={3}
                className="location-info mt-8 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <motion.div className="flex items-center gap-2">
                    <motion.div
                      className="relative"
                    >
                      <motion.div
                        className="absolute -inset-1 rounded-full bg-green-400/30 blur-sm"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <Compass className="h-5 w-5 text-green-400 relative z-10" />
                    </motion.div>
                    <div>
                      {locationData ? (
                        <p className="text-sm font-medium">
                          {locationData.fullName || `${locationData.name}${locationData.country ? `, ${locationData.country}` : ''}`}
                        </p>
                      ) : (
                        <p className="text-sm font-medium">{weatherData.location}, {weatherData.country}</p>
                      )}
                      <p className="text-xs text-white/60">Lat: {latitude?.toFixed(4)} | Long: {longitude?.toFixed(4)}</p>
                    </div>
                  </motion.div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <Wind className="h-3 w-3 text-blue-300 mr-1" />
                      <span className="text-xs">{weatherData.windSpeed} km/h</span>
                    </div>
                    <div className="flex items-center">
                      <Droplets className="h-3 w-3 text-blue-300 mr-1" />
                      <span className="text-xs">{weatherData.humidity}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Today's Highlight Section - Improved grid layout */}
              <motion.div
                variants={fadeInUp}
                custom={4}
                className="highlights mt-6"
              >
                <h2 className="text-lg font-medium mb-3 flex items-center">
                  <span className="inline-block w-1 h-4 bg-blue-400 rounded-full mr-2"></span>
                  Today's Highlights
                </h2>
                <motion.div className="grid grid-cols-2 gap-3">
                  {/* UV Index */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="highlight-card p-3 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10"
                  >
                    <p className="text-xs text-white/70 mb-2">UV Index</p>
                    <div className="flex items-center justify-between">
                      <div className="uv-gauge relative h-10 w-10">
                        <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                          <motion.path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <motion.path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#60a5fa"
                            strokeWidth="3"
                            strokeLinecap="round"
                            variants={gaugeAnimation}
                            custom={Math.min(weatherData.uvIndex / 12, 1)}
                            initial="hidden"
                            animate="visible"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-medium">{weatherData.uvIndex}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {weatherData.uvIndex < 3 ? 'Low' :
                            weatherData.uvIndex < 6 ? 'Moderate' :
                              weatherData.uvIndex < 8 ? 'High' :
                                weatherData.uvIndex < 11 ? 'Very High' : 'Extreme'}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Sunrise & Sunset - Enhanced with gradient */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="highlight-card p-3 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10"
                  >
                    <p className="text-xs text-white/70 mb-2">Sunrise & Sunset</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <motion.div
                            animate={{
                              rotate: [0, 10, 0],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <Sunrise className="h-4 w-4 text-amber-300 mr-1" />
                          </motion.div>
                          <span className="text-xs">Rise</span>
                        </div>
                        <p className="text-sm font-medium">{weatherData.sunrise}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <motion.div
                            animate={{
                              rotate: [0, -10, 0],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <Sunset className="h-4 w-4 text-amber-500 mr-1" />
                          </motion.div>
                          <span className="text-xs">Set</span>
                        </div>
                        <p className="text-sm font-medium">{weatherData.sunset}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Humidity - With animated indicator */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="highlight-card p-3 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10"
                  >
                    <p className="text-xs text-white/70 mb-2">Humidity</p>
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <motion.div 
                          className="absolute -inset-1 rounded-full bg-blue-400/20 blur-sm"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.7, 0.5]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <Droplets className="h-5 w-5 text-blue-400 relative z-10" />
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{weatherData.humidity}<span className="text-sm">%</span></p>
                        <p className="text-xs text-white/70">
                          {weatherData.humidity < 30 ? 'Low' :
                            weatherData.humidity < 60 ? 'Normal' : 'High'}
                        </p>
                      </div>
                    </div>
                    {/* Humidity progress bar */}
                    <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${weatherData.humidity}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </motion.div>

                  {/* Visibility */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="highlight-card p-3 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10"
                  >
                    <p className="text-xs text-white/70 mb-2">Visibility</p>
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <motion.div 
                          className="absolute -inset-1 rounded-full bg-indigo-400/20 blur-sm"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.7, 0.5]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <Eye className="h-5 w-5 text-indigo-400 relative z-10" />
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{weatherData.visibility}<span className="text-sm">km</span></p>
                        <p className="text-xs text-white/70">
                          {weatherData.visibility < 2 ? 'Poor' :
                            weatherData.visibility < 5 ? 'Moderate' : 'Good'}
                        </p>
                      </div>
                    </div>
                    {/* Visibility progress bar */}
                    <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(weatherData.visibility / 10 * 100, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </motion.div>

                  {/* Feels Like */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="highlight-card p-3 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10"
                  >
                    <p className="text-xs text-white/70 mb-2">Feels Like</p>
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <motion.div 
                          className="absolute -inset-1 rounded-full bg-red-400/20 blur-sm"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.7, 0.5]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <Thermometer className="h-5 w-5 text-red-400 relative z-10" />
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{weatherData.feelsLike}<span className="text-sm">°C</span></p>
                        <p className="text-xs text-white/70">
                          {weatherData.feelsLike > weatherData.temperature ? 'Warmer' : 
                           weatherData.feelsLike < weatherData.temperature ? 'Cooler' : 'Same'}
                        </p>
                      </div>
                    </div>
                    {/* Temperature difference indicator */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-white/50">Actual</span>
                      <div className="h-1 flex-1 mx-2 bg-white/10 rounded-full relative">
                        <motion.div 
                          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white"
                          initial={{ left: '50%' }}
                          animate={{ 
                            left: `${50 + (weatherData.feelsLike - weatherData.temperature) * 5}%`,
                            backgroundColor: weatherData.feelsLike > weatherData.temperature ? '#f87171' : '#60a5fa'
                          }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <span className="text-xs text-white/50">Feels</span>
                    </div>
                  </motion.div>

                  {/* Wind - With rotating animation */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="highlight-card p-3 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10"
                  >
                    <p className="text-xs text-white/70 mb-2">Wind</p>
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <motion.div 
                          className="absolute -inset-1 rounded-full bg-sky-400/20 blur-sm"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.7, 0.5]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="relative z-10"
                        >
                          <Wind className="h-5 w-5 text-sky-400" />
                        </motion.div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{weatherData.windSpeed}<span className="text-sm">km/h</span></p>
                        <p className="text-xs text-white/70">
                          {weatherData.windSpeed < 5 ? 'Calm' :
                            weatherData.windSpeed < 15 ? 'Light' :
                              weatherData.windSpeed < 30 ? 'Moderate' : 'Strong'}
                        </p>
                      </div>
                    </div>
                    {/* Wind direction indicator */}
                    <div className="mt-2 flex justify-center">
                      <motion.div 
                        className="h-6 w-6 rounded-full bg-sky-400/10 flex items-center justify-center"
                        animate={{ rotate: weatherData.windDirection || 0 }}
                        transition={{ duration: 1 }}
                      >
                        <motion.div className="h-4 w-0.5 bg-sky-400 rounded-full transform -translate-y-1" />
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* 7 Days Forecast - Enhanced with better visuals */}
              <motion.div
                variants={fadeInUp}
                custom={5}
                className="forecast mt-6 pt-4 border-t border-white/10"
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-medium flex items-center">
                    <span className="inline-block w-1 h-4 bg-blue-400 rounded-full mr-2"></span>
                    7 Days Forecast
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setExpandedForecast(!expandedForecast)}
                    className="text-xs flex items-center gap-1 text-white/70 hover:text-white/90 transition-colors bg-white/5 px-2 py-1 rounded-full"
                  >
                    {expandedForecast ? "Collapse" : "Expand"}
                    {expandedForecast ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </motion.button>
                </div>

                <AnimatePresence>
                  <motion.div
                    initial={{ height: expandedForecast ? "auto" : "12rem" }}
                    animate={{ height: expandedForecast ? "auto" : "12rem" }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {weatherData.forecast && weatherData.forecast.map((day: ForecastDay, index: number) => (
                      <motion.div
                        key={day.date}
                        variants={forecastItemAnimation}
                        custom={index}
                        whileHover="hover"
                        onClick={() => setSelectedForecastDay(selectedForecastDay === index ? null : index)}
                        className={`forecast-day flex items-center justify-between py-2 px-3 rounded-lg border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer ${selectedForecastDay === index ? 'bg-white/10' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="forecast-icon p-1.5 bg-white/10 rounded-full"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            animate={selectedForecastDay === index ? {
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, 0],
                              transition: { duration: 1, repeat: Infinity }
                            } : {}}
                          >
                            {day.icon === 'clear-day' && <Sun className="h-4 w-4 text-yellow-300" />}
                            {day.icon === 'clear-night' && <Sun className="h-4 w-4 text-blue-100" />}
                            {day.icon === 'partly-cloudy-day' && <Cloud className="h-4 w-4 text-gray-300" />}
                            {day.icon === 'partly-cloudy-night' && <Cloud className="h-4 w-4 text-blue-100" />}
                            {day.icon === 'cloudy' && <Cloud className="h-4 w-4 text-gray-300" />}
                            {day.icon === 'rain' && <CloudRain className="h-4 w-4 text-blue-300" />}
                            {day.icon === 'thunderstorm' && <CloudLightning className="h-4 w-4 text-yellow-300" />}
                            {day.icon === 'snow' && <Snowflake className="h-4 w-4 text-blue-100" />}
                            {!['clear-day', 'clear-night', 'partly-cloudy-day', 'partly-cloudy-night', 'cloudy', 'rain', 'thunderstorm', 'snow'].includes(day.icon) && (
                              <Cloud className="h-4 w-4 text-gray-300" />
                            )}
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium">+{day.temperature.max}°/+{day.temperature.min}°</p>
                            <p className="text-xs text-white/60">{day.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{day.day}</p>
                          {(expandedForecast || selectedForecastDay === index) && (
                            <motion.div 
                              className="flex items-center gap-2 mt-1"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center">
                                <Droplets className="h-3 w-3 text-blue-300 mr-1" />
                                <span className="text-xs">{day.precipitation_probability}%</span>
                              </div>
                              <div className="flex items-center">
                                <Wind className="h-3 w-3 text-blue-300 mr-1" />
                                <span className="text-xs">{day.wind_speed} km/h</span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      {/* Additional Weather Information - Weather Details */}
      <motion.div variants={fadeInUp} custom={1} className="w-full">
        <div className="header flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium flex items-center">
            <span className="inline-block w-1 h-4 bg-blue-400 rounded-full mr-2"></span>
            Weather Details
          </h2>
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-xs px-2 py-1 bg-primary/20 rounded-full text-primary border border-primary/30"
              animate={{
                boxShadow: ['0 0 0px rgba(var(--primary), 0.3)', '0 0 8px rgba(var(--primary), 0.6)', '0 0 0px rgba(var(--primary), 0.3)'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Current
            </motion.span>
            <motion.button
              onClick={() => {
                // @ts-ignore - Call the global function
                if (window.openEnvironmentTab) {
                  // Using window.location to navigate to environment tab
                  window.location.href = '/environment';
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs px-2 py-1 bg-green-500/20 rounded-full text-green-400 border border-green-500/30 flex items-center gap-1 cursor-pointer"
            >
              <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              View Environment
            </motion.button>
          </div>
        </div>
        <Card className="weather-card details-card bg-gradient-to-br from-slate-800/90 to-slate-900/95 text-white p-6 border-0 shadow-xl rounded-2xl overflow-hidden relative h-[300px]">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"
              animate={{
                x: [0, 20, 0],
                y: [0, -20, 0],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl"
              animate={{
                x: [0, -20, 0],
                y: [0, 20, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 h-full relative z-10">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                className="p-3 bg-gradient-to-br from-slate-700/30 to-slate-700/20 rounded-xl border border-slate-600/20"
              >
                <h3 className="text-sm font-medium text-white/80 mb-2">Air Pressure</h3>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/20 rounded-full">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                        <path d="M12 22V2" /><path d="M17 5H7" /><path d="M17 19H7" />
                      </svg>
                    </motion.div>
                  </div>
                  <div>
                    <span className="text-xl font-bold">{weatherData.pressure}</span>
                    <span className="text-sm ml-1">hPa</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="p-3 bg-gradient-to-br from-slate-700/30 to-slate-700/20 rounded-xl border border-slate-600/20"
              >
                <h3 className="text-sm font-medium text-white/80 mb-2">Cloud Cover</h3>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 rounded-full">
                    <motion.div
                      animate={{ 
                        y: [0, -3, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Cloud className="h-5 w-5 text-blue-400" />
                    </motion.div>
                  </div>
                  <div>
                    <span className="text-xl font-bold">{weatherData.cloudCover}</span>
                    <span className="text-sm ml-1">%</span>
                  </div>
                </div>
                {/* Cloud cover progress bar */}
                <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-400/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${weatherData.cloudCover}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                className="p-3 bg-gradient-to-br from-slate-700/30 to-slate-700/20 rounded-xl border border-slate-600/20"
              >
                <h3 className="text-sm font-medium text-white/80 mb-2">Precipitation</h3>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-500/20 rounded-full">
                    <motion.div
                      animate={{ 
                        y: [0, 3, 0],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <CloudRain className="h-5 w-5 text-cyan-400" />
                    </motion.div>
                  </div>
                  <div>
                    <span className="text-xl font-bold">{weatherData.precipitation}</span>
                    <span className="text-sm ml-1">mm</span>
                  </div>
                </div>
                {/* Precipitation indicator */}
                <div className="mt-2 relative h-6 bg-gradient-to-r from-blue-400/10 to-blue-500/20 rounded-lg overflow-hidden">
                  {weatherData.precipitation > 0 && (
                    <motion.div 
                      className="absolute inset-0 flex items-end justify-around"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      {[...Array(8)].map((_, i) => (
                        <motion.div 
                          key={i}
                          className="w-0.5 bg-cyan-400 rounded-full"
                          style={{ height: `${Math.random() * 100}%` }}
                          animate={{ 
                            height: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            opacity: [0.5, 0.8, 0.5]
                          }}
                          transition={{ 
                            duration: 1 + Math.random(),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="p-3 bg-gradient-to-br from-slate-700/30 to-slate-700/20 rounded-xl border border-slate-600/20"
              >
                <h3 className="text-sm font-medium text-white/80 mb-2">Day/Night</h3>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/20 rounded-full">
                    {weatherData.isDay ?
                      <motion.div
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                        }}
                      >
                        <Sun className="h-5 w-5 text-amber-400" />
                      </motion.div> :
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300">
                          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        </svg>
                      </motion.div>
                    }
                  </div>
                  <div>
                    <span className="text-xl font-bold">{weatherData.isDay ? "Day" : "Night"}</span>
                  </div>
                </div>
                {/* Day/Night indicator */}
                <div className="mt-2 h-6 w-full bg-gradient-to-r from-amber-400/20 via-blue-400/20 to-indigo-500/20 rounded-lg overflow-hidden relative">
                  <motion.div 
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-400/50 to-amber-500/50"
                    style={{ 
                      width: '50%', 
                      left: weatherData.isDay ? '0%' : '50%',
                      borderRadius: weatherData.isDay ? '6px 0 0 6px' : '0 6px 6px 0'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-2">
                    <span className="text-xs font-medium text-amber-200">Day</span>
                    <span className="text-xs font-medium text-blue-200">Night</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tomorrow's Forecast with Temperature Graph - Moved directly under Weather Details */}
      <motion.div variants={fadeInUp} custom={1.5} className="lg:col-span-7 mt-4">
        <div className="header flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium flex items-center">
            <span className="inline-block w-1 h-4 bg-blue-400 rounded-full mr-2"></span>
            Tomorrow's Forecast
          </h2>
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-xs px-2 py-1 bg-primary/20 rounded-full text-primary border border-primary/30 flex items-center gap-1"
              animate={{
                boxShadow: ['0 0 0px rgba(var(--primary), 0.3)', '0 0 8px rgba(var(--primary), 0.6)', '0 0 0px rgba(var(--primary), 0.3)'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Calendar className="h-3 w-3" />
              Tomorrow
            </motion.span>
          </div>
        </div>
        <Card className="weather-card forecast-card bg-gradient-to-br from-slate-800/90 to-slate-900/95 text-white p-6 border-0 shadow-xl rounded-2xl overflow-hidden relative">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"
              animate={{
                x: [0, 20, 0],
                y: [0, -20, 0],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl"
              animate={{
                x: [0, -20, 0],
                y: [0, 20, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          <div className="relative z-10">
            {/* Temperature Graph */}
            <div className="temperature-graph h-40 mb-6 relative">
              {/* Graph background */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-700/20 to-slate-700/5 rounded-xl border border-slate-600/20"></div>
              
              {/* Graph content */}
              <div className="absolute inset-0 p-4">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-white/50">
                  <span>30°</span>
                  <span>20°</span>
                  <span>10°</span>
                  <span>0°</span>
                </div>
                
                {/* Graph area */}
                <div className="absolute left-10 right-4 top-0 bottom-0">
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="absolute w-full h-px bg-white/10" 
                      style={{ top: `${i * 33.33}%` }}
                    />
                  ))}
                  
                  {/* Temperature path */}
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Gradient for the path */}
                    <defs>
                      <linearGradient id="temp-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                      </linearGradient>
                    </defs>
                    
                    {/* Area under the curve */}
                    <motion.path
                      d="M0,70 C10,65 20,55 30,50 C40,45 50,48 60,52 C70,56 80,62 90,58 L90,100 L0,100 Z"
                      fill="url(#temp-gradient)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                    
                    {/* Temperature line */}
                    <motion.path
                      d="M0,70 C10,65 20,55 30,50 C40,45 50,48 60,52 C70,56 80,62 90,58"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      variants={pathAnimation}
                      initial="hidden"
                      animate="visible"
                    />
                    
                    {/* Temperature points */}
                    {[0, 30, 60, 90].map((x, i) => {
                      const y = [70, 50, 52, 58][i];
                      return (
                        <motion.circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#3b82f6"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 + (i * 0.1) }}
                        />
                      );
                    })}
                  </svg>
                  
                  {/* Time markers */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-white/50 pt-2 border-t border-white/10">
                    <span>12AM</span>
                    <span>6AM</span>
                    <span>12PM</span>
                    <span>6PM</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hourly forecast */}
            <div className="hourly-forecast grid grid-cols-4 gap-2">
              {["Morning", "Afternoon", "Evening", "Night"].map((time, i) => (
                <motion.div
                  key={time}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  whileHover={{ scale: 1.05 }}
                  className="p-3 bg-gradient-to-br from-slate-700/30 to-slate-700/20 rounded-xl border border-slate-600/20 text-center"
                >
                  <p className="text-xs text-white/70 mb-2">{time}</p>
                  <div className="flex justify-center mb-2">
                    <motion.div
                      className="p-2 bg-blue-500/20 rounded-full"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                    >
                      {i === 0 && <Sun className="h-5 w-5 text-yellow-400" />}
                      {i === 1 && <Sun className="h-5 w-5 text-yellow-400" />}
                      {i === 2 && <Sunset className="h-5 w-5 text-amber-400" />}
                      {i === 3 && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300">
                          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        </svg>
                      )}
                    </motion.div>
                  </div>
                  <p className="text-lg font-bold">{[22, 28, 25, 20][i]}°</p>
                  <div className="flex justify-center gap-2 mt-1">
                    <div className="flex items-center">
                      <Droplets className="h-3 w-3 text-blue-300 mr-1" />
                      <span className="text-xs">{[10, 5, 15, 20][i]}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Location Labels */}
      <div className="absolute bottom-6 left-6">
        <motion.div className="relative inline-block">
          <motion.div 
            className="absolute -inset-1 rounded-full bg-green-400/20 blur-sm"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="relative z-10 flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-950/50 backdrop-blur-sm px-2 py-1 rounded-full border border-green-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
            Your Location
          </motion.div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-6 right-6">
        <motion.div className="relative inline-block">
          <motion.div 
            className="absolute -inset-1 rounded-full bg-blue-400/20 blur-sm"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="relative z-10 flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-950/50 backdrop-blur-sm px-2 py-1 rounded-full border border-blue-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            Nearby Area
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  </motion.div>
  );
}
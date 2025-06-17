"use client"

import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
// Fixed import with available icons
import { 
  AlertTriangle, 
  Info, 
  Shield, 
  Wind, 
  Droplets, 
  Sun, 
  CloudRain, 
  Umbrella, 
  Home, 
  Users, 
  Activity, 
  Heart, 
  Thermometer 
} from "lucide-react";

interface RecommendationsProps {
  aqi: number | null;
  loading?: boolean;
}

export function Recommendations({ aqi, loading = false }: RecommendationsProps) {
  // Function to get recommendations based on AQI with icons and categories
  const getRecommendations = (aqi: number) => {
    if (aqi <= 50) {
      return [
        { 
          icon: <Sun className="h-5 w-5 text-green-500" />,
          category: "Outdoor Activities",
          text: "Air quality is good. Enjoy outdoor activities and exercise."
        },
        { 
          icon: <Wind className="h-5 w-5 text-green-500" />,
          category: "Air Quality",
          text: "Perfect air conditions with minimal pollutants present."
        },
        { 
          icon: <Heart className="h-5 w-5 text-green-500" />,
          category: "Health Impact",
          text: "No health impacts expected. Suitable for everyone."
        }
      ];
    } else if (aqi <= 100) {
      return [
        { 
          icon: <Users className="h-5 w-5 text-yellow-500" />,
          category: "Sensitive Groups",
          text: "Unusually sensitive people should consider reducing prolonged outdoor exertion."
        },
        { 
          icon: <Home className="h-5 w-5 text-yellow-500" />,
          category: "Indoor Recommendation",
          text: "Keep windows closed during peak traffic hours to maintain indoor air quality."
        },
        { 
          icon: <Activity className="h-5 w-5 text-yellow-500" />,
          category: "Activity Level",
          text: "Moderate activities are fine for most people. Stay hydrated."
        }
      ];
    } else if (aqi <= 150) {
      return [
        { 
          icon: <Wind className="h-5 w-5 text-orange-500" />,
          category: "Sensitive Groups",
          text: "People with respiratory or heart disease, the elderly and children should limit prolonged outdoor exertion."
        },
        { 
          icon: <Home className="h-5 w-5 text-orange-500" />,
          category: "Indoor Air",
          text: "Consider using air purifiers indoors and keep windows closed."
        },
        { 
          icon: <Activity className="h-5 w-5 text-orange-500" />,
          category: "Activity Modification",
          text: "Take more breaks during outdoor activities and avoid high-exertion exercises."
        }
      ];
    } else if (aqi <= 200) {
      return [
        { 
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          category: "Health Warning",
          text: "Everyone may begin to experience health effects. Sensitive groups should avoid outdoor activity."
        },
        { 
          icon: <Home className="h-5 w-5 text-red-500" />,
          category: "Stay Indoors",
          text: "Use air purifiers, keep windows closed, and minimize outdoor exposure."
        },
        { 
          icon: <Wind className="h-5 w-5 text-red-500" />,
          category: "Respiratory Protection",
          text: "Consider wearing masks outdoors, especially if you have respiratory conditions."
        },
        { 
          icon: <Activity className="h-5 w-5 text-red-500" />,
          category: "Activity Restriction",
          text: "Avoid prolonged or heavy outdoor exertion. Move workouts indoors."
        }
      ];
    } else if (aqi <= 300) {
      return [
        { 
          icon: <AlertTriangle className="h-5 w-5 text-purple-500" />,
          category: "Serious Health Alert",
          text: "Everyone may experience more serious health effects. Avoid all outdoor physical activities."
        },
        { 
          icon: <Home className="h-5 w-5 text-purple-500" />,
          category: "Indoor Protection",
          text: "Stay indoors with windows sealed. Run air purifiers continuously."
        },
        { 
          icon: <Shield className="h-5 w-5 text-purple-500" />,
          category: "Protective Measures",
          text: "Wear masks if going outside is necessary. Limit all outdoor exposure."
        }
      ];
    } else {
      return [
        { 
          icon: <AlertTriangle className="h-5 w-5 text-purple-900" />,
          category: "Emergency Conditions",
          text: "Health warning of emergency conditions. Serious risk to everyone's health."
        },
        { 
          icon: <Home className="h-5 w-5 text-purple-900" />,
          category: "Strict Indoor Protocol",
          text: "Stay indoors with windows closed and air purifiers running. Seal gaps in doors/windows."
        },
        { 
          icon: <Shield className="h-5 w-5 text-purple-900" />,
          category: "Essential Protection",
          text: "Wear N95 masks if going outside is absolutely necessary. Follow local health advisories."
        }
      ];
    }
  };

  // Function to get header information based on AQI
  const getHeaderInfo = (aqi: number) => {
    if (aqi <= 50) {
      return {
        icon: <Wind className="h-6 w-6 text-green-500" />,
        title: "Good Air Quality",
        description: "Enjoy your outdoor activities",
        color: "text-green-500",
        bgColor: "bg-green-500/10"
      };
    } else if (aqi <= 100) {
      return {
        icon: <Info className="h-6 w-6 text-yellow-500" />,
        title: "Moderate Air Quality",
        description: "Acceptable for most individuals",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10"
      };
    } else if (aqi <= 150) {
      return {
        icon: <Info className="h-6 w-6 text-orange-500" />,
        title: "Unhealthy for Sensitive Groups",
        description: "Take precautions if you're sensitive",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10"
      };
    } else if (aqi <= 200) {
      return {
        icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
        title: "Unhealthy Air Quality",
        description: "Everyone may experience effects",
        color: "text-red-500",
        bgColor: "bg-red-500/10"
      };
    } else if (aqi <= 300) {
      return {
        icon: <AlertTriangle className="h-6 w-6 text-purple-500" />,
        title: "Very Unhealthy Air Quality",
        description: "Health alert: Serious effects possible",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10"
      };
    } else {
      return {
        icon: <AlertTriangle className="h-6 w-6 text-purple-900" />,
        title: "Hazardous Air Quality",
        description: "Health emergency: Take action now",
        color: "text-purple-900",
        bgColor: "bg-purple-900/10"
      };
    }
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
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
  };
  
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <Card className="w-full rounded-2xl glass-morphism shadow-xl p-5 border border-border/50 glow-effect overflow-hidden relative">
      {/* Background gradient based on AQI */}
      {aqi !== null && (
        <div className="absolute inset-0 opacity-5 z-0">
          <div className={`w-full h-full ${getHeaderInfo(aqi).bgColor} blur-xl`}></div>
        </div>
      )}
      
      <div className="flex flex-col h-full relative z-10">
        <AnimatePresence mode="wait">
          {aqi === null ? (
            <motion.div 
              key="no-data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-8"
            >
              <motion.div 
                className="bg-muted/30 p-3 rounded-full mb-3"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <Info className="h-6 w-6 text-muted-foreground" />
              </motion.div>
              <p className="text-muted-foreground font-medium">No recommendations available</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Check back when AQI data is loaded</p>
            </motion.div>
          ) : loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <p className="text-muted-foreground">Loading recommendations...</p>
            </motion.div>
          ) : (
            <motion.div
              key="recommendations"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="flex-1"
            >
              {/* Header with icon and title */}
              <motion.div 
                variants={headerVariants}
                className="flex items-center gap-3 mb-4 pb-3 border-b border-border/30"
              >
                <div className={`p-2 rounded-full ${getHeaderInfo(aqi).bgColor}`}>
                  {getHeaderInfo(aqi).icon}
                </div>
                <div>
                  <h3 className={`text-lg font-medium ${getHeaderInfo(aqi).color}`}>
                    {getHeaderInfo(aqi).title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {getHeaderInfo(aqi).description}
                  </p>
                </div>
              </motion.div>
              
              {/* Recommendations list */}
              <ul className="space-y-3 mt-2">
                {getRecommendations(aqi).map((recommendation, index) => (
                  <motion.li 
                    key={index} 
                    variants={itemVariants}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(var(--card), 0.8)" }}
                    className="flex items-start gap-3 bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-border/30 shadow-sm transition-all duration-200"
                  >
                    <div className="mt-0.5 p-1.5 rounded-full bg-background/80 border border-border/30">
                      {recommendation.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-0.5">{recommendation.category}</p>
                      <p className="text-sm text-muted-foreground">{recommendation.text}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
              
              {/* Footer note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 pt-2 border-t border-border/30 text-xs text-muted-foreground/70 flex items-center gap-1.5"
              >
                <Info className="h-3 w-3" />
                <span>Recommendations based on current AQI of {aqi}</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
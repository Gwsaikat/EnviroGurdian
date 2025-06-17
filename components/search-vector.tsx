"use client"

import { useState, useRef } from "react";
import { Search, X, Loader2, MapPin, Globe, Calendar, BarChart2, Clock, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface LocationSearchResult {
  id: string;
  location: string;
  aqi: number;
  distance: string;
  coordinates: [number, number];
}

interface VectorSearchResult {
  summary: string;
  chart: {
    date: string;
    aqi: number;
  }[];
}

export function SearchVector() {
  const [query, setQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [vectorResults, setVectorResults] = useState<VectorSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'location' | 'vector'>('location');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      if (activeTab === 'location') {
        // Simulate API call for location search
        setTimeout(() => {
          setLocationResults([
            { id: '1', location: 'New York, USA', aqi: 42, distance: '1.2 km', coordinates: [40.7128, -74.0060] },
            { id: '2', location: 'Brooklyn, NY', aqi: 65, distance: '3.5 km', coordinates: [40.6782, -73.9442] },
            { id: '3', location: 'Queens, NY', aqi: 78, distance: '5.8 km', coordinates: [40.7282, -73.7949] },
          ]);
          setLoading(false);
        }, 1000);
      } else {
        // Simulate API call for vector search
        setTimeout(() => {
          setVectorResults({
            summary: "Historical AQI data shows a gradual improvement in air quality over the past 6 months, with occasional spikes during high traffic periods.",
            chart: [
              { date: 'Jan', aqi: 85 },
              { date: 'Feb', aqi: 75 },
              { date: 'Mar', aqi: 80 },
              { date: 'Apr', aqi: 65 },
              { date: 'May', aqi: 60 },
              { date: 'Jun', aqi: 55 },
            ]
          });
          setLoading(false);
        }, 1200);
      }
    } catch (error) {
      console.error(`Error searching ${activeTab}:`, error);
      setLoading(false);
    }
  };

  const clearResults = () => {
    setLocationResults([]);
    setVectorResults(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewLocation = (location: LocationSearchResult) => {
    console.log('Viewing location:', location);
    // Implementation for viewing location details
  };

  // Function to determine AQI color class
  const getAqiColorClass = (aqi: number) => {
    if (aqi <= 50) return "bg-green-500/20 text-green-500";
    if (aqi <= 100) return "bg-yellow-500/20 text-yellow-500";
    if (aqi <= 150) return "bg-orange-500/20 text-orange-500";
    if (aqi <= 200) return "bg-red-500/20 text-red-500";
    if (aqi <= 300) return "bg-purple-500/20 text-purple-500";
    return "bg-rose-500/20 text-rose-500";
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  // Location Results Component
  const LocationResults = ({ results, onViewLocation }: { results: LocationSearchResult[], onViewLocation: (location: LocationSearchResult) => void }) => {
    if (results.length === 0) {
      return (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-background/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
        >
          <div className="text-center py-6">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No locations found. Try a different search term.</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-2"
      >
        {results.map((result) => (
          <motion.div
            key={result.id}
            className="bg-background/30 backdrop-blur-sm rounded-xl p-3 border border-border/50 flex items-center justify-between"
            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", getAqiColorClass(result.aqi))}>
                <span className="text-sm font-medium">{result.aqi}</span>
              </div>
              <div>
                <h4 className="text-sm font-medium">{result.location}</h4>
                <p className="text-xs text-muted-foreground">{result.distance}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8"
              onClick={() => onViewLocation(result)}
            >
              View
            </Button>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  // Vector Results Component
  const VectorResults = ({ results }: { results: VectorSearchResult | null }) => {
    if (!results) {
      return (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-background/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
        >
          <div className="text-center py-6">
            <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No historical data found. Try a different search term.</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-background/30 backdrop-blur-sm rounded-xl p-4 border border-border/50 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Historical Data Analysis</h4>
            <p className="text-xs text-muted-foreground">{results.summary}</p>
          </div>
        </div>

        <div className="h-[180px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={results.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="aqi" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by location or historical data..."
          className="w-full bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 shadow-glow-sm text-foreground"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query.length > 0 && (
            <motion.button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground p-1 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
          <motion.button
            onClick={handleSearch}
            className="bg-primary/80 hover:bg-primary text-white p-1.5 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading || query.trim() === ''}
          >
            <Search className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('location')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${activeTab === 'location' ? 'bg-primary/20 text-primary' : 'hover:bg-background/50 text-muted-foreground'}`}
          >
            Location Results
          </button>
          <button
            onClick={() => setActiveTab('vector')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${activeTab === 'vector' ? 'bg-primary/20 text-primary' : 'hover:bg-background/50 text-muted-foreground'}`}
          >
            Historical Data
          </button>
        </div>
        {(locationResults.length > 0 || vectorResults) && (
          <motion.button
            onClick={clearResults}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="h-3 w-3" />
            Clear
          </motion.button>
        )}
      </div>

      {/* Results Display */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center py-8"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </motion.div>
        ) : query.trim() === '' ? (
          <motion.div
            key="empty"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-background/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
          >
            <div className="text-center py-6">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Search for locations to check air quality or historical data analysis
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <motion.button
                  onClick={() => setQuery('New York')}
                  className="px-3 py-1.5 text-xs bg-background/50 hover:bg-background/70 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  New York
                </motion.button>
                <motion.button
                  onClick={() => setQuery('London')}
                  className="px-3 py-1.5 text-xs bg-background/50 hover:bg-background/70 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  London
                </motion.button>
                <motion.button
                  onClick={() => setQuery('historical AQI trends')}
                  className="px-3 py-1.5 text-xs bg-background/50 hover:bg-background/70 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Historical AQI Trends
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'location' ? (
          <LocationResults 
            results={locationResults} 
            onViewLocation={handleViewLocation} 
          />
        ) : (
          <VectorResults results={vectorResults} />
        )}
      </AnimatePresence>
    </div>
  );
}
"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Wind, Droplets, Sun, CloudRain } from "lucide-react";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          // Add a small delay before hiding the preloader
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Icons for the animation
  const icons = [
    <Leaf key="leaf" className="text-green-500" />,
    <Wind key="wind" className="text-blue-400" />,
    <Droplets key="droplets" className="text-blue-500" />,
    <Sun key="sun" className="text-yellow-400" />,
    <CloudRain key="cloud" className="text-gray-400" />
  ];

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        >
          <div className="relative w-full max-w-md px-8">
            {/* Logo and title */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold tracking-tight neon-text mb-2">EnviroGuardian</h1>
              <p className="text-muted-foreground">Your real-time environmental assistant</p>
            </motion.div>
            
            {/* Animated icons */}
            <motion.div 
              className="flex justify-center mb-8 relative h-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {/* Glowing background effect */}
              <motion.div 
                className="absolute inset-0 bg-primary/10 rounded-full blur-xl"
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
              
              {/* Rotating icons */}
              {icons.map((icon, index) => (
                <motion.div
                  key={index}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.2, 0.5],
                    x: Math.cos(index * (Math.PI * 2 / icons.length)) * 60,
                    y: Math.sin(index * (Math.PI * 2 / icons.length)) * 60,
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    {icon}
                  </div>
                </motion.div>
              ))}
              
              {/* Center logo */}
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center z-10"
                animate={{ 
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 10px rgba(0, 140, 255, 0.5)",
                    "0 0 20px rgba(0, 140, 255, 0.8)",
                    "0 0 10px rgba(0, 140, 255, 0.5)"
                  ]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <Leaf className="h-8 w-8 text-primary" />
              </motion.div>
            </motion.div>
            
            {/* Progress bar */}
            <motion.div 
              className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden glass-morphism"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            
            {/* Loading text */}
            <motion.p 
              className="text-center text-sm text-muted-foreground mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Loading environmental data
              <span className="loading-dots ml-1">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Wind, Droplets, Thermometer } from "lucide-react"

interface AQIDisplayProps {
  aqi: number;
  level: string;
  recommendation: string;
}

const getAQIColor = (value: number) => {
  if (value <= 50) return "bg-aqi-good"
  if (value <= 100) return "bg-aqi-moderate"
  if (value <= 150) return "bg-aqi-unhealthy"
  if (value <= 200) return "bg-aqi-veryUnhealthy"
  return "bg-aqi-hazardous"
}

const getAQIEmoji = (value: number) => {
  if (value <= 50) return "😀"
  if (value <= 100) return "😐"
  if (value <= 150) return "😷"
  if (value <= 200) return "🤢"
  return "⚠️"
}

const getAQITextColor = (value: number) => {
  if (value <= 50) return "text-green-500"
  if (value <= 100) return "text-yellow-500"
  if (value <= 150) return "text-orange-500"
  if (value <= 200) return "text-red-500"
  return "text-purple-500"
}

const getAQIGlowColor = (value: number) => {
  if (value <= 50) return "shadow-[0_0_15px_rgba(0,230,0,0.5)]"
  if (value <= 100) return "shadow-[0_0_15px_rgba(255,255,0,0.5)]"
  if (value <= 150) return "shadow-[0_0_15px_rgba(255,126,0,0.5)]"
  if (value <= 200) return "shadow-[0_0_15px_rgba(255,0,0,0.5)]"
  return "shadow-[0_0_15px_rgba(153,0,76,0.5)]"
}

export function AQIDisplay({ aqi, level, recommendation }: AQIDisplayProps) {
  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  // Animation variants for the AQI value
  const numberVariants = {
    hidden: { scale: 0.5, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 15 } }
  };

  // Animation variants for the scale markers
  const scaleVariants = {
    hidden: { width: 0 },
    visible: (i: number) => ({
      width: "100%",
      transition: { delay: 0.3 + (i * 0.1), duration: 0.5 }
    })
  };

  // Animation variants for the recommendation
  const recommendationVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.3 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "rounded-2xl p-5 text-white shadow-xl backdrop-blur-sm border border-white/10 glass-morphism",
        getAQIColor(aqi),
        getAQIGlowColor(aqi)
      )}
    >
      <div className="flex items-center gap-4">
        <motion.div 
          className="flex-shrink-0 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shadow-glow-sm"
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileHover={{ scale: 1.1, rotate: 10 }}
        >
          <span className="text-4xl">{getAQIEmoji(aqi)}</span>
        </motion.div>
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold">AQI</h3>
            <motion.span 
              className="text-3xl font-extrabold"
              variants={numberVariants}
              whileHover={{ scale: 1.1 }}
            >
              {aqi}
            </motion.span>
          </div>
          <motion.p 
            className="text-sm font-medium opacity-90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {level}
          </motion.p>
        </div>
      </div>

      <motion.div 
        className="mt-4 pt-4 border-t border-white/20"
        variants={recommendationVariants}
      >
        <div className="flex items-start gap-2">
          <div className="p-1 rounded-full bg-white/10">
            <Wind className="h-4 w-4" />
          </div>
          <p className="text-sm">{recommendation}</p>
        </div>
      </motion.div>
      
      {/* AQI Scale */}
      <motion.div 
        className="mt-5 pt-4 border-t border-white/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-medium opacity-80">AQI Scale</div>
          <div className="text-xs opacity-70">{aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : aqi <= 150 ? "Unhealthy" : aqi <= 200 ? "Very Unhealthy" : "Hazardous"}</div>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden shadow-glow-sm">
          <motion.div 
            className="bg-aqi-good w-1/5"
            variants={scaleVariants}
            custom={0}
          />
          <motion.div 
            className="bg-aqi-moderate w-1/5"
            variants={scaleVariants}
            custom={1}
          />
          <motion.div 
            className="bg-aqi-unhealthy w-1/5"
            variants={scaleVariants}
            custom={2}
          />
          <motion.div 
            className="bg-aqi-veryUnhealthy w-1/5"
            variants={scaleVariants}
            custom={3}
          />
          <motion.div 
            className="bg-aqi-hazardous w-1/5"
            variants={scaleVariants}
            custom={4}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1 opacity-80">
          <span>0</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>200</span>
          <span>300+</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
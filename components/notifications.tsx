"use client"

import { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, Info, BellRing, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getFirebaseMessaging } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "alert" | "info";
  timestamp: Date;
}

interface NotificationsProps {
  aqiData?: {
    aqi: number;
    level: string;
    recommendation: string;
  } | null;
}

export function Notifications({ aqiData }: NotificationsProps = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [showPopups, setShowPopups] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationsPermission, setNotificationsPermission] = useState<string>("default");
  
  // Initialize Firebase Cloud Messaging
  useEffect(() => {
    const initializeFirebaseMessaging = async () => {
      try {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
          console.log('This browser does not support notifications');
          return;
        }
        
        // Check notification permission
        const permission = await Notification.requestPermission();
        setNotificationsPermission(permission);
        
        if (permission !== 'granted') {
          console.log('Notification permission not granted');
          return;
        }
        
        // Get FCM instance
        const messaging = await getFirebaseMessaging();
        if (!messaging) {
          console.log('Firebase messaging not supported');
          return;
        }
        
        // Get FCM token
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        const token = await getToken(messaging, { vapidKey });
        setFcmToken(token);
        console.log('FCM Token:', token);
        
        // Register token with backend
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        
        // Handle foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Message received:', payload);
          const { notification } = payload;
          
          if (notification && notification.title) {
            // Add to notifications list
            const newNotification = {
              id: Date.now().toString(),
              title: notification.title,
              message: notification.body || '',
              type: payload.data?.type === 'alert' ? 'alert' as const : 'info' as const,
              timestamp: new Date()
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show toast if enabled
            if (showPopups) {
              const isAlert = payload.data?.type === 'alert';
              toast(notification.title, {
                description: notification.body,
                icon: isAlert ? 
                  <AlertTriangle className="h-5 w-5 text-red-500" /> : 
                  <Info className="h-5 w-5 text-blue-500" />,
                duration: 5000,
                className: `glass-morphism border-l-4 ${isAlert ? 'border-red-500 shadow-glow-red' : 'border-blue-500 shadow-glow-blue'}`,
              });
            }
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };
    
    initializeFirebaseMessaging();
  }, [showPopups]);
  
  // Load initial notifications based on AQI data
  useEffect(() => {
    // Generate notifications based on current AQI data
    if (aqiData) {
      const { aqi, level, recommendation } = aqiData;
      const newNotifications: Notification[] = [];
      
      // Create notification based on AQI level
      if (aqi > 100) {
        // Unhealthy or worse
        newNotifications.push({
          id: "aqi-alert-" + Date.now(),
          title: "Air Quality Alert",
          message: `${level} air quality levels detected (AQI: ${aqi}). ${recommendation}`,
          type: "alert",
          timestamp: new Date()
        });
      } else if (aqi > 50) {
        // Moderate
        newNotifications.push({
          id: "aqi-warning-" + Date.now(),
          title: "Air Quality Warning",
          message: `${level} air quality levels detected (AQI: ${aqi}). ${recommendation}`,
          type: "info",
          timestamp: new Date()
        });
      } else {
        // Good
        newNotifications.push({
          id: "aqi-info-" + Date.now(),
          title: "Air Quality Update",
          message: `${level} air quality levels detected (AQI: ${aqi}). ${recommendation}`,
          type: "info",
          timestamp: new Date()
        });
      }
      
      // Add health recommendation based on AQI level
      if (aqi > 50) {
        newNotifications.push({
          id: "health-rec-" + Date.now(),
          title: "Health Recommendation",
          message: aqi > 150 ? 
            "Consider using air purifiers indoors and wearing masks when outside." :
            "Sensitive individuals should consider limiting prolonged outdoor activities.",
          type: aqi > 100 ? "alert" : "info",
          timestamp: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
        });
      }
      
      setNotifications(newNotifications);
      
      // Show toast notifications for new alerts
      if (showPopups) {
        newNotifications.forEach(notification => {
          if (notification.type === "alert") {
            toast(notification.title, {
              description: notification.message,
              icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
              duration: 5000,
              className: "glass-morphism border-l-4 border-red-500 shadow-glow-red",
            });
          }
        });
      }
    } else {
      // If no AQI data is available, show a waiting notification
      setNotifications([{
        id: "waiting-" + Date.now(),
        title: "Waiting for Air Quality Data",
        message: "We'll notify you when air quality information becomes available for your location.",
        type: "info" as const,
        timestamp: new Date()
      }]);
    }
  }, [aqiData, showPopups]);
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.round(diffMins / 60);
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
  };
  
  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
  
  const visibleNotifications = showAll ? notifications : notifications.slice(0, 2);

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
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.2 } 
    }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card className="w-full h-full rounded-2xl glass-morphism shadow-xl p-5 flex flex-col gap-3 border border-border/50 glow-effect overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div 
              className="bg-primary/10 p-2 rounded-full shadow-glow-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Bell className="h-5 w-5 text-primary" />
            </motion.div>
            <h3 className="font-medium text-lg neon-text">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <motion.div 
                className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full text-xs text-primary"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <span className="font-medium">{notifications.length}</span>
                <span>notification{notifications.length !== 1 ? 's' : ''}</span>
              </motion.div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 rounded-xl border-primary/30 hover:border-primary/60 transition-all duration-300 shadow-glow-sm flex items-center gap-1.5"
              onClick={() => setShowPopups(!showPopups)}
            >
              {showPopups ? (
                <>
                  <BellOff className="h-3.5 w-3.5" />
                  <span>Disable Popups</span>
                </>
              ) : (
                <>
                  <BellRing className="h-3.5 w-3.5" />
                  <span>Enable Popups</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        <motion.div 
          className="flex-1 overflow-y-auto space-y-3 mb-1 custom-scrollbar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {notifications.length === 0 ? (
            <motion.div 
              className="text-center py-10 glass-morphism rounded-2xl p-6 border border-border/20 h-full flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="relative w-16 h-16 mx-auto mb-4">
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
                <Bell className="w-16 h-16 mx-auto text-primary relative z-10" />
              </div>
              <h4 className="font-medium mb-2 text-lg">All Caught Up!</h4>
              <p className="text-muted-foreground text-sm">You have no new notifications at this time.</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {visibleNotifications.map((notification, index) => (
                <motion.div 
                  key={notification.id}
                  className={`relative glass-morphism rounded-xl p-3.5 shadow-sm border ${notification.type === "alert" ? "border-red-500/30 shadow-glow-red" : "border-blue-500/30 shadow-glow-blue"}`}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  custom={index}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="flex gap-3">
                    <motion.div 
                      className={`rounded-full p-2.5 ${notification.type === "alert" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {notification.type === "alert" ? 
                        <AlertTriangle className="h-4 w-4" /> : 
                        <Info className="h-4 w-4" />}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 90 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full -mt-1 -mr-1 hover:bg-background/80"
                            onClick={() => dismissNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground block">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.type === "alert" && (
                          <motion.span 
                            className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                          >
                            Important
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {notifications.length > 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs mt-2 rounded-xl hover:bg-primary/10 transition-all duration-300 shadow-glow-sm" 
                onClick={() => setShowAll(!showAll)}
              >
                <motion.span
                  initial={{ y: 0 }}
                  animate={{ y: showAll ? 0 : [0, -2, 0, -2, 0] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: showAll ? 0 : Infinity, 
                    repeatDelay: 2 
                  }}
                >
                  {showAll ? "Show less" : `Show ${notifications.length - 2} more`}
                </motion.span>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </Card>
    </motion.div>
  );
}
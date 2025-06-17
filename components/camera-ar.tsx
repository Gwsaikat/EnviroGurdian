"use client"

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, RefreshCw, AlertTriangle, Info } from "lucide-react";

interface CameraARProps {
  aqi: number | null;
  level?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function CameraAR({ aqi, level, latitude, longitude }: CameraARProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Function to start the camera
  const startCamera = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to access camera...');
      let stream;
      
      // First try to get any available camera
      try {
        console.log('Trying to access any available camera');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        console.log('Successfully accessed camera');
      } catch (err) {
        console.log('Failed to access default camera, trying front camera specifically:', err);
        // If that fails, try front camera specifically
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user", // Use the front camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        console.log('Successfully accessed front camera');
      }
      
      // Store the stream reference for cleanup
      streamRef.current = stream;
      
      // Set the video source to the camera stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Set video source to camera stream');
      }
      
      setCameraActive(true);
      setPermissionDenied(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      setPermissionDenied(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to stop the camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
  };
  
  // Toggle camera state
  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };
  
  // Draw AR overlay on canvas
  const drawAROverlay = () => {
    // Check if we have all the necessary references and the camera is active
    if (!canvasRef.current || !videoRef.current || !cameraActive) {
      console.log('Cannot draw AR overlay: missing refs or camera inactive');
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }
    
    // Check if video is ready and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      console.log(`Video not fully ready yet. Dimensions: ${video.videoWidth}x${video.videoHeight}, readyState: ${video.readyState}`);
      // Try again in the next animation frame
      requestAnimationFrame(drawAROverlay);
      return;
    }
    
    console.log(`Drawing AR overlay. Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
    
    // Match canvas size to video dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      console.log(`Updating canvas dimensions to match video: ${video.videoWidth}x${video.videoHeight}`);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    try {
      // Draw the video frame to the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw AQI information if available
      if (aqi !== null) {
        // Create a semi-transparent background for the AQI display
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, 20, 200, 110);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, 200, 110);
        
        // AQI value with color coding
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = getAQIColor(aqi);
        ctx.fillText(`AQI: ${aqi}`, 30, 55);
        
        // AQI level description
        ctx.font = '18px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(level || getAQILevel(aqi), 30, 85);
        
        // Add a timestamp to show data freshness
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        ctx.fillText(`Updated: ${timeString}`, 30, 110);
        
        // Location info if available
        if (latitude && longitude) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(20, canvas.height - 60, 240, 40);
          ctx.font = '14px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText(`Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 30, canvas.height - 35);
        }
      } else {
        // If no AQI data, show a message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, 20, 280, 60);
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('No air quality data available', 30, 55);
      }
      
      console.log('Successfully drew AR overlay');
    } catch (err) {
      console.error('Error drawing to canvas:', err);
    }
    
    // Continue the animation loop
    if (cameraActive) {
      requestAnimationFrame(drawAROverlay);
    }
  };
  
  // Get color based on AQI value
  const getAQIColor = (value: number): string => {
    if (value <= 50) return '#00E400'; // Good
    if (value <= 100) return '#FFFF00'; // Moderate
    if (value <= 150) return '#FF7E00'; // Unhealthy for Sensitive Groups
    if (value <= 200) return '#FF0000'; // Unhealthy
    if (value <= 300) return '#99004C'; // Very Unhealthy
    return '#7E0023'; // Hazardous
  };
  
  // Get AQI level description
  const getAQILevel = (value: number): string => {
    if (value <= 50) return 'Good';
    if (value <= 100) return 'Moderate';
    if (value <= 150) return 'Unhealthy for Sensitive Groups';
    if (value <= 200) return 'Unhealthy';
    if (value <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };
  
  // Start drawing when camera is active
  useEffect(() => {
    let isComponentMounted = true;
    let animationFrameId: number | null = null;
    
    if (cameraActive && videoRef.current && streamRef.current) {
      console.log('Camera active, setting up video and canvas');
      
      // Set up video element with the stream
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      
      // Function to start the AR drawing loop
      const startARDrawing = () => {
        if (isComponentMounted && videoRef.current) {
          console.log('Starting AR drawing loop');
          // Start the drawing loop with requestAnimationFrame
          const drawLoop = () => {
            if (isComponentMounted && cameraActive) {
              drawAROverlay();
              animationFrameId = requestAnimationFrame(drawLoop);
            }
          };
          drawLoop();
        }
      };
      
      // Handle the canplay event
      const handleCanPlay = () => {
        console.log('Video can play event triggered');
        if (isComponentMounted) {
          startARDrawing();
        }
      };
      
      // Add event listener for when video can play
      videoRef.current.addEventListener('canplay', handleCanPlay);
      
      // If video is already ready, start drawing
      if (videoRef.current.readyState >= 2) {
        console.log('Video already ready, starting AR drawing');
        startARDrawing();
      }
      
      // Try to play the video
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playback started successfully');
          })
          .catch(err => {
            if (isComponentMounted) {
              console.error('Error playing video:', err);
              // If we get an AbortError, it might be because the video element was removed
              // or the srcObject was changed. We'll retry in the next render cycle.
              if (err.name !== 'AbortError') {
                setError('Failed to play video stream. Please check camera permissions.');
              } else {
                console.log('AbortError caught, will retry on next render cycle');
              }
            }
          });
      }
      
      // Return cleanup function
      return () => {
        isComponentMounted = false;
        
        // Cancel any pending animation frames
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        
        // Remove event listener
        if (videoRef.current) {
          videoRef.current.removeEventListener('canplay', handleCanPlay);
          
          // Pause video and remove srcObject to prevent memory leaks
          try {
            const video = videoRef.current;
            if (video.srcObject) {
              video.pause();
              video.srcObject = null;
            }
          } catch (err) {
            console.error('Error during video cleanup:', err);
          }
        }
      };
    }
    
    return () => {
      isComponentMounted = false;
    };
  }, [cameraActive, aqi, level, latitude, longitude]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="overflow-hidden relative">
      <div className="p-4 flex items-center justify-between bg-card">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="h-5 w-5" />
          AR Air Quality View
        </h3>
        <Button
          variant={cameraActive ? "destructive" : "default"}
          size="sm"
          onClick={toggleCamera}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : cameraActive ? (
            <>
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </>
          )}
        </Button>
      </div>
      
      <AnimatePresence mode="wait">
        {!cameraActive && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-muted/50 h-[300px]"
          >
            {permissionDenied ? (
              <>
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <div>
                  <h4 className="text-lg font-medium">Camera Access Denied</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please enable camera access in your browser settings to use this feature.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Camera className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h4 className="text-lg font-medium">Camera AR View</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start the camera to see real-time air quality information overlaid on your surroundings.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
        
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-muted/50 h-[300px]"
          >
            <RefreshCw className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h4 className="text-lg font-medium">Accessing Camera</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Please allow camera access when prompted...
              </p>
            </div>
          </motion.div>
        )}
        
        {cameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-[300px] bg-black overflow-hidden"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                console.log('Video metadata loaded');
                // Ensure canvas dimensions match video once loaded
                if (canvasRef.current && videoRef.current) {
                  canvasRef.current.width = videoRef.current.videoWidth;
                  canvasRef.current.height = videoRef.current.videoHeight;
                  console.log(`Set canvas dimensions to ${canvasRef.current.width}x${canvasRef.current.height}`);
                  // Trigger initial draw
                  drawAROverlay();
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10
              }}
            />
            
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-destructive/90 text-white p-2 rounded-md flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {!aqi && (
              <div className="absolute bottom-4 left-4 right-4 bg-muted/90 p-2 rounded-md flex items-center">
                <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">No air quality data available for this location.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
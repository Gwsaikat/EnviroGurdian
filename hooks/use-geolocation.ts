import { useState, useEffect, useCallback } from "react"

export function useGeolocation() {
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const getLocation = useCallback(() => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"))
        return
      }

      // First try with high accuracy but shorter timeout
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          // If high accuracy fails, try again with lower accuracy and longer timeout
          if (error.code === error.TIMEOUT) {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve(position),
              (fallbackError) => reject(fallbackError),
              {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 60000, // Allow cached position up to 1 minute old
              }
            )
          } else {
            reject(error)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Reduced timeout for faster response
          maximumAge: 0,
        }
      )
    })
  }, [])

  const refreshLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const position = await getLocation()
      setLatitude(position.coords.latitude)
      setLongitude(position.coords.longitude)
      return true
    } catch (err) {
      // Provide more user-friendly error messages
      let errorMessage = "Failed to get location"
      
      if (err instanceof GeolocationPositionError && err.code) {
        switch(err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = "Location access denied. Please enable location services in your browser settings."
            break
          case 2: // POSITION_UNAVAILABLE
            errorMessage = "Your location is currently unavailable. Please try again later."
            break
          case 3: // TIMEOUT
            errorMessage = "Location request timed out. Please check your connection and try again."
            break
        }
      }
      
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [getLocation])

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setIsLoading(false)
      return
    }

    const successHandler = (position: GeolocationPosition) => {
      setLatitude(position.coords.latitude)
      setLongitude(position.coords.longitude)
      setIsLoading(false)
    }

    const errorHandler = (error: GeolocationPositionError) => {
      setError(error.message)
      setIsLoading(false)
    }

    const watchId = navigator.geolocation.watchPosition(
      successHandler,
      (error) => {
        // If high accuracy watch fails with timeout, try with lower accuracy
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            successHandler,
            errorHandler,
            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000, // Allow cached position up to 1 minute old
            }
          )
        } else {
          errorHandler(error)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Reduced timeout for faster response
        maximumAge: 0,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return { latitude, longitude, error, isLoading, refreshLocation }
}
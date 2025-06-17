import { NextResponse } from 'next/server';

// Cache for storing recent weather results
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function getWeatherFromOpenMeteo(lat: string, lon: string) {
  try {
    console.log(`Fetching weather data from Open-Meteo for coordinates: ${lat}, ${lon}`);
    
    // Open-Meteo API URL with all the parameters we need
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto`;
    
    console.log(`Open-Meteo API URL: ${url}`);
    
    const response = await fetch(url, {
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Open-Meteo API response received');
    
    if (!data) {
      console.log('No data found in Open-Meteo response');
      return null;
    }
    
    return processWeatherData(data);
  } catch (error) {
    console.error("Open-Meteo API error:", error);
    return null;
  }
}

// Process the raw weather data into a more usable format
function processWeatherData(data: any) {
  // Get current weather
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  
  // Map weather code to condition and icon
  const weatherInfo = getWeatherInfo(current.weather_code, current.is_day);
  
  // Process forecast data
  const forecast = [];
  for (let i = 0; i < daily.time.length; i++) {
    const date = new Date(daily.time[i]);
    const dayInfo = getWeatherInfo(daily.weather_code[i], 1); // Assuming day time for forecast
    
    forecast.push({
      date: formatDate(date),
      day: getDayName(date),
      temperature: {
        max: Math.round(daily.temperature_2m_max[i]),
        min: Math.round(daily.temperature_2m_min[i])
      },
      condition: dayInfo.condition,
      icon: dayInfo.icon,
      precipitation_probability: daily.precipitation_probability_max[i],
      precipitation_sum: daily.precipitation_sum[i],
      wind_speed: daily.wind_speed_10m_max[i],
      uv_index: daily.uv_index_max[i]
    });
  }
  
  // Get UV index from hourly data (current hour)
  const currentHourIndex = hourly.time.findIndex((time: string) => 
    new Date(time).getHours() === new Date().getHours());
  const uvIndex = currentHourIndex !== -1 ? hourly.uv_index[currentHourIndex] : 0;
  
  // Get visibility from hourly data (current hour)
  const visibility = currentHourIndex !== -1 ? 
    Math.round(hourly.visibility[currentHourIndex] / 1000) : 10; // Convert to km
  
  // Format sunrise and sunset times
  const sunriseDate = new Date(daily.sunrise[0]);
  const sunsetDate = new Date(daily.sunset[0]);
  
  // Get location info from timezone
  const timezone = data.timezone;
  const locationParts = timezone.split('/');
  const location = locationParts[locationParts.length - 1].replace(/_/g, ' ').toUpperCase();
  
  return {
    temperature: Math.round(current.temperature_2m),
    condition: weatherInfo.condition,
    icon: weatherInfo.icon,
    windSpeed: Math.round(current.wind_speed_10m * 10) / 10, // Round to 1 decimal place
    windDirection: current.wind_direction_10m,
    humidity: Math.round(current.relative_humidity_2m),
    uvIndex: Math.round(uvIndex * 10) / 10, // Round to 1 decimal place
    feelsLike: Math.round(current.apparent_temperature),
    visibility: visibility,
    sunrise: formatTime(sunriseDate),
    sunset: formatTime(sunsetDate),
    location: location,
    country: getCountryFromTimezone(timezone),
    date: formatDateTime(new Date()),
    pressure: current.pressure_msl,
    cloudCover: current.cloud_cover,
    precipitation: current.precipitation,
    isDay: current.is_day === 1,
    forecast: forecast
  };
}

// Helper function to map weather codes to conditions and icons
function getWeatherInfo(code: number, isDay: number) {
  // Weather codes from Open-Meteo API
  // https://open-meteo.com/en/docs
  const weatherCodes: Record<number, { day: string, night: string, icon: string }> = {
    0: { day: "Clear Sky", night: "Clear Sky", icon: "sun" },
    1: { day: "Mainly Clear", night: "Mainly Clear", icon: "sun" },
    2: { day: "Partly Cloudy", night: "Partly Cloudy", icon: "cloud-sun" },
    3: { day: "Overcast", night: "Overcast", icon: "cloud" },
    45: { day: "Fog", night: "Fog", icon: "cloud-fog" },
    48: { day: "Depositing Rime Fog", night: "Depositing Rime Fog", icon: "cloud-fog" },
    51: { day: "Light Drizzle", night: "Light Drizzle", icon: "cloud-drizzle" },
    53: { day: "Moderate Drizzle", night: "Moderate Drizzle", icon: "cloud-drizzle" },
    55: { day: "Dense Drizzle", night: "Dense Drizzle", icon: "cloud-drizzle" },
    56: { day: "Light Freezing Drizzle", night: "Light Freezing Drizzle", icon: "cloud-drizzle" },
    57: { day: "Dense Freezing Drizzle", night: "Dense Freezing Drizzle", icon: "cloud-drizzle" },
    61: { day: "Slight Rain", night: "Slight Rain", icon: "cloud-rain" },
    63: { day: "Moderate Rain", night: "Moderate Rain", icon: "cloud-rain" },
    65: { day: "Heavy Rain", night: "Heavy Rain", icon: "cloud-rain" },
    66: { day: "Light Freezing Rain", night: "Light Freezing Rain", icon: "cloud-rain" },
    67: { day: "Heavy Freezing Rain", night: "Heavy Freezing Rain", icon: "cloud-rain" },
    71: { day: "Slight Snow Fall", night: "Slight Snow Fall", icon: "cloud-snow" },
    73: { day: "Moderate Snow Fall", night: "Moderate Snow Fall", icon: "cloud-snow" },
    75: { day: "Heavy Snow Fall", night: "Heavy Snow Fall", icon: "cloud-snow" },
    77: { day: "Snow Grains", night: "Snow Grains", icon: "cloud-snow" },
    80: { day: "Slight Rain Showers", night: "Slight Rain Showers", icon: "cloud-rain" },
    81: { day: "Moderate Rain Showers", night: "Moderate Rain Showers", icon: "cloud-rain" },
    82: { day: "Violent Rain Showers", night: "Violent Rain Showers", icon: "cloud-rain" },
    85: { day: "Slight Snow Showers", night: "Slight Snow Showers", icon: "cloud-snow" },
    86: { day: "Heavy Snow Showers", night: "Heavy Snow Showers", icon: "cloud-snow" },
    95: { day: "Thunderstorm", night: "Thunderstorm", icon: "cloud-lightning" },
    96: { day: "Thunderstorm with Slight Hail", night: "Thunderstorm with Slight Hail", icon: "cloud-lightning" },
    99: { day: "Thunderstorm with Heavy Hail", night: "Thunderstorm with Heavy Hail", icon: "cloud-lightning" }
  };

  const info = weatherCodes[code] || { day: "Unknown", night: "Unknown", icon: "cloud-question" };
  return {
    condition: isDay ? info.day : info.night,
    icon: info.icon
  };
}

// Helper function to format date
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return date.toLocaleDateString('en-US', options);
}

// Helper function to get day name
function getDayName(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    return date.toLocaleDateString('en-US', options);
  }
}

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Helper function to format date and time
function formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-US', options);
}

// Helper function to get country from timezone
function getCountryFromTimezone(timezone: string): string {
  // This is a simplified approach. For a more robust solution, consider a dedicated library.
  if (timezone.includes('Asia/Kolkata')) {
    return 'INDIA';
  } else if (timezone.startsWith('America')) {
    return 'US';
  } else if (timezone.startsWith('Europe')) {
    return 'EU';
  } else if (timezone.startsWith('Asia')) {
    return 'ASIA';
  } else if (timezone.startsWith('Africa')) {
    return 'AFRICA';
  } else if (timezone.startsWith('Australia')) {
    return 'AUSTRALIA';
  } else if (timezone.startsWith('Pacific')) {
    return 'PACIFIC';
  } else {
    return 'UNKNOWN';
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  
  console.log(`Weather API request received for coordinates: ${lat}, ${lon}`);
  
  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }
  
  try {
    // Parse coordinates to ensure they're valid numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude values" },
        { status: 400 }
      );
    }
    
    // Check if coordinates are within valid range
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Latitude must be between -90 and 90, longitude between -180 and 180" },
        { status: 400 }
      );
    }
    
    // Check cache first
    const cacheKey = `${lat},${lon}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Returning cached weather data for ${cacheKey}`);
      return NextResponse.json(cachedData.data);
    }
    
    // Fetch weather data from Open-Meteo
    const weatherData = await getWeatherFromOpenMeteo(lat, lon);
    
    if (!weatherData) {
      console.log('No weather data available');
      return NextResponse.json(
        { error: "No weather data available for this location" },
        { status: 404 }
      );
    }
    
    // Cache the result
    cache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    console.log(`Returning weather data for ${cacheKey}`);
    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Error processing weather request:', error);
    return NextResponse.json(
      { error: "Failed to process weather request" },
      { status: 500 }
    );
  }
}
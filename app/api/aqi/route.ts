import { NextResponse } from 'next/server';

// API keys
const OPENAQ_API_KEY = process.env.NEXT_PUBLIC_OPENAQ_API_KEY || 'demo';
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

// Define interfaces for consistent typing
interface AQISourceData {
  pm25: number;
  pm10: number;
  source: string;
  aqi_index: number | null;
  timestamp: string;
  stationName?: string;
  distance?: number;
}

interface AQIResult {
  aqi: number;
  level: string;
  recommendation: string;
  source?: string;
  pm25?: number;
  pm10?: number;
  timestamp?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Cache for storing recent AQI results
const cache = new Map<string, { data: AQIResult; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getAQIFromOpenAQ(lat: string, lon: string): Promise<AQISourceData | null> {
  try {
    console.log(`Fetching AQI data from OpenAQ for coordinates: ${lat}, ${lon}`);
    console.log(`Using OpenAQ API Key: ${OPENAQ_API_KEY ? OPENAQ_API_KEY.substring(0, 5) + '...' : 'Not set'}`);
    
    // Use the coordinates to fetch data from the nearest station
    // Increased radius to 50km to find more stations
    const apiUrl = `https://api.openaq.org/v2/locations?coordinates=${lat},${lon}&radius=50000&limit=5&order_by=distance`;
    console.log(`OpenAQ API request URL: ${apiUrl}`);
    
    const response = await fetch(
      apiUrl,
      {
        headers: {
          'X-API-Key': OPENAQ_API_KEY,
        },
        // Add a timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`OpenAQ found ${data.results?.length || 0} stations`);

    if (!data.results || data.results.length === 0) {
      console.log('No OpenAQ stations found nearby');
      return null;
    }

    // Find the first station with PM2.5 or PM10 data
    let selectedStation = null;
    let pm25 = null;
    let pm10 = null;
    
    for (const station of data.results) {
      let stationPm25 = null;
      let stationPm10 = null;
      
      if (station.parameters) {
        for (const param of station.parameters) {
          if (param.parameter === 'pm25' && param.lastValue !== null) {
            stationPm25 = param.lastValue;
          } else if (param.parameter === 'pm10' && param.lastValue !== null) {
            stationPm10 = param.lastValue;
          }
        }
      }
      
      if (stationPm25 !== null || stationPm10 !== null) {
        selectedStation = station;
        pm25 = stationPm25;
        pm10 = stationPm10;
        console.log(`Found station with data: ${station.name} at ${station.distance.toFixed(2)}m distance`);
        break;
      }
    }

    if (!selectedStation) {
      console.log('No stations with PM2.5 or PM10 data available from OpenAQ');
      return null;
    }

    const result: AQISourceData = {
      pm25: pm25 || 0,
      pm10: pm10 || 0,
      source: 'OpenAQ',
      stationName: selectedStation.name,
      distance: selectedStation.distance,
      timestamp: new Date().toISOString(),
      aqi_index: null, // OpenAQ doesn't provide its own AQI index
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching from OpenAQ:', error);
    return null;
  }
}

async function getAQIFromOpenWeather(lat: string, lon: string): Promise<AQISourceData | null> {
  try {
    console.log(`Fetching OpenWeather data for coordinates: ${lat}, ${lon}`);
    console.log(`Using OpenWeather API Key: ${OPENWEATHER_API_KEY ? OPENWEATHER_API_KEY.substring(0, 5) + '...' : 'Not set'}`);
    
    if (!OPENWEATHER_API_KEY) {
      console.log('OpenWeather API key not set, skipping');
      return null;
    }
    
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
    console.log(`OpenWeather API URL: ${url.replace(OPENWEATHER_API_KEY, 'API_KEY')}`);
    
    const response = await fetch(url, {
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('OpenWeather API response received');
    
    if (!data.list || data.list.length === 0) {
      console.log('No data found in OpenWeather response');
      return null;
    }
    
    const airData = data.list[0];
    const components = airData.components;
    const pm25 = components.pm2_5 || 0;
    const pm10 = components.pm10 || 0;
    
    console.log(`OpenWeather values - PM2.5: ${pm25}, PM10: ${pm10}`);
    
    const result: AQISourceData = {
      pm25,
      pm10,
      source: 'OpenWeather',
      aqi_index: airData.main?.aqi || null, // OpenWeather's own AQI index (1-5)
      timestamp: new Date().toISOString(),
    };
    
    return result;
  } catch (error) {
    console.error("OpenWeather API error:", error);
    return null;
  }
}

// Calculate AQI from PM2.5 and PM10 values using EPA formula
function calculateAQI(pm25: number, pm10: number): AQIResult {
  console.log(`Calculating AQI from PM2.5: ${pm25}, PM10: ${pm10}`)
  
  // EPA breakpoints for PM2.5
  const pm25Breakpoints = [
    { min: 0, max: 12.0, aqiMin: 0, aqiMax: 50 },
    { min: 12.1, max: 35.4, aqiMin: 51, aqiMax: 100 },
    { min: 35.5, max: 55.4, aqiMin: 101, aqiMax: 150 },
    { min: 55.5, max: 150.4, aqiMin: 151, aqiMax: 200 },
    { min: 150.5, max: 250.4, aqiMin: 201, aqiMax: 300 },
    { min: 250.5, max: 500.4, aqiMin: 301, aqiMax: 500 }
  ];
  
  // EPA breakpoints for PM10
  const pm10Breakpoints = [
    { min: 0, max: 54, aqiMin: 0, aqiMax: 50 },
    { min: 55, max: 154, aqiMin: 51, aqiMax: 100 },
    { min: 155, max: 254, aqiMin: 101, aqiMax: 150 },
    { min: 255, max: 354, aqiMin: 151, aqiMax: 200 },
    { min: 355, max: 424, aqiMin: 201, aqiMax: 300 },
    { min: 425, max: 604, aqiMin: 301, aqiMax: 500 }
  ];
  
  // Calculate AQI for PM2.5
  let pm25AQI = 0;
  if (pm25 !== null && pm25 !== undefined) {
    for (const bp of pm25Breakpoints) {
      if (pm25 >= bp.min && pm25 <= bp.max) {
        pm25AQI = Math.round(
          ((bp.aqiMax - bp.aqiMin) / (bp.max - bp.min)) * (pm25 - bp.min) + bp.aqiMin
        );
        break;
      }
    }
    // Handle values above the highest breakpoint
    if (pm25 > pm25Breakpoints[pm25Breakpoints.length - 1].max) {
      pm25AQI = 500;
    }
  }
  
  // Calculate AQI for PM10
  let pm10AQI = 0;
  if (pm10 !== null && pm10 !== undefined) {
    for (const bp of pm10Breakpoints) {
      if (pm10 >= bp.min && pm10 <= bp.max) {
        pm10AQI = Math.round(
          ((bp.aqiMax - bp.aqiMin) / (bp.max - bp.min)) * (pm10 - bp.min) + bp.aqiMin
        );
        break;
      }
    }
    // Handle values above the highest breakpoint
    if (pm10 > pm10Breakpoints[pm10Breakpoints.length - 1].max) {
      pm10AQI = 500;
    }
  }
  
  // Return the higher of the two AQI values
  const aqi = Math.max(pm25AQI, pm10AQI);
  console.log(`Calculated raw AQI value: ${aqi}`);

  // Determine AQI level and recommendation
  let level = "Good";
  let recommendation = "Air quality is good. Enjoy your outdoor activities!";

  if (aqi > 300) {
    level = "Hazardous";
    recommendation = "Avoid all outdoor activities. Stay indoors with windows closed.";
  } else if (aqi > 200) {
    level = "Very Unhealthy";
    recommendation = "Avoid outdoor activities. Use air purifier if available.";
  } else if (aqi > 150) {
    level = "Unhealthy";
    recommendation = "Limit outdoor activities. Consider wearing a mask.";
  } else if (aqi > 100) {
    level = "Unhealthy for Sensitive Groups";
    recommendation = "Members of sensitive groups may experience health effects. The general public is less likely to be affected.";
  } else if (aqi > 50) {
    level = "Moderate";
    recommendation = "Air quality is acceptable. Sensitive groups should take precautions.";
  }
  
  const result: AQIResult = {
    aqi: Math.round(aqi),
    level,
    recommendation,
    pm25,
    pm10,
    timestamp: new Date().toISOString()
  };
  
  console.log(`Final AQI result:`, result);
  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  
  console.log(`AQI API request received for coordinates: ${lat}, ${lon}`);
  
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
      console.log(`Returning cached AQI data for ${cacheKey}`);
      return NextResponse.json(cachedData.data);
    }
    
    // Try OpenWeather first (more reliable), then fall back to OpenAQ
    let aqiData = await getAQIFromOpenWeather(String(lat), String(lon));
    let dataSource = 'OpenWeather';
    
    if (!aqiData || (aqiData.pm25 === 0 && aqiData.pm10 === 0)) {
      console.log('No data from OpenWeather, trying OpenAQ');
      aqiData = await getAQIFromOpenAQ(String(lat), String(lon));
      dataSource = 'OpenAQ';
    }
    
    if (!aqiData || (aqiData.pm25 === 0 && aqiData.pm10 === 0)) {
      console.log('No AQI data available from any source');
      return NextResponse.json(
        { error: "No AQI data available for this location" },
        { status: 404 }
      );
    }
    
    // Calculate AQI and get recommendations
    const result = calculateAQI(aqiData.pm25, aqiData.pm10);
    
    // Create the final result object
    const finalResult = {
      ...result,
      source: dataSource,
      pm25: aqiData.pm25,
      pm10: aqiData.pm10,
      timestamp: new Date().toISOString(),
      location: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      }
    };
    
    // Cache the result
    cache.set(cacheKey, {
      data: finalResult,
      timestamp: Date.now()
    });
    
    console.log(`Returning AQI data for ${cacheKey}:`, finalResult);
    return NextResponse.json(finalResult);
  } catch (error) {
    console.error('Error processing AQI request:', error);
    return NextResponse.json(
      { error: "Failed to process AQI request" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('AQI API: Received POST request')
  let body;
  try {
    body = await request.json()
  } catch (error) {
    console.error('AQI API: Error parsing request body:', error)
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }
  
  const { lat, lon } = body

  console.log(`AQI API: POST request body - lat: ${lat}, lon: ${lon}`)

  if (!lat || !lon) {
    console.log('AQI API: Missing required parameters in POST body')
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    )
  }

  // Check cache first
  const cacheKey = `${lat},${lon}`
  const cachedData = cache.get(cacheKey)
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log(`AQI API: Returning cached data for ${cacheKey}, age: ${(Date.now() - cachedData.timestamp) / 1000} seconds`)
    return NextResponse.json(cachedData.data)
  }

  console.log(`AQI API: No valid cache found for ${cacheKey}, fetching fresh data`)

  try {
    // Try OpenAQ first
    console.log('AQI API: Attempting to fetch data from OpenAQ')
    let aqiData = await getAQIFromOpenAQ(String(lat), String(lon))

    // If OpenAQ fails, try OpenWeather as fallback
    if (!aqiData) {
      console.log("AQI API: OpenAQ data fetch failed, falling back to OpenWeather API...")
      aqiData = await getAQIFromOpenWeather(String(lat), String(lon))
    } else {
      console.log("AQI API: Successfully retrieved data from OpenAQ")
    }

    if (!aqiData) {
      console.log("AQI API: Both OpenAQ and OpenWeather data fetches failed")
      return NextResponse.json(
        { error: "Could not retrieve AQI data from any source" },
        { status: 500 }
      )
    }

    console.log("AQI API: Calculating AQI from retrieved data")
    const result = calculateAQI(aqiData.pm25, aqiData.pm10)

    // Cache the result
    console.log(`AQI API: Caching result for ${cacheKey}`)
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    })

    console.log("AQI API: Returning fresh AQI data")
    return NextResponse.json(result)
  } catch (error) {
    console.error("AQI API: Error fetching AQI data:", error)
    return NextResponse.json(
      { error: "Failed to fetch AQI data", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
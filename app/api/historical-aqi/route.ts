import { NextResponse } from 'next/server';

// Cache for historical AQI data to reduce API calls
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
type CacheEntry = {
  data: any;
  timestamp: number;
  key: string;
};
const cache = new Map<string, CacheEntry>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const period = searchParams.get('period'); // daily, weekly, monthly

  if (!latitude || !longitude || !period) {
    return NextResponse.json({ error: 'Missing latitude, longitude, or period' }, { status: 400 });
  }

  // Create cache key
  const cacheKey = `${latitude}-${longitude}-${period}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Using cached historical AQI data for ${cacheKey}`);
    return NextResponse.json(cachedData.data);
  }

  const now = new Date();
  let startDate: Date;
  let endDate = new Date(now); // Create a new Date object to avoid modifying 'now'
  
  // Set time period based on request
  switch (period) {
    case 'daily':
      startDate = new Date(now);
      startDate.setHours(now.getHours() - 24);
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setHours(now.getHours() - 24);
  }

  try {
    // Format dates for API request
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`Fetching historical AQI data from ${startDateStr} to ${endDateStr} for coordinates: ${latitude}, ${longitude}`);
    
    // Use Open-Meteo Air Quality API for historical AQI data
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&start_date=${startDateStr}&end_date=${endDateStr}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi&timezone=auto`;
    
    console.log(`Requesting data from: ${url}`);
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const processedData = processHistoricalData(data);
    
    // Cache the results
    cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now(),
      key: cacheKey
    });
    
    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Error fetching historical AQI data:', error);
    return NextResponse.json({ error: 'Failed to fetch historical AQI data' }, { status: 500 });
  }
}

function processHistoricalData(data: any) {
  console.log('Processing historical AQI data from API response');
  
  if (!data || !data.hourly || !data.hourly.time || !Array.isArray(data.hourly.time) || data.hourly.time.length === 0) {
    console.error('Invalid data format from Open-Meteo API:', data);
    throw new Error('Invalid data format from Open-Meteo API');
  }
  
  const { time, pm10, pm2_5, carbon_monoxide, nitrogen_dioxide, sulphur_dioxide, ozone, european_aqi, us_aqi } = data.hourly;
  
  console.log(`Processing ${time.length} AQI data points from Open-Meteo API`);
  
  // Create an array of data points
  const historicalData = time.map((timestamp: string, index: number) => {
    // Format the date for display
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return {
      date: formattedDate,
      timestamp: timestamp,
      pm10: pm10 ? pm10[index] || 0 : 0,
      pm2_5: pm2_5 ? pm2_5[index] || 0 : 0,
      co: carbon_monoxide ? carbon_monoxide[index] || 0 : 0,
      no2: nitrogen_dioxide ? nitrogen_dioxide[index] || 0 : 0,
      so2: sulphur_dioxide ? sulphur_dioxide[index] || 0 : 0,
      o3: ozone ? ozone[index] || 0 : 0,
      aqi_eu: european_aqi ? european_aqi[index] || 0 : 0,
      aqi_us: us_aqi ? us_aqi[index] || 0 : 0
    };
  }).filter((item: any) => {
    // Filter out entries with invalid AQI values
    return item.aqi_eu > 0 || item.aqi_us > 0;
  });
  
  return historicalData;
}
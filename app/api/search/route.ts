import { NextResponse } from 'next/server';
import { performVectorSearch, seedVectorDatabase } from '@/lib/vector-search';
import clientPromise from '@/lib/mongodb';

// Mock data for location search results
const mockLocations = [
  {
    id: '1',
    location: 'New Delhi, India',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    aqi: 156,
    distance: '1.2 km away'
  },
  {
    id: '2',
    location: 'Mumbai, India',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    aqi: 89,
    distance: '1,200 km away'
  },
  {
    id: '3',
    location: 'Bangalore, India',
    coordinates: { lat: 12.9716, lng: 77.5946 },
    aqi: 62,
    distance: '2,100 km away'
  },
  {
    id: '4',
    location: 'Chennai, India',
    coordinates: { lat: 13.0827, lng: 80.2707 },
    aqi: 75,
    distance: '2,200 km away'
  },
  {
    id: '5',
    location: 'Kolkata, India',
    coordinates: { lat: 22.5726, lng: 88.3639 },
    aqi: 110,
    distance: '1,500 km away'
  }
];

// Seed the database on first load
// This is not ideal for production, but works for demonstration
let dbSeeded = false;
async function ensureDbSeeded() {
  if (!dbSeeded) {
    await seedVectorDatabase();
    dbSeeded = true;
  }
}

// Helper function to find the best matching vector search result using MongoDB
async function findBestVectorMatch(query: string) {
  try {
    // Ensure the database is seeded
    await ensureDbSeeded();
    
    // Perform vector search
    const result = await performVectorSearch(query);
    
    if (result) {
      return {
        summary: result.summary,
        chart: result.chart
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in vector search:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.toLowerCase() || '';
  const searchType = searchParams.get('type') || 'location';
  
  if (searchType === 'vector') {
    const vectorResult = await findBestVectorMatch(query);
    return NextResponse.json({ vectorResult });
  } else {
    // Default to location search
    // Filter locations based on query
    const results = query
      ? mockLocations.filter(location => 
          location.location.toLowerCase().includes(query)
        )
      : [];
    
    return NextResponse.json({ results });
  }
}

export async function POST(request: Request) {
  // This would be where you'd implement vector search in a real application
  try {
    const data = await request.json();
    const { query, type = 'vector' } = data;
    
    if (type === 'vector') {
      const vectorResult = await findBestVectorMatch(query);
      return NextResponse.json({ vectorResult });
    } else {
      // Handle location search via POST if needed
      const results = query
        ? mockLocations.filter(location => 
            location.location.toLowerCase().includes(query.toLowerCase())
          )
        : [];
      
      return NextResponse.json({ results });
    }
  } catch (error) {
    console.error('Error in POST search:', error);
    return NextResponse.json({ error: 'Failed to process search request' }, { status: 500 });
  }
}
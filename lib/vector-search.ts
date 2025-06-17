import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface AirQualityDocument {
  _id?: ObjectId;
  query: string;
  summary: string;
  embedding?: number[];
  chart: {
    date: string;
    aqi: number;
  }[];
  createdAt: Date;
}

// Function to perform vector search
export async function performVectorSearch(query: string, limit: number = 1) {
  try {
    const client = await clientPromise;
    const db = client.db('enviroguardian');
    const collection = db.collection<AirQualityDocument>('airQualityData');

    // First try to find an exact match by query text
    const exactMatch = await collection.findOne({ query: { $regex: new RegExp(query, 'i') } });
    if (exactMatch) {
      return exactMatch;
    }

    // If no exact match, use vector search
    // This assumes you've already set up a vector search index in MongoDB Atlas
    const vectorSearchResults = await collection.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: await getEmbedding(query),
          numCandidates: 100,
          limit: limit
        }
      },
      {
        $project: {
          _id: 1,
          query: 1,
          summary: 1,
          chart: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]).toArray();

    return vectorSearchResults.length > 0 ? vectorSearchResults[0] : null;
  } catch (error) {
    console.error('Error performing vector search:', error);
    return null;
  }
}

// Function to get embedding for a query
// In a real application, this would call an embedding API like OpenAI or HuggingFace
async function getEmbedding(text: string): Promise<number[]> {
  try {
    // For demonstration purposes, we'll use a simple embedding function
    // In a real application, you would call an embedding API
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY is not defined');
    }

    const response = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        },
        body: JSON.stringify({ inputs: text })
      }
    );

    if (!response.ok) {
      throw new Error(`Error from HuggingFace API: ${response.statusText}`);
    }

    const result = await response.json();
    return result[0];
  } catch (error) {
    console.error('Error getting embedding:', error);
    // Return a mock embedding for fallback
    return Array.from({ length: 384 }, () => Math.random() * 2 - 1);
  }
}

// Function to seed the database with initial data
export async function seedVectorDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db('enviroguardian');
    const collection = db.collection<AirQualityDocument>('airQualityData');

    // Check if we already have data
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log('Database already seeded with', count, 'documents');
      return;
    }

    // Initial seed data (similar to the mock data)
    const seedData = [
      {
        query: 'diwali',
        summary: "Based on historical data, air quality in Delhi shows significant deterioration during Diwali celebrations due to fireworks. AQI levels typically spike by 150-200 points within hours of celebrations, with PM2.5 being the primary pollutant. Recovery to pre-Diwali levels usually takes 3-5 days depending on weather conditions.",
        chart: [
          { date: "Oct 20", aqi: 120 },
          { date: "Oct 21", aqi: 135 },
          { date: "Oct 22", aqi: 142 },
          { date: "Oct 23", aqi: 160 },
          { date: "Oct 24", aqi: 310 }, // Diwali day
          { date: "Oct 25", aqi: 285 },
          { date: "Oct 26", aqi: 210 },
          { date: "Oct 27", aqi: 180 },
          { date: "Oct 28", aqi: 150 },
        ],
        createdAt: new Date()
      },
      {
        query: 'winter',
        summary: "Winter months in North India consistently show deteriorating air quality due to temperature inversions, reduced wind speed, and increased burning of fuel for heating. Delhi-NCR experiences 'severe' AQI readings (>400) frequently between November and February, with fog and smog conditions creating hazardous breathing conditions for vulnerable populations.",
        chart: [
          { date: "Nov 1", aqi: 180 },
          { date: "Dec 1", aqi: 320 },
          { date: "Jan 1", aqi: 340 },
          { date: "Feb 1", aqi: 270 },
          { date: "Mar 1", aqi: 190 },
        ],
        createdAt: new Date()
      },
      {
        query: 'monsoon',
        summary: "Monsoon season typically brings relief to air pollution in most Indian cities. Data shows AQI improvements of 30-50% during heavy rainfall periods as precipitation washes out particulate matter. However, certain industrial pollutants may increase in water bodies during this period due to runoff.",
        chart: [
          { date: "May 15", aqi: 110 },
          { date: "Jun 15", aqi: 95 },
          { date: "Jul 15", aqi: 65 },
          { date: "Aug 15", aqi: 60 },
          { date: "Sep 15", aqi: 75 },
        ],
        createdAt: new Date()
      },
      {
        query: 'crop',
        summary: "Crop burning in Punjab and Haryana significantly impacts Delhi-NCR's air quality each year. Data analysis shows AQI increases of 80-120 points within days of major burning events. Satellite imagery correlates directly with ground-level PM2.5 measurements, showing pollution plumes traveling 200-300km from source regions.",
        chart: [
          { date: "Oct 1", aqi: 120 },
          { date: "Oct 15", aqi: 180 },
          { date: "Nov 1", aqi: 320 },
          { date: "Nov 15", aqi: 380 },
          { date: "Dec 1", aqi: 290 },
        ],
        createdAt: new Date()
      },
      {
        query: 'delhi',
        summary: "Long-term analysis of Delhi's air quality shows a concerning trend with average annual AQI increasing by approximately 2.5% year-over-year for the past decade. While summer months show moderate improvement, winter pollution continues to worsen despite policy interventions. Vehicle emissions contribute approximately 40% of the pollution load, followed by industrial sources (25%) and dust (20%).",
        chart: [
          { date: "2018", aqi: 210 },
          { date: "2019", aqi: 215 },
          { date: "2020", aqi: 190 }, // COVID lockdown effect
          { date: "2021", aqi: 226 },
          { date: "2022", aqi: 235 },
          { date: "2023", aqi: 240 },
        ],
        createdAt: new Date()
      }
    ];

    // Generate embeddings for each document
    for (const doc of seedData) {
      (doc as AirQualityDocument).embedding = await getEmbedding(doc.query + ' ' + doc.summary);
    }

    // Insert the seed data
    await collection.insertMany(seedData);
    console.log('Database seeded with', seedData.length, 'documents');
  } catch (error) {
    console.error('Error seeding vector database:', error);
  }
}
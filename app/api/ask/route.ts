import { NextResponse } from "next/server";

// Define response categories type
type ResponseCategory = 'weather' | 'airQuality' | 'forecast' | 'location' | 'outdoor' | 'default';

// Categorized mock responses for different types of questions
const responses: Record<ResponseCategory, string[]> = {
  weather: [
    "The current weather conditions show partly cloudy skies with a temperature of 68°F. Humidity is at 45%.",
    "Today's forecast indicates clear skies with temperatures ranging from 65°F to 78°F. Wind speed is approximately 5 mph.",
    "We're expecting a mild day with temperatures around 72°F. There's a slight chance of light showers in the evening."
  ],
  airQuality: [
    "The current air quality index (AQI) is good with a value of 42. It's safe for outdoor activities.",
    "The air quality in your area is moderate with an AQI of 75. Sensitive groups may want to limit prolonged outdoor exposure.",
    "Today's air quality is excellent with an AQI of 35. It's a great day for outdoor activities."
  ],
  forecast: [
    "Based on the forecast, tomorrow will be sunny with a high of 75°F and a low of 60°F. The air quality is expected to remain good.",
    "The forecast shows a chance of rain tomorrow with temperatures ranging from 55°F to 70°F. Air quality will improve after the rain.",
    "The 5-day forecast indicates gradually warming temperatures with clear skies. No significant air quality concerns are expected."
  ],
  location: [
    "Based on your device's location data, you appear to be in or near a metropolitan area. Local environmental conditions are being monitored.",
    "Your current location has been detected. The environmental data being displayed is specific to your area.",
    "Location services indicate you're in a region with generally good air quality standards. Local monitoring stations are providing real-time data."
  ],
  outdoor: [
    "Current conditions are favorable for outdoor activities. The UV index is moderate, so consider sun protection if you'll be outside for extended periods.",
    "It's a good day to be outdoors. Air quality is good, and weather conditions are pleasant for most activities.",
    "Outdoor conditions are suitable for most activities today. Pollen counts are low, and air quality is within healthy ranges."
  ],
  default: [
    "I'm your environmental assistant. I can provide information about weather conditions, air quality, and environmental health recommendations.",
    "I'm here to help with environmental information. Feel free to ask about air quality, weather conditions, or health recommendations.",
    "As your environmental guardian, I can assist with questions about local air quality, weather patterns, and environmental health concerns."
  ]
};

export async function POST(req: Request) {
  const { question } = await req.json();
  console.log("Received question:", question);
  
  if (!question) {
    return NextResponse.json({ error: "No question provided." }, { status: 400 });
  }

  try {
    console.log("Processing question about weather or air quality");
    
    // Convert question to lowercase for easier matching
    const lowerQuestion = question.toLowerCase();
    
    // Determine the category based on keywords in the question
    let category: ResponseCategory = 'default';
    
    if (lowerQuestion.includes('weather') || lowerQuestion.includes('temperature') || 
        lowerQuestion.includes('hot') || lowerQuestion.includes('cold') || 
        lowerQuestion.includes('warm') || lowerQuestion.includes('cool')) {
      category = 'weather';
    } else if (lowerQuestion.includes('air quality') || lowerQuestion.includes('aqi') || 
               lowerQuestion.includes('pollution') || lowerQuestion.includes('pollutant')) {
      category = 'airQuality';
    } else if (lowerQuestion.includes('forecast') || lowerQuestion.includes('tomorrow') || 
               lowerQuestion.includes('next day') || lowerQuestion.includes('week')) {
      category = 'forecast';
    } else if (lowerQuestion.includes('location') || lowerQuestion.includes('where') || 
               lowerQuestion.includes('place') || lowerQuestion.includes('city') || 
               lowerQuestion.includes('area')) {
      category = 'location';
    } else if (lowerQuestion.includes('outdoor') || lowerQuestion.includes('outside') || 
               lowerQuestion.includes('go out') || lowerQuestion.includes('activity')) {
      category = 'outdoor';
    }
    
    // Select a random response from the appropriate category
    const categoryResponses = responses[category];
    const randomIndex = Math.floor(Math.random() * categoryResponses.length);
    const answer = categoryResponses[randomIndex];
    
    console.log(`Sending ${category} response:`, answer);
    
    // Add a small delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error in mock AI service:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: "Failed to get AI answer.", details: errorMessage }, { status: 500 });
  }
}
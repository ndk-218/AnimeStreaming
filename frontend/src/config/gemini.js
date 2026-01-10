// Google Gemini API Configuration
// Docs: https://ai.google.dev/gemini-api/docs

const GEMINI_CONFIG = {
  // API Key từ Google AI Studio
  apiKey: 'AIzaSyBWAd67CXGcSnnaJcMr8_z0QqieZ9nYTGc',
  
  // API Endpoint
  apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  
  // Model selection
  model: 'gemini-2.5-flash', // Stable Gemini 2.5 Flash - Fast & Free
  // Alternative: 'gemini-flash-latest' - Always latest stable version
  
  // Generation settings
  generationConfig: {
    temperature: 0.7,        // Creativity level (0.0 - 1.0)
    topK: 40,               // Top K sampling
    topP: 0.95,             // Top P sampling
    maxOutputTokens: 8192,  // Max response length (increased for longer responses)
  },
  
  // Safety settings (optional)
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
};

export default GEMINI_CONFIG;

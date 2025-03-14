import { VisionService } from './utils';
import { extractTextWithOpenRouter } from './openrouter-vision';
import { fileToBase64 } from './utils';

interface VisionResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{
          x: number;
          y: number;
        }>;
      };
    }>;
    error?: {
      message: string;
      code: number;
    };
  }>;
}

export async function extractTextFromImage(
  imageFile: File, 
  visionService: VisionService = VisionService.GOOGLE_CLOUD_VISION
): Promise<string> {
  // Use the selected vision service
  if (visionService === VisionService.OPENROUTER) {
    return extractTextWithOpenRouter(imageFile);
  } else {
    return extractTextWithGoogleVision(imageFile);
  }
}

async function extractTextWithGoogleVision(imageFile: File): Promise<string> {
  try {
    // Convert the image file to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Prepare the request to Google Cloud Vision API
    const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image.split(',')[1] // Remove the data URL prefix
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }
    
    const data = await response.json() as VisionResponse;
    
    // Check for errors in the response
    if (data.responses[0].error) {
      throw new Error(`Vision API error: ${data.responses[0].error.message}`);
    }
    
    // Extract the text from the response
    const extractedText = data.responses[0].textAnnotations?.[0]?.description || '';
    return extractedText;
    
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

export async function extractIngredientsFromText(text: string): Promise<string[]> {
  // Look for common patterns that indicate ingredients lists
  const ingredientsRegex = /ingredients:?\s*([^.]*)/i;
  const match = text.match(ingredientsRegex);
  
  if (match && match[1]) {
    // Split the ingredients by common separators
    const ingredientsText = match[1].trim();
    const ingredients = ingredientsText
      .split(/,|\.|•|\*|;/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    return ingredients;
  }
  
  // If no ingredients section is found, try to extract any words that might be ingredients
  // This is a fallback and might not be accurate
  const words = text
    .split(/\s+/)
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 2 && !/^\d+$/.test(word)); // Filter out numbers and very short words
  
  return [...new Set(words)]; // Remove duplicates
}

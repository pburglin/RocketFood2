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
  visionService: VisionService
): Promise<string> {
  // Use the service specified in the .env file
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
  
  let ingredientsText = '';
  
  if (match && match[1]) {
    // Get the ingredients text
    ingredientsText = match[1].trim();
  } else {
    // If no ingredients section is found, use the full text
    ingredientsText = text;
  }
  
  // First, replace specific separators with a standard separator
  // Replace "and/or" and "or" with a standard separator
  let processedText = ingredientsText
    .replace(/\s+and\/or\s+/gi, ', ')
    .replace(/\s+and\s+/gi, ', ')
    .replace(/\s+or\s+/gi, ', ');
  
  // Handle parentheses by replacing them with commas
  processedText = processedText.replace(/\(/g, ', ').replace(/\)/g, ', ');
  
  // Replace line breaks with commas (new requirement)
  processedText = processedText.replace(/\n/g, ', ');
  
  // Replace " - " with commas (new requirement)
  processedText = processedText.replace(/\s-\s/g, ', ');
  
  // Fix " -" without a space on the right side (new requirement)
  // For example, "red 40 -lake" should be "red 40 lake"
  processedText = processedText.replace(/\s-([^\s])/g, ' $1');
  
  // Split by common separators and clean up each ingredient
  const ingredients = processedText
    .split(/,|\.|•|\*|;/)
    .map(item => item.trim())
    .filter(item => item.length > 0 && !/^\d+$/.test(item)); // Filter out numbers and empty items
  
  return [...new Set(ingredients)]; // Remove duplicates
}

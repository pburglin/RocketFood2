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
  const ingredientsRegex = /(?:ingredients|contains|made with):?\s*([\s\S]*?)(?:\n\n|$)/i;
  const match = text.match(ingredientsRegex);
  
  let ingredientsText = '';
  
  if (match && match[1]) {
    // Get the ingredients text
    ingredientsText = match[1].trim();
  } else {
    // If no ingredients section is found, look for text that looks like an ingredients list
    // Common patterns: text with many commas, or text with many line breaks
    const likelyIngredients = text.split(/\n\n/)[0]; // Take first paragraph if multi-paragraph
    ingredientsText = likelyIngredients.includes(',') || likelyIngredients.split('\n').length > 3
      ? likelyIngredients
      : text;
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
  
  // Split by common separators while preserving multi-word ingredients
  const ingredients = processedText
    .split(/(?:,\s*|\n\s*|•\s*|\*\s*|;\s*)(?![^(]*\))/) // Split but avoid splitting inside parentheses
    .map(item => {
      // Clean up each ingredient
      let cleaned = item.trim();
      // Remove any remaining leading/trailing punctuation
      cleaned = cleaned.replace(/^[,\-•*;.]+|[,\-•*;.]+$/g, '').trim();
      // Remove any percentage values
      cleaned = cleaned.replace(/\s*\d+%\s*/g, ' ').trim();
      return cleaned;
    })
    .filter(item => {
      // Filter out empty items, pure numbers, and common non-ingredient text
      return item.length > 0 &&
             !/^\d+$/.test(item) &&
             !/contains|ingredients|allergens|may contain/i.test(item);
    });
  
  return [...new Set(ingredients)]; // Remove duplicates
}

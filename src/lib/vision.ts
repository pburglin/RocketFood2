import { VisionService, fileToBase64 } from './utils';
// Assuming extractTextWithOpenRouter is defined elsewhere
// If not, you might need to import it or handle the 'openrouter' case differently
// For now, we assume it exists and works similarly to extractTextWithGoogleVision
import { extractTextWithOpenRouter } from './openrouter-vision';

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

// Helper function to introduce a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to extract text using Google Cloud Vision API
async function extractTextWithGoogleVision(imageFile: File): Promise<string> {
  console.log('Using Google Cloud Vision');
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    console.error("Error: VITE_GOOGLE_CLOUD_VISION_API_KEY is not set or is set to the default placeholder.");
    throw new Error("Missing or invalid Google Cloud Vision API Key");
  }
  const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  try {
    const base64Image = await fileToBase64(imageFile);
    // Basic check for empty or placeholder image data
    if (!base64Image || base64Image.split(',')[1]?.length < 100) {
        console.warn("Image file might be empty or invalid.");
    }

    const requestBody = {
      requests: [
        {
          image: {
            // Ensure the base64 string is correctly formatted
            content: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1 // Get the full text block
            }
          ]
        }
      ]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Log more details on fetch failure
      console.error(`Google Cloud Vision API request failed: ${response.status} ${response.statusText}`);
      try {
        const errorBody = await response.text();
        console.error("Error response body:", errorBody);
      } catch {
        // Ignore if reading the body fails
      }
      throw new Error(`Google Cloud Vision API error: ${response.statusText}`);
    }

    const data = await response.json() as VisionResponse;

    // Check for errors within the Vision API response itself
    if (data.responses && data.responses[0].error) {
      console.error("Google Cloud Vision API returned an error:", data.responses[0].error.message);
      throw new Error(`Vision API error: ${data.responses[0].error.message}`);
    }

    // Extract the text from the response
    const extractedText = data.responses?.[0]?.textAnnotations?.[0]?.description || '';
    if (!extractedText) {
        console.warn("Google Cloud Vision returned no text.");
    }
    return extractedText;

  } catch (error) {
    console.error('Error in extractTextWithGoogleVision:', error);
    // Re-throw the error to be caught by the retry logic
    throw error;
  }
}

// Callback type for retry attempts
export type OnRetryAttemptCallback = (attempt: number, maxRetries: number) => void;

// Main function to extract text, now with retry logic and callback
export async function extractTextFromImage(
  imageFile: File,
  visionService: VisionService = VisionService.GOOGLE_CLOUD_VISION, // Default to Google if not specified
  onRetryAttempt?: OnRetryAttemptCallback // Optional callback for UI feedback
): Promise<string> {
  // Get retry count from environment variable, default to 1 retry (2 attempts total)
  const maxRetries = parseInt(import.meta.env.VITE_OCR_RETRY_COUNT || '1', 10);
  // Get initial delay from environment variable, default to 500ms
  const initialDelay = parseInt(import.meta.env.VITE_OCR_RETRY_DELAY_MS || '500', 10);
  // Get factor for exponential backoff, default to 2
  const backoffFactor = parseFloat(import.meta.env.VITE_OCR_RETRY_BACKOFF_FACTOR || '1.5');


  let attempts = 0;
  let currentDelay = initialDelay;

  while (attempts <= maxRetries) {
    try {
      console.log(`Attempting OCR call (${attempts + 1}/${maxRetries + 1})...`);
      let result: string;
      if (visionService === VisionService.OPENROUTER) {
        // Assuming extractTextWithOpenRouter handles its own errors/retries if necessary
        // Or implement similar retry logic within extractTextWithOpenRouter
        console.log('Using OpenRouter Vision');
        result = await extractTextWithOpenRouter(imageFile);
      } else {
        // Default to Google Vision API
        result = await extractTextWithGoogleVision(imageFile);
      }

      // If the call succeeds and returns a non-empty string, return it
      // Allow empty string result if the image genuinely has no text
      console.log(`OCR call attempt ${attempts + 1} successful.`);
      return result; // Return result even if empty, let caller decide if it's an error

    } catch (error) {
      attempts++;
      console.error(`Error during OCR call (attempt ${attempts}/${maxRetries + 1}):`, error);

      if (attempts > maxRetries) {
        console.error("Maximum OCR retries reached. Giving up.");
        throw error; // Rethrow the final error after all retries failed
      }

      // Notify UI about the retry attempt
      if (onRetryAttempt) {
        onRetryAttempt(attempts, maxRetries);
      }

      console.log(`Retrying OCR call after ${Math.round(currentDelay)}ms...`);
      await delay(currentDelay);
      // Apply exponential backoff with jitter
      currentDelay = currentDelay * backoffFactor + (Math.random() * initialDelay * 0.1);
    }
  }

  // This part should ideally not be reached if the loop logic is correct
  // but serves as a fallback error
  throw new Error("Failed to extract text after multiple retries.");
}


// Function to extract ingredients from text (remains the same, but improved robustness)
export async function extractIngredientsFromText(text: string): Promise<string[]> {
    if (!text) {
        return []; // Return empty array if input text is empty or null
    }

    // Normalize text: convert to lowercase, replace common separators, handle line breaks
    let processedText = text.toLowerCase();
    processedText = processedText.replace(/\r\n|\r|\n/g, ' '); // Replace line breaks with spaces
    processedText = processedText.replace(/,(?!\s)/g, ', '); // Ensure space after comma
    processedText = processedText.replace(/\s+/g, ' '); // Normalize whitespace to single spaces
    processedText = processedText.replace(/\s*[:;]\s*/g, ', '); // Replace colons/semicolons with comma + space
    processedText = processedText.replace(/\s*\.\s*/g, '. '); // Ensure space after period
    processedText = processedText.replace(/\s*\(\s*/g, ' ('); // Ensure space before opening parenthesis
    processedText = processedText.replace(/\s*\)\s*/g, ') '); // Ensure space after closing parenthesis
    processedText = processedText.replace(/\s*\[\s*/g, ' ['); // Ensure space before opening bracket
    processedText = processedText.replace(/\s*\]\s*/g, '] '); // Ensure space after closing bracket
    processedText = processedText.replace(/\s*\{\s*/g, ' {'); // Ensure space before opening brace
    processedText = processedText.replace(/\s*\}\s*/g, '} '); // Ensure space after closing brace

    // Attempt to identify the ingredients list more reliably
    // Look for keywords indicating the start of the list
    const keywords = [
        'ingredients:', 'contains:', 'made with:', 'components:',
        'allergy advice:', 'allergy information:', 'may contain traces of:'
    ];
    let ingredientsSection = '';
    let foundKeyword = false;
    for (const keyword of keywords) {
        const index = processedText.indexOf(keyword);
        if (index !== -1) {
            ingredientsSection = processedText.substring(index + keyword.length);
            foundKeyword = true;
            break;
        }
    }

    // If no keyword found, use the whole text but be cautious
    if (!foundKeyword) {
        // Simple heuristic: if text is short, assume it's all ingredients
        // Otherwise, maybe it's not an ingredients list? This needs refinement.
        ingredientsSection = text.length < 300 ? processedText : ''; // Adjust threshold as needed
        if (!ingredientsSection) {
            console.warn("Could not reliably identify ingredients list. Processing entire text.");
            ingredientsSection = processedText; // Fallback to processing everything
        }
    }

    // Further clean the extracted section: remove common disclaimers appearing after ingredients
    const disclaimerKeywords = [
        'manufactured by', 'distributed by', 'product of', 'imported by',
        'best before', 'use by', 'store in', 'keep refrigerated',
        'nutrition facts', 'serving size', 'calories', 'sugars'
    ];
    for (const keyword of disclaimerKeywords) {
        const index = ingredientsSection.indexOf(keyword);
        if (index !== -1) {
            // Take only the part before the disclaimer
            ingredientsSection = ingredientsSection.substring(0, index);
        }
    }

    // Split into potential ingredients based on common delimiters
    // Include splitting by '.', '!', '?' unless preceded by a digit (e.g., Vitamin B12)
    const potentialIngredients = ingredientsSection
        .split(/[,;•*]|\s\/\s|(?<!\d)[.!?](?!\d)/g)
        .map(item => {
            // Clean up each potential ingredient item
            let cleaned = item.trim();
            // Remove text within parentheses (often explanations or sub-ingredients)
            // Keep content for potential later processing if needed
            cleaned = cleaned.replace(/\([^)]*\)/g, '');
            // Remove text within brackets and braces
            cleaned = cleaned.replace(/\[[^\]]*\]/g, '');
            cleaned = cleaned.replace(/\{[^}]*\}/g, '');
            // Remove leading/trailing punctuation and whitespace
            cleaned = cleaned.replace(/^[,\-•*[]{}(), \s]+|[,\-•*[]{}(), \s]+$/g, '').trim();
            // Remove common units and measures if they appear alone
            cleaned = cleaned.replace(/^\s*(g|mg|ml|oz|fl oz|kg|lb|cup|tbsp|tsp|serving|piece|slice)\s*$/i, '');
            // Remove percentages like "100%"
            cleaned = cleaned.replace(/^\d+(\.\d+)?%\s*$/, '');
            // Convert multiple spaces to single space
            cleaned = cleaned.replace(/\s+/g, ' ');

            return cleaned;
        })
        // Filter out empty strings and common non-ingredient words/phrases
        .filter(item => {
            const lowerItem = item.toLowerCase();
            return item.length > 1 && // Keep single letters if needed, adjust as necessary
                   !/^\d+(\.\d+)?%?$/.test(item) && // Exclude numbers and percentages
                   !/^(?:contains|ingredients|nutrition|facts|allergy|information|made in|processed in|manufactured in|distributed by|best before|use by|e\.g\.|i\.e\.|and|or|with|less than|of)$/i.test(lowerItem); // Exclude common non-ingredient words
        });

    // Remove duplicates by converting to Set and back to Array
    const uniqueIngredients = [...new Set(potentialIngredients)];

    return uniqueIngredients;
}

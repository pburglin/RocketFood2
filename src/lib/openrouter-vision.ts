import { fileToBase64 } from './utils';

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

export async function extractTextWithOpenRouter(imageFile: File): Promise<string> {
  try {
    // Convert the image file to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Prepare the request to OpenRouter API
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const model = import.meta.env.VITE_OPENROUTER_VISION_MODEL || 'meta-llama/llama-3.2-11b-vision-instruct:free';
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Read and extract all text from this food ingredient label. Focus on the ingredients list. Return ONLY the text you see, formatted exactly as it appears on the label.'
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ]
    };
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }
    
    const data = await response.json() as OpenRouterResponse;
    
    // Extract the text from the response
    const extractedText = data.choices[0]?.message.content || '';
    return extractedText;
    
  } catch (error) {
    console.error('Error extracting text with OpenRouter:', error);
    throw error;
  }
}

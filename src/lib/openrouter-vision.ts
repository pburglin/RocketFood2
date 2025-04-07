import { fileToBase64 } from './utils';

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
    
    const data = await response.json(); // Parse JSON first
    console.log('OpenRouter API Response:', JSON.stringify(data, null, 2)); // Log the full response

    // Validate the response structure before accessing nested properties
    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('Invalid or empty response structure from OpenRouter:', data);
      throw new Error('Received an unexpected response format from the vision service. Please try again.');
    }

    // Check if the first choice has the expected message structure
    if (!data.choices[0].message || typeof data.choices[0].message.content !== 'string') {
        console.error('Invalid message structure in OpenRouter response choice:', data.choices[0]);
        throw new Error('The vision service returned an incomplete analysis. Please try again.');
    }
    
    // Extract the text from the response
    const extractedText = data.choices[0].message.content || '';
    return extractedText;
    
  } catch (error) {
    // Log the specific error before re-throwing
    console.error('Error during OpenRouter text extraction:', error);
    // If it's one of our custom errors, re-throw it directly
    if (error instanceof Error && (error.message.startsWith('Received an unexpected response format') || error.message.startsWith('The vision service returned an incomplete analysis'))) {
        throw error;
    }
    // Otherwise, wrap it in a generic error message for the user
    throw new Error('Failed to process image due to a network or API issue. Please check your connection and try again.');
  }
}

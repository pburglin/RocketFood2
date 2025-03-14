import { LLMResponse, LLMIngredientResponse } from '../types';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function queryLLMForIngredients(ingredients: string[]): Promise<LLMIngredientResponse | null> {
  const prompt = `
In a scale of Green as healthy, Yellow as warning and Red as unhealthy, analyze these food ingredients: ${ingredients.join(', ')}

Return a JSON structure with 1. how healthy each food ingredient is, 2. in a single sentence, why; and 3. what are potential alternative healthier ingredients.

Return ONLY a valid JSON structure like this example:
{
  "ingredient_name": {
    "healthCategory": "RED",
    "description": "Reason why this ingredient is unhealthy",
    "alternatives": ["healthier alternative 1", "healthier alternative 2"]
  },
  "another_ingredient": {
    "healthCategory": "GREEN",
    "description": "Reason why this ingredient is healthy",
    "alternatives": []
  }
}
`;

  try {
    const content = await aiOptimize(prompt);
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in LLM response');
      return null;
    }
    
    const jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr) as LLMIngredientResponse;
  } catch (error) {
    console.error('Error querying LLM for ingredients:', error);
    return null;
  }
}

export async function aiOptimize(input: string): Promise<string> {
  const prompt = `${input}`;

  const requestPayload = {
    model: import.meta.env.VITE_LLM_MODEL_NAME,
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: Number(import.meta.env.VITE_LLM_SUMMARY_TOKENS || 512),
    temperature: Number(import.meta.env.VITE_LLM_STORY_TEMPERATURE || 0.7),
  };

  try {
    const response = await fetch(import.meta.env.VITE_LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + import.meta.env.VITE_LLM_API_KEY
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to query LLM: ${error}`);
    }

    const data: LLMResponse = await response.json();
    const content = data.choices[0]?.message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return content;
  } catch (error) {
    console.error('Error optimizing text:', error);
    throw error;
  }
}

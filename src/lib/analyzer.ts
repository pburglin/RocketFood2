import { INGREDIENTS_DATABASE } from '../data/ingredients';
import { AnalysisResult } from '../types';
import { queryLLMForIngredients } from './llm';

// Add optional allergies parameter
export async function analyzeIngredients(ingredients: string[], allergies: string[] = []): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  const unknownIngredients: string[] = [];
  
  // First pass: check against our local database
  for (const ingredient of ingredients) {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    
    // Skip empty ingredients
    if (!normalizedIngredient) continue;
    
    // Check if the ingredient is in our database
    if (normalizedIngredient in INGREDIENTS_DATABASE.green) {
      results.push({
        ingredient: normalizedIngredient,
        category: 'green',
        description: INGREDIENTS_DATABASE.green[normalizedIngredient].description,
        alternatives: INGREDIENTS_DATABASE.green[normalizedIngredient].alternatives
      });
    } else if (normalizedIngredient in INGREDIENTS_DATABASE.yellow) {
      results.push({
        ingredient: normalizedIngredient,
        category: 'yellow',
        description: INGREDIENTS_DATABASE.yellow[normalizedIngredient].description,
        alternatives: INGREDIENTS_DATABASE.yellow[normalizedIngredient].alternatives
      });
    } else if (normalizedIngredient in INGREDIENTS_DATABASE.red) {
      results.push({
        ingredient: normalizedIngredient,
        category: 'red',
        description: INGREDIENTS_DATABASE.red[normalizedIngredient].description,
        alternatives: INGREDIENTS_DATABASE.red[normalizedIngredient].alternatives
      });
    } else {
      // If not found in our database, add to unknown ingredients
      unknownIngredients.push(normalizedIngredient);
    }
  }
  
  // Second pass: query LLM for unknown ingredients
  if (unknownIngredients.length > 0) {
    try {
      // Pass allergies to the LLM query
      const llmResponse = await queryLLMForIngredients(unknownIngredients, allergies); 
      
      if (llmResponse) {
        for (const [ingredient, data] of Object.entries(llmResponse)) {
          let category: 'green' | 'yellow' | 'red' | 'unknown' = 'unknown';
          let description = 'Unknown ingredient, could not be analyzed';
          let alternatives: string[] = [];

          if (data && data.healthCategory) {
            category = data.healthCategory.toLowerCase() as 'green' | 'yellow' | 'red';
            description = data.description;
            alternatives = data.alternatives;
          }

          results.push({
            ingredient,
            category,
            description,
            alternatives
          });
        }
      } else {
        // If LLM fails, mark all unknown ingredients as unknown
        for (const ingredient of unknownIngredients) {
          results.push({
            ingredient,
            category: 'unknown',
            description: 'Unknown ingredient, could not be analyzed',
            alternatives: []
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing unknown ingredients:', error);
      // Mark all unknown ingredients as unknown
      for (const ingredient of unknownIngredients) {
        results.push({
          ingredient,
          category: 'unknown',
          description: 'Unknown ingredient, could not be analyzed',
          alternatives: []
        });
      }
    }
  }
  
  return results;
}

export function getOverallScore(results: AnalysisResult[]): { score: 'green' | 'yellow' | 'red', reason: string } {
  if (results.length === 0) {
    return { score: 'green', reason: 'No ingredients to analyze' };
  }
  
  const counts = {
    green: results.filter(r => r.category === 'green').length,
    yellow: results.filter(r => r.category === 'yellow').length,
    red: results.filter(r => r.category === 'red').length,
    unknown: results.filter(r => r.category === 'unknown').length
  };
  
  const total = results.length;
  
  // Check if any of the first three ingredients are red
  const firstThree = results.slice(0, 3);
  const hasRedInFirstThree = firstThree.some(r => r.category === 'red');
  
  // If any of the first three ingredients are red, the overall score is red
  if (hasRedInFirstThree) {
    return { 
      score: 'red', 
      reason: 'One or more of the main ingredients are harmful or toxic' 
    };
  }
  
  // If more than 20% of ingredients are red, the overall score is red
  if (counts.red / total > 0.2) {
    return { 
      score: 'red', 
      reason: `${counts.red} out of ${total} ingredients are harmful or toxic` 
    };
  }
  
  // If more than 40% of ingredients are yellow or red, the overall score is yellow
  if ((counts.yellow + counts.red) / total > 0.4) {
    return { 
      score: 'yellow', 
      reason: `${counts.yellow + counts.red} out of ${total} ingredients are concerning or harmful` 
    };
  }
  
  // If more than 70% of ingredients are green, the overall score is green
  if (counts.green / total > 0.7) {
    return { 
      score: 'green', 
      reason: `${counts.green} out of ${total} ingredients are generally safe and natural` 
    };
  }
  
  // Default to yellow if none of the above conditions are met
  return { 
    score: 'yellow', 
    reason: 'Mixed ingredients with some concerns' 
  };
}

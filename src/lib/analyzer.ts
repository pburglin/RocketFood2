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
    let foundInDb = false;
    let dbCategory: 'green' | 'yellow' | 'red' | null = null;
    let dbData: { description: string; alternatives: string[] } | null = null;

    if (normalizedIngredient in INGREDIENTS_DATABASE.green) {
      foundInDb = true;
      dbCategory = 'green';
      dbData = INGREDIENTS_DATABASE.green[normalizedIngredient];
    } else if (normalizedIngredient in INGREDIENTS_DATABASE.yellow) {
      foundInDb = true;
      dbCategory = 'yellow';
      dbData = INGREDIENTS_DATABASE.yellow[normalizedIngredient];
    } else if (normalizedIngredient in INGREDIENTS_DATABASE.red) {
      foundInDb = true;
      dbCategory = 'red';
      dbData = INGREDIENTS_DATABASE.red[normalizedIngredient];
    }

    if (foundInDb && dbCategory && dbData) {
      // Check for allergy immediately if found in DB
      const isAllergen = allergies.some(allergy =>
        normalizedIngredient === allergy.toLowerCase() ||
        new RegExp(`\\b${allergy.toLowerCase()}\\b`).test(normalizedIngredient)
      );

      let currentCategory = dbCategory;
      let currentDescription = dbData.description;

      if (isAllergen && currentCategory !== 'red') {
        currentDescription = `Marked as red because it's in your allergy profile (original classification: ${currentCategory}). Original description: ${dbData.description}`;
        currentCategory = 'red';
      } else if (isAllergen && currentCategory === 'red') {
         currentDescription = `This ingredient is classified as red and is also listed in your allergy profile. Original description: ${dbData.description}`;
      }

      // Add the result (potentially modified by allergy check)
      results.push({
        ingredient: normalizedIngredient,
        category: currentCategory,
        description: currentDescription,
        alternatives: dbData.alternatives
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

  // Final pass: Override category to 'red' for any allergens and update description
  // This pass now primarily handles results from the LLM or acts as a final safety check
  // (The immediate check during the DB lookup handles most cases now)
  if (allergies.length > 0) {
    for (const result of results) {
      // Check if this result hasn't already been processed by the DB check
      // We can identify these as results potentially coming from the LLM pass
      // or edge cases missed. A simple check is if the description already indicates an allergy override.
      if (result.description.includes("Marked as red because it's in your allergy profile") || result.description.includes("classified as red and is also listed in your allergy profile")) {
          continue; // Already handled
      }

      const isAllergen = allergies.some(allergy => {
        // Use a more robust check: exact match or word boundary match
        const match = result.ingredient.toLowerCase() === allergy.toLowerCase() ||
        new RegExp(`\\b${allergy.toLowerCase()}\\b`).test(result.ingredient.toLowerCase());
        return match;
      });

      if (isAllergen && result.category !== 'red') { // Only modify if not already red
        const originalCategory = result.category;
        const originalDescription = result.description;
        result.category = 'red';
        result.description = `Marked as red because it's in your allergy profile (original classification: ${originalCategory}). Original description: ${originalDescription}`;
      } else if (isAllergen && result.category === 'red') {
        // If it was already red, just add a note that it's also an allergen
         result.description = `This ingredient is classified as red and is also listed in your allergy profile. Original description: ${result.description}`;
      }
    }
  }

  return results;
}

// Add allergies parameter
export function getOverallScore(results: AnalysisResult[], allergies: string[] = []): { score: 'green' | 'yellow' | 'red', reason: string } {
  if (results.length === 0) {
    return { score: 'green', reason: 'No ingredients to analyze' };
  }

  // Check for allergens first (using the final results array which should have overrides applied)
  const allergenFound = results.some(result => result.category === 'red' && allergies.some(allergy =>
      result.ingredient.toLowerCase() === allergy.toLowerCase() ||
      new RegExp(`\\b${allergy.toLowerCase()}\\b`).test(result.ingredient.toLowerCase())
  ));


  if (allergenFound) {
    return {
      score: 'red',
      reason: 'Contains an ingredient you are allergic to.'
    };
  }

  const counts = {
    green: results.filter(r => r.category === 'green').length,
    yellow: results.filter(r => r.category === 'yellow').length,
    red: results.filter(r => r.category === 'red').length,
    unknown: results.filter(r => r.category === 'unknown').length
  };

  const total = results.length;

  // Check if ANY ingredient is red (could be non-allergen red)
  const hasRedIngredient = results.some(r => r.category === 'red');
  if (hasRedIngredient) {
     return {
       score: 'red',
       reason: 'Contains one or more harmful, toxic, or allergenic ingredients.' // Updated reason
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

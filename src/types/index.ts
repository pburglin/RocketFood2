export interface Ingredient {
  description: string;
  alternatives: string[];
}

export interface IngredientDatabase {
  green: Record<string, Ingredient>;
  yellow: Record<string, Ingredient>;
  red: Record<string, Ingredient>;
  misleadingProducts: Record<string, {
    description: string;
    realIngredients: string;
  }>;
  tips: string[];
}

export interface AnalysisResult {
  ingredient: string;
  category: 'green' | 'yellow' | 'red' | 'unknown';
  description: string;
  alternatives: string[];
}

export interface LLMIngredientResponse {
  [key: string]: {
    healthCategory: 'GREEN' | 'YELLOW' | 'RED';
    description: string;
    alternatives: string[];
  };
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
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

import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AnalysisResult } from '../types';

interface AnalysisResultsProps {
  results: AnalysisResult[];
  overallScore: {
    score: 'green' | 'yellow' | 'red';
    reason: string;
  };
  rawText: string;
  allergies?: string[]; // Add allergies prop
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, overallScore, rawText, allergies = [] }) => { // Destructure allergies with default
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});
  const [showRawText, setShowRawText] = React.useState(false);
  
  const toggleItem = (ingredient: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'green':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'yellow':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'red':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getScoreBackground = (score: string) => {
    switch (score) {
      case 'green':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'red':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };
  
  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'green':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'yellow':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'red':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <HelpCircle className="h-8 w-8 text-gray-500" />;
    }
  };

  const categoryOrder: Record<string, number> = {
    red: 1,
    yellow: 2,
    green: 3,
  };

  const sortedResults = results
    .filter(result => !['healthcategory', 'description', 'alternatives'].includes(result.ingredient.toLowerCase()))
    .sort((a, b) => {
      // Check if items are allergens
      const isAllergenA = allergies.some(allergy => a.ingredient.toLowerCase().includes(allergy.toLowerCase()));
      const isAllergenB = allergies.some(allergy => b.ingredient.toLowerCase().includes(allergy.toLowerCase()));

      // Determine sort order: Allergens first (like 'red'), then by category
      const sortOrderA = isAllergenA ? 1 : (categoryOrder[a.category] || 4);
      const sortOrderB = isAllergenB ? 1 : (categoryOrder[b.category] || 4);

      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB; // Sort by effective order (allergen > red > yellow > green > unknown)
      }

      // If effective orders are the same, sort alphabetically by ingredient name
      return a.ingredient.localeCompare(b.ingredient);
    });
  
  if (results.length === 0) {
    return null;
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className={`mb-6 p-4 rounded-lg border ${getScoreBackground(overallScore.score)}`}>
        <div className="flex items-center">
          {getScoreIcon(overallScore.score)}
          <div className="ml-3">
            <h3 className="text-lg font-semibold">
              {overallScore.score === 'green' ? 'Healthy Choice' : 
               overallScore.score === 'yellow' ? 'Use Caution' : 'Not Recommended'}
            </h3>
            <p>{overallScore.reason}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-lg font-medium text-gray-800">Ingredients Analysis</h3>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {sortedResults.map((result, index) => (
              <li key={index} className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleItem(result.ingredient)}
                >
                  <div className="flex items-center">
                    {(() => {
                      // Check if any allergy is a substring of the ingredient (case-insensitive)
                      const isAllergen = allergies.some(allergy => 
                        result.ingredient.toLowerCase().includes(allergy.toLowerCase())
                      );
                      // Determine the icon based on allergen status
                      const icon = isAllergen 
                        ? <XCircle className="h-5 w-5 text-red-500" /> 
                        : getCategoryIcon(result.category);

                      return (
                        <>
                          {icon}
                          <span className={`ml-2 font-medium ${
                            isAllergen ? 'text-red-600 font-bold' : '' // Removed dark theme class
                          }`}>
                            {result.ingredient}
                            {isAllergen && ' (Allergen)'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  {expandedItems[result.ingredient] ?
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : // Removed dark theme class
                    <ChevronDown className="h-5 w-5 text-gray-400" /> // Removed dark theme class
                  }
                </div>

                {expandedItems[result.ingredient] && (
                  // Removed dark theme classes
                  <div className="mt-2 pl-7 text-gray-600"> 
                    <p className="mb-2">{result.description}</p>
                    {result.alternatives.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Healthier alternatives:</p>
                        <ul className="list-disc pl-5 text-sm">
                          {result.alternatives.map((alt, i) => (
                            <li key={i}>{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
        </ul>
      </div>
      
      <div className="mt-6">
        <button
          onClick={() => setShowRawText(!showRawText)}
          // Removed dark theme classes
          className="flex items-center text-sm text-gray-600 hover:text-gray-800" 
        >
          {showRawText ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {showRawText ? 'Hide extracted text' : 'Show extracted text'}
        </button>
        
        {showRawText && (
          // Removed dark theme classes
          <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700 whitespace-pre-wrap"> 
            {rawText || 'No text extracted'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;

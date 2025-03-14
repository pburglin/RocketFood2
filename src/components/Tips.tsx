import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { INGREDIENTS_DATABASE } from '../data/ingredients';

const Tips: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-white rounded-lg shadow-md overflow-hidden">
      <div 
        className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Info className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-800">Reading Food Labels: Tips & Tricks</h3>
        </div>
        {isExpanded ? 
          <ChevronUp className="h-5 w-5 text-gray-400" /> : 
          <ChevronDown className="h-5 w-5 text-gray-400" />
        }
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <ul className="space-y-3">
            {INGREDIENTS_DATABASE.tips.map((tip, index) => (
              <li key={index} className="flex">
                <span className="font-bold text-blue-600 mr-2">{index + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-800 mb-2">Common Misleading Product Names:</h4>
            <ul className="space-y-4">
              {Object.entries(INGREDIENTS_DATABASE.misleadingProducts).map(([product, info], index) => (
                <li key={index} className="bg-yellow-50 p-3 rounded-md">
                  <p className="font-medium text-yellow-800">{product}</p>
                  <p className="text-gray-700 text-sm mt-1">{info.description}</p>
                  <p className="text-gray-700 text-sm mt-1"><strong>Real ingredients should be:</strong> {info.realIngredients}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tips;

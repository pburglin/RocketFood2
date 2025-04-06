import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AllergyProfile: React.FC = () => {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');

  // Load allergies from local storage on component mount
  useEffect(() => {
    const storedAllergies = localStorage.getItem('userAllergies');
    if (storedAllergies) {
      setAllergies(JSON.parse(storedAllergies));
    }
  }, []);

  // Save allergies to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('userAllergies', JSON.stringify(allergies));
  }, [allergies]);

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim().toLowerCase())) {
      setAllergies([...allergies, newAllergy.trim().toLowerCase()]);
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (allergyToRemove: string) => {
    setAllergies(allergies.filter(allergy => allergy !== allergyToRemove));
  };

  return (
    // Removed dark theme classes (dark:...)
    <div className="mt-6 p-4 border border-gray-300 rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-gray-900">My Allergy Profile</h3>
      <form onSubmit={handleAddAllergy} className="flex items-center mb-3">
        <input
          type="text"
          value={newAllergy}
          onChange={(e) => setNewAllergy(e.target.value)}
          placeholder="Enter an ingredient you're allergic to"
          className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500" // Removed dark theme classes
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1" // Removed dark theme classes
        >
          Add
        </button>
      </form>
      {allergies.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Your listed allergies:</p>
          <ul className="flex flex-wrap gap-2">
            {allergies.map((allergy) => (
              <li
                key={allergy}
                // Adjusted allergy tag style for light theme
                className="flex items-center bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full" 
              >
                {allergy}
                <button
                  onClick={() => handleRemoveAllergy(allergy)}
                  // Adjusted remove button style for light theme
                  className="ml-1.5 text-red-500 hover:text-red-700 focus:outline-none" 
                  aria-label={`Remove ${allergy}`}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AllergyProfile;

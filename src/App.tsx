import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import AllergyProfile from './components/AllergyProfile'; // Import AllergyProfile
import AnalysisResults from './components/AnalysisResults';
import Tips from './components/Tips';
import { extractTextFromImage, extractIngredientsFromText } from './lib/vision';
import { analyzeIngredients, getOverallScore } from './lib/analyzer';
import { AnalysisResult } from './types';
import { AlertCircle } from 'lucide-react';
import { VisionService } from './lib/utils';
import { useEffect } from 'react'; // Import useEffect

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAllergies, setUserAllergies] = useState<string[]>([]); // State for allergies
  const [extractedText, setExtractedText] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [overallScore, setOverallScore] = useState<{ score: 'green' | 'yellow' | 'red', reason: string } | null>(null);
  const visionService = import.meta.env.VITE_DEFAULT_VISION_SERVICE === 'openrouter' 
    ? VisionService.OPENROUTER 
    : VisionService.GOOGLE_CLOUD_VISION;

  // Load allergies from local storage on mount
  useEffect(() => {
    const storedAllergies = localStorage.getItem('userAllergies');
    if (storedAllergies) {
      try {
        const parsedAllergies = JSON.parse(storedAllergies);
        if (Array.isArray(parsedAllergies)) {
          setUserAllergies(parsedAllergies);
        }
      } catch (e) {
        console.error("Failed to parse allergies from local storage", e);
        localStorage.removeItem('userAllergies'); // Clear invalid data
      }
    }
    
    // Optional: Listen for changes in local storage made by AllergyProfile
    // This ensures App's state stays in sync if the profile is updated
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'userAllergies' && event.newValue) {
         try {
           const parsedAllergies = JSON.parse(event.newValue);
           if (Array.isArray(parsedAllergies)) {
             setUserAllergies(parsedAllergies);
           }
         } catch (e) {
           console.error("Failed to parse allergies from storage event", e);
         }
      } else if (event.key === 'userAllergies' && !event.newValue) {
        setUserAllergies([]); // Handle removal
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, []);
  
  const handleImageCaptured = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setExtractedText('');
    setAnalysisResults([]);
    setOverallScore(null);
    
    try {
      // Extract text from the image using the selected vision service
      const text = await extractTextFromImage(file, visionService);
      setExtractedText(text);
      
      // Extract ingredients from the text
      const ingredients = await extractIngredientsFromText(text);
      
      if (ingredients.length === 0) {
        throw new Error('No ingredients could be extracted from the image. Please try again with a clearer image of the ingredients list.');
      }
      
      // Analyze the ingredients, passing user allergies
      const results = await analyzeIngredients(ingredients, userAllergies); 
      setAnalysisResults(results);
      
      // Calculate the overall score, passing user allergies
      const score = getOverallScore(results, userAllergies); 
      setOverallScore(score);
      
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Food Ingredient Scanner</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Scan food ingredient labels to identify potentially harmful or misleading ingredients. 
            Get instant feedback on the healthiness of your food choices.
          </p>
        </div>
        
        <ImageUploader onImageCaptured={handleImageCaptured} isLoading={isLoading} />

        <AllergyProfile className="mb-6" /> {/* Add margin-bottom for spacing */}
        
        {error && (
          <div className="w-full max-w-md mx-auto mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {overallScore && analysisResults.length > 0 && (
          <AnalysisResults 
            results={analysisResults} 
            overallScore={overallScore} 
            rawText={extractedText}
            allergies={userAllergies} // Pass allergies down
          />
        )}
        
        <Tips />
      </main>
      
      <Footer />
    </div>
  );
}

export default App;

import React, { useState, useCallback } from 'react'; // Import useCallback
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import AllergyProfile from './components/AllergyProfile'; // Import AllergyProfile
import AnalysisResults from './components/AnalysisResults';
import Tips from './components/Tips';
import { extractTextFromImage, extractIngredientsFromText, OnRetryAttemptCallback } from './lib/vision'; // Import OnRetryAttemptCallback
import { analyzeIngredients, getOverallScore } from './lib/analyzer';
import { AnalysisResult } from './types';
import { AlertCircle } from 'lucide-react';
import { VisionService } from './lib/utils';
import { useEffect } from 'react'; // Import useEffect

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAllergies, setUserAllergies] = useState<string[]>([]); // State for allergies - SOURCE OF TRUTH
  const [extractedText, setExtractedText] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [overallScore, setOverallScore] = useState<{ score: 'green' | 'yellow' | 'red', reason: string } | null>(null);
  const [retryStatus, setRetryStatus] = useState<string | null>(null); // State for retry message
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
    // Removed storage event listener - state is managed centrally now
  }, []);

  // Function to update allergies state AND save to localStorage
  const handleUpdateAllergies = useCallback((newAllergies: string[]) => {
    const sortedAllergies = [...newAllergies].sort(); // Keep sorted for consistency
    setUserAllergies(sortedAllergies);
    localStorage.setItem('userAllergies', JSON.stringify(sortedAllergies));
    console.log('[App.tsx] Updated allergies in state and localStorage:', sortedAllergies); // Log update
  }, []);
  
  // Define the retry callback using useCallback to avoid redefining it on every render
  const handleRetryAttempt: OnRetryAttemptCallback = useCallback((attempt, maxRetries) => {
    setRetryStatus(`OCR failed. Retrying attempt ${attempt + 1}/${maxRetries + 1}...`);
  }, []);

  const handleImageCaptured = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setRetryStatus(null); // Reset retry status on new attempt
    setExtractedText('');
    setAnalysisResults([]);
    setOverallScore(null);
    
    try {
      // Extract text from the image using the selected vision service
      // Extract text from the image, passing the retry callback
      const text = await extractTextFromImage(file, visionService, handleRetryAttempt);
      setExtractedText(text);
      
      // Extract ingredients from the text
      const ingredients = await extractIngredientsFromText(text);
      
      if (ingredients.length === 0) {
        throw new Error('No ingredients could be extracted from the image. Please try again with a clearer image of the ingredients list.');
      }
      
      // Analyze the ingredients, passing user allergies
      console.log('[App.tsx] Analyzing with allergies:', userAllergies); // <-- ADD LOG
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
      setRetryStatus(null); // Clear retry status on success or final failure
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Food Ingredient Scanner</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Scan food labels to identify potentially harmful or misleading ingredients.
            Get instant feedback on how healthy your food choices are.
          </p>
        </div>
        
        <ImageUploader onImageCaptured={handleImageCaptured} isLoading={isLoading} />

        {/* Pass state and update function to AllergyProfile */}
        <AllergyProfile 
          className="mb-6" 
          allergies={userAllergies} 
          onUpdateAllergies={handleUpdateAllergies} 
        /> 
        
        {/* Display Loading/Retry Status or Error */}
        {(isLoading || error) && (
          <div className="w-full max-w-2xl mx-auto mt-4 p-4 bg-white rounded-lg shadow-md text-center">
            {isLoading && !retryStatus && (
              <p className="text-gray-600">Processing image...</p>
            )}
            {isLoading && retryStatus && (
              <p className="text-orange-600">{retryStatus}</p> // Show retry status
            )}
            {error && !isLoading && ( // Show error only if not loading
              <div className="text-red-700 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
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

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader } from 'lucide-react';

interface ImageUploaderProps {
  onImageCaptured: (file: File) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageCaptured, isLoading }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"environment" | "undefined" | undefined>(undefined);
  const [triggerFileInput, setTriggerFileInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (triggerFileInput && fileInputRef.current) {
      fileInputRef.current.click();
      setTriggerFileInput(false); // Reset the trigger
    }
  }, [triggerFileInput]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageCaptured(file);
    }
  };

  const openFileDialog = (mode?: "environment" | "undefined") => {
    setCaptureMode(mode);
    setTriggerFileInput(true);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture={captureMode === "environment" ? "environment" : undefined}
        className="hidden"
      />

      {!previewUrl && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Capture Ingredient Label</h2>
            <p className="text-gray-600">Take a photo or upload an image of a food ingredient label</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => openFileDialog("environment")}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              <Camera className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Take Photo</span>
            </button>

            <button
              onClick={() => openFileDialog()}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Upload className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Upload Image</span>
            </button>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Captured ingredient label"
              className="w-full rounded-lg"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-center text-white">
                  <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Analyzing image...</p>
                </div>
              </div>
            )}
          </div>
          {!isLoading && (
            <button
              onClick={() => {
                setPreviewUrl(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="mt-4 w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Take Another Photo
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

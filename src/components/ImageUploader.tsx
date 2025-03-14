import React, { useState, useRef } from 'react';
import { Camera, Upload, Image as ImageIcon, Loader } from 'lucide-react';

interface ImageUploaderProps {
  onImageCaptured: (file: File) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageCaptured, isLoading }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
  
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions or try uploading an image instead.');
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOpen(false);
    }
  };
  
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File object from the blob
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            
            // Create a preview URL
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            
            // Pass the file to the parent component
            onImageCaptured(file);
            
            // Stop the camera
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      {!isCameraOpen && !previewUrl && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Capture Ingredient Label</h2>
            <p className="text-gray-600">Take a photo or upload an image of a food ingredient label</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={startCamera}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              <Camera className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Take Photo</span>
            </button>
            
            <button
              onClick={openFileDialog}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Upload className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Upload Image</span>
            </button>
          </div>
          
          {cameraError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {cameraError}
            </div>
          )}
        </div>
      )}
      
      {isCameraOpen && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full rounded-lg"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={captureImage}
                className="bg-white rounded-full p-3 shadow-lg"
              >
                <div className="w-12 h-12 rounded-full border-4 border-green-500"></div>
              </button>
            </div>
          </div>
          <button
            onClick={stopCamera}
            className="mt-4 w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <canvas ref={canvasRef} className="hidden" />
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

import React from 'react';
import { Settings } from 'lucide-react';
import { VisionService } from '../lib/utils';

interface VisionServiceToggleProps {
  selectedService: VisionService;
  onServiceChange: (service: VisionService) => void;
}

const VisionServiceToggle: React.FC<VisionServiceToggleProps> = ({ 
  selectedService, 
  onServiceChange 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleServiceSelect = (service: VisionService) => {
    onServiceChange(service);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <Settings className="h-4 w-4" />
        <span>Vision API: {selectedService === VisionService.GOOGLE_CLOUD_VISION ? 'Google Cloud' : 'OpenRouter'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              className={`block px-4 py-2 text-sm w-full text-left ${
                selectedService === VisionService.GOOGLE_CLOUD_VISION
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleServiceSelect(VisionService.GOOGLE_CLOUD_VISION)}
              role="menuitem"
            >
              Google Cloud Vision
            </button>
            <button
              className={`block px-4 py-2 text-sm w-full text-left ${
                selectedService === VisionService.OPENROUTER
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleServiceSelect(VisionService.OPENROUTER)}
              role="menuitem"
            >
              OpenRouter (LLaMA Vision)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionServiceToggle;

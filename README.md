# RocketFood - Food Ingredient Scanner & Analyzer

RocketFood is a modern web application that helps users make healthier food choices by scanning and analyzing food ingredient labels. The app uses optical character recognition (OCR) to extract text from images of food labels, then analyzes the ingredients to identify potentially harmful, misleading, or toxic components.

## Features

- **Image Capture**: Take photos of food ingredient labels using your device's camera
- **Image Upload**: Upload existing photos of food labels from your device
- **Multiple Vision APIs**: Choose between Google Cloud Vision API or OpenRouter (LLaMA Vision) for text extraction
- **Ingredient Analysis**: Analyzes ingredients against a comprehensive database
- **Health Scoring**: Provides a Green/Yellow/Red health score for each product
- **Detailed Explanations**: Explains why ingredients are flagged and suggests healthier alternatives
- **Misleading Ingredient Detection**: Identifies commonly used misleading ingredient names
- **Educational Tips**: Provides tips for reading and understanding food labels

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **OCR Options**: 
  - Google Cloud Vision API for text extraction
  - OpenRouter API with LLaMA Vision model as an alternative
- **AI Analysis**: OpenAI API for analyzing unknown ingredients
  - Mistral Large Latest for ingredient health analysis
- **Icons**: Lucide React for beautiful, consistent iconography

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- API keys for Google Cloud Vision, OpenAI, and OpenRouter

### Installation

1. Clone the repository:
   ```
   git clone git@github.com:pburglin/RocketFood2.git
   cd rocketfood
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   VITE_LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions
   VITE_LLM_MODEL_NAME=gpt-3.5-turbo
   VITE_LLM_API_KEY=your-openai-api-key
   VITE_LLM_SUMMARY_TOKENS=512
   VITE_LLM_STORY_TEMPERATURE=0.7
   VITE_GOOGLE_CLOUD_VISION_API_KEY=your-google-cloud-vision-api-key
   VITE_OPENROUTER_API_KEY=your-openrouter-api-key
   VITE_OPENROUTER_VISION_MODEL=meta-llama/llama-3.2-11b-vision-instruct:free
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Open the app in your browser
2. Select your preferred vision API (Google Cloud Vision or OpenRouter)
3. Click "Take Photo" to use your device's camera or "Upload Image" to select an image from your device
4. Position the camera to clearly capture the ingredients list on a food label, or select a clear image of a food label
5. Wait for the analysis to complete
6. Review the results, which include:
   - Overall health score (Green/Yellow/Red)
   - Breakdown of each ingredient with explanations
   - Suggested healthier alternatives for concerning ingredients
   - Educational tips for reading food labels

## Vision API Options

### Google Cloud Vision API
- Specialized OCR service optimized for text extraction
- Excellent for clear, well-lit images of ingredient labels
- Requires a Google Cloud Platform account and API key

### OpenRouter (LLaMA Vision)
- Uses multimodal LLM capabilities to understand and extract text from images
- May perform better on complex or unclear images where context is needed
- Can understand and extract ingredients even when formatting is non-standard
- Requires an OpenRouter API key

## Ingredient Database

The app includes a comprehensive database of ingredients categorized as:

- **GREEN**: Generally recognized as safe and natural ingredients
- **YELLOW**: Potentially concerning ingredients or misleading terms
- **RED**: Harmful, toxic, or highly processed ingredients

For ingredients not found in the local database, the app uses AI to analyze and categorize them based on available nutritional and scientific information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Cloud Vision API for OCR capabilities
- OpenRouter and Meta's LLaMA for vision model capabilities
- OpenAI for AI-powered ingredient analysis
- The open-source community for various libraries and tools used in this project

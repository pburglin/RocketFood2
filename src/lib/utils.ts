/**
 * Converts a File object to a base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Enum for vision service types
 */
export enum VisionService {
  GOOGLE_CLOUD_VISION = 'google',
  OPENROUTER = 'openrouter'
}

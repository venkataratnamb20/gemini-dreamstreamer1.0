export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export interface MediaItem {
  id: string;
  type: MediaType;
  prompt: string;
  url?: string;
  isLoading: boolean;
  error?: string;
  timestamp: number;
}

export type GenerationMode = MediaType;

export type ViewMode = 'CANVAS' | 'HISTORY';

export type ImageStyle = 
  | 'None' 
  | 'Cinematic' 
  | 'Photographic' 
  | 'Anime' 
  | '3D Render' 
  | 'Watercolor' 
  | 'Oil Painting' 
  | 'Pixel Art' 
  | 'Cyberpunk' 
  | 'Sketch';

// Global augmentation for AI Studio key selection
declare global {
  interface Window {
    // aistudio is declared in the environment types
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
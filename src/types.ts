export type CategoryType = 
  | 'all'
  | 'editorial'
  | 'architecture'
  | 'landscapes'
  | 'portraits'
  | 'luxury';

export interface EXIFInfo {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  lighting: string;
  location: string;
  year: string;
  coordinates?: string;
}

export type PhotoAspectRatio =
  | 'portrait'
  | 'landscape'
  | 'square'
  | 'vertical'
  | 'panoramic'
  | 'ultrawide'
  | '4:3'
  | '16:9'
  | '3:2'
  | '4:5'
  | '9:16'
  | '1:1'
  | (string & {});

export interface PhotoItem {
  id: string;
  title: string;
  category: CategoryType;
  categoryLabel: string;
  image: string;
  rawImage?: string; // For before/after RAW retouch comparison
  featured?: boolean;
  aspectRatio?: PhotoAspectRatio;
  objectPosition?: 'center' | 'top' | 'bottom' | string;
  exif: EXIFInfo;
  description: string;
  colorPalette: string[];
  likes: number;
  story: string;
}

export interface ServicePackage {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  startingPrice: number;
  iconName: string;
  features: string[];
  deliverables: string[];
  recommendedFor: string;
  turnaroundTime: string;
}

export interface GearItem {
  id: string;
  category: 'camera' | 'lens' | 'lighting' | 'drone' | 'tech';
  name: string;
  model: string;
  specs: string;
  useCase: string;
  icon: string;
  image: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  clientName: string;
  role: string;
  company: string;
  avatar: string;
  shootName: string;
  rating: number;
  year: string;
}

export interface LightLabConfig {
  keyLightX: number; // 0 to 100
  keyLightY: number; // 0 to 100
  keyLightColor: string;
  fillLightIntensity: number; // 0 to 100
  rimLightColor: string;
  rimLightIntensity: number;
  apertureVal: number; // f/1.2 to f/16
  colorPreset: 'default' | 'cyberpunk' | 'monochrome' | 'golden' | 'pastel' | 'moody';
}

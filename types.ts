export interface FaceMetrics {
  joy: number;
  sorrow: number;
  anger: number;
  surprise: number;
  headTilt: number;
  eyeOpenness: number;
}

export interface AnalysisResult {
  sentiment: {
    primary: string;
    confidence: number;
    description: string;
  };
  metrics: FaceMetrics; // New field for precise MediaPipe data
  demographics: {
    ageRange: string;
    genderPrediction: string;
  };
  aesthetics: {
    vibe: string;
    colors: string[];
    accessories: string[];
  };
  recommendations: {
    music: string;
    activity: string;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING_MODEL = 'LOADING_MODEL',
  CAPTURING = 'CAPTURING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

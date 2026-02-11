
export interface TranscriptionResult {
  text: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface AudioFile {
  file: File;
  previewUrl: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  timestamp: number;
  fileName: string;
}

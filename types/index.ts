export interface Message {
  id: string;
  content: string;
  type: 'text' | 'audio';
  timestamp: Date;
  isUser: boolean;
  audioUri?: string;
  audioDuration?: number;
}

export interface ChatState {
  messages: Message[];
  isRecording: boolean;
  isLoading: boolean;
}

export type MessageType = 'text' | 'audio'; 
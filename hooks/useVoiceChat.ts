import { useState, useRef, useEffect } from 'react';
import { Audio, AVPlaybackSource } from 'expo-av';
import { Alert } from 'react-native';
import { useAudioRecorder } from './useAudioRecorder';
import { processMessage } from '../utils/helpers';

export type VoiceChatState = 'idle' | 'listening' | 'processing' | 'speaking';

export const useVoiceChat = () => {
  const [state, setState] = useState<VoiceChatState>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const audioRecorder = useAudioRecorder();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  const startListening = async () => {
    try {
      setState('listening');
      setTranscript('');
      setAiResponse('');
      await audioRecorder.startRecording();
    } catch (error) {
      console.error('Error starting voice chat listening:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación de voz');
      setState('idle');
    }
  };

  const stopListening = async () => {
    try {
      setState('processing');
      const result = await audioRecorder.stopRecording();
      
      if (result && result.uri) {
        // Simulate speech-to-text processing
        setTranscript('Procesando audio...');
        
        // Process the audio message
        try {
          const response = await processMessage('Mensaje de audio recibido', 'audio');
          setAiResponse(response);
          setTranscript('Audio procesado correctamente');
          
          // Start speaking state
          setState('speaking');
          
          // Simulate text-to-speech
          await playAIResponse(response);
          
        } catch (error) {
          console.error('Error processing audio message:', error);
          setAiResponse('Error procesando el mensaje de audio');
          setState('idle');
        }
      } else {
        setState('idle');
      }
    } catch (error) {
      console.error('Error stopping voice chat recording:', error);
      setState('idle');
    }
  };

  const playAIResponse = async (responseText: string) => {
    try {
      setIsPlaying(true);
      
      // For now, we'll simulate TTS with a timeout
      // In a real implementation, you would use a TTS service
      speechTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        setState('idle');
      }, 3000); // Simulate 3 seconds of speech
      
    } catch (error) {
      console.error('Error playing AI response:', error);
      setIsPlaying(false);
      setState('idle');
    }
  };

  const cancelVoiceChat = async () => {
    try {
      if (audioRecorder.isRecording) {
        await audioRecorder.cancelRecording();
      }
      
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      
      setIsPlaying(false);
      setState('idle');
      setTranscript('');
      setAiResponse('');
    } catch (error) {
      console.error('Error canceling voice chat:', error);
    }
  };

  const continueTalking = () => {
    setState('idle');
    setTranscript('');
    setAiResponse('');
  };

  return {
    state,
    transcript,
    aiResponse,
    isPlaying,
    recordingDuration: audioRecorder.recordingDuration,
    formatDuration: audioRecorder.formatDuration,
    startListening,
    stopListening,
    cancelVoiceChat,
    continueTalking,
  };
}; 
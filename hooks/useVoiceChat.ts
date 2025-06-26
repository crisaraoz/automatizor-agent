import { useState, useRef, useEffect } from 'react';
import { Audio, AVPlaybackSource } from 'expo-av';
import { Alert } from 'react-native';
import * as Speech from 'expo-speech';
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
      
      // Start recording
      await audioRecorder.startRecording();
      
      // CRITICAL: Auto-repair IMMEDIATELY after recording starts
      // Execute in parallel, don't wait for it
      forceAudioReset().catch(error => {
        console.error('❌ Immediate auto-repair failed:', error);
      });
      
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
          // Use a mockup response for now that matches our assistant context
          const response = "Hola, soy tu asistente automatizador. Con gusto te ayudaré a agendar las tareas que quieras!";
          setAiResponse(response);
          setTranscript('Audio procesado correctamente');
          
          // Start speaking state
          setState('speaking');
          
          // Wait for audio to be ready for TTS
          await new Promise(resolve => setTimeout(resolve, 500));
          
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
      // EXACT COPY: Do exactly what Interference Test does (that works!)
      Speech.stop();
      // EXACT SAME delay as Interference Test
      await new Promise(resolve => setTimeout(resolve, 300));
      // EXACT SAME TTS call as Interference Test
      Speech.speak(responseText, {
        language: 'es',
        onStart: () => console.log('✅ INTERFERENCE-STYLE TTS started'),
        onDone: () => {
          setState('idle');
        },
        onError: (error) => {
          console.error('❌ INTERFERENCE-STYLE TTS error:', error);
          setState('idle');
        },
      });
      
    } catch (error) {
      console.error('❌ Error in INTERFERENCE-STYLE TTS:', error);
      setState('idle');
    }
  };

  // ULTRA AGGRESSIVE audio system reset function
  const forceAudioReset = async () => {
    try {
      // 1. Stop all audio activities
      Speech.stop();
      
      // 2. MULTIPLE neutral resets (some systems need this)
      for (let i = 0; i < 3; i++) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // 3. Wait for complete neutralization
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('❌ Error in forceAudioReset:', error);
    }
  };

  // Helper function to get the best available voice
  const getBestVoice = async (): Promise<string | undefined> => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      // Try to find Spanish voices in order of preference
      const preferredVoices = [
        'es-ES-standard-A', // Google Spanish female
        'es-ES-standard-B', // Google Spanish male
        'es-MX-standard-A', // Mexican Spanish female
        'es-MX-standard-B', // Mexican Spanish male
        'Maria', // iOS Spanish female
        'Diego', // iOS Spanish male
        'Paulina', // iOS Mexican Spanish female
      ];

      for (const preferredVoice of preferredVoices) {
        const voice = voices.find(v => 
          v.identifier === preferredVoice || 
          v.name === preferredVoice ||
          v.identifier.includes(preferredVoice)
        );
        if (voice) {
          return voice.identifier;
        }
      }

      // Fallback to any Spanish voice
      const spanishVoice = voices.find(v => 
        v.language.startsWith('es') ||
        v.identifier.includes('es-')
      );
      
      if (spanishVoice) {
        return spanishVoice.identifier;
      }

      // Last resort: use default voice
      return undefined;
    } catch (error) {
      console.error('Error getting voices:', error);
      return undefined;
    }
  };

  const cancelVoiceChat = async () => {
    try {
      // Stop recording if active
      if (audioRecorder.isRecording) {
        await audioRecorder.cancelRecording();
      }
      
      // Stop any audio playback
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      // Stop text-to-speech if active
      if (isPlaying) {
        Speech.stop();
      }
      
      // Clear any timeouts
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      
      // Reset state
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

  const stopSpeech = () => {
    Speech.stop();
    // Don't check isPlaying state - just stop unconditionally
    setState('idle');
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
    stopSpeech,
  };
}; 
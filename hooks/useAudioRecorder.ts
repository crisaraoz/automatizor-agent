import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const permission = await Audio.getPermissionsAsync();
      setHasPermission(permission.status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync(); 
      const granted = permission.status === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        Alert.alert(
          'Permisos necesarios',
          'Para grabar audio, necesitamos acceso al micrófono. Por favor, permite el acceso cuando se solicite.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Reintentar', onPress: () => requestPermissions() }
          ]
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      setHasPermission(false);
      Alert.alert('Error', 'No se pudieron solicitar los permisos de micrófono.');
      return false;
    }
  };

  const startRecording = async () => {
    try {
      // Always check permissions before recording
      if (hasPermission !== true) {
        const granted = await requestPermissions();
        if (!granted) {
          return;
        }
      }
      // Complete recording mode setup
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', `No se pudo iniciar la grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return null;
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Get URI first before cleanup
      const uri = recordingRef.current.getURI();
      
      // Stop and unload the recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // CRITICAL: Clear the reference immediately
      recordingRef.current = null;
      // CRITICAL: Multi-step audio restoration process
      // Step 1: Wait for recording to fully stop
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Reset to completely neutral state
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // Step 3: Wait for complete reset  
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        uri,
        duration: recordingDuration,
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'No se pudo detener la grabación.');
      return null;
    }
  };

  const cancelRecording = async () => {
    try {
      if (!recordingRef.current) return;
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop and unload the recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // CRITICAL: Clear the reference immediately
      recordingRef.current = null;

      // CRITICAL: Multi-step audio restoration process
      // Step 1: Wait for recording to fully stop
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Reset to completely neutral state
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // Step 3: Wait for complete reset
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // RADICAL: DON'T set TTS-ready state, leave it neutral
      // Let expo-speech handle its own audio configuration

      setRecordingDuration(0);
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingDuration,
    hasPermission,
    startRecording,
    stopRecording,
    cancelRecording,
    requestPermissions,
    formatDuration,
  };
}; 
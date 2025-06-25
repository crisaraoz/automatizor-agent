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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
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

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
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

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      recordingRef.current = null;
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
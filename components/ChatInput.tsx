import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { MessageType } from '../types';
import { VoiceChat } from './VoiceChat';

interface ChatInputProps {
  onSendMessage: (content: string, type: MessageType, audioUri?: string, audioDuration?: number) => void;
  isLoading?: boolean;
}

const { width, height } = Dimensions.get('window');

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(50);
  const [isVoiceChatVisible, setIsVoiceChatVisible] = useState(false);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
  } = useAudioRecorder();

  const handleSendText = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim(), 'text');
      setMessage('');
      setInputHeight(50);
      Keyboard.dismiss();
    }
  };

  const handleStartRecording = async () => {
    // Animate recording UI BEFORE starting recording
    Animated.parallel([
      Animated.spring(slideAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    await startRecording();
    
    // Start pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    
    // Stop animations
    pulseAnimation.stopAnimation();
    Animated.parallel([
      Animated.spring(pulseAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    if (result && result.uri) {
      onSendMessage('Audio message', 'audio', result.uri, result.duration);
    }
  };

  const handleCancelRecording = async () => {
    await cancelRecording();
    
    // Reset animations
    pulseAnimation.stopAnimation();
    Animated.parallel([
      Animated.spring(pulseAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(Math.max(50, event.nativeEvent.contentSize.height + 20), 120);
    setInputHeight(newHeight);
  };

  const handleOpenVoiceChat = () => {
    setIsVoiceChatVisible(true);
  };

  const handleCloseVoiceChat = () => {
    setIsVoiceChatVisible(false);
  };

  if (isRecording) {
    return (
      <View style={styles.container}>
        {/* Recording indicator bar */}
        <View style={styles.recordingIndicatorBar}>
          <View style={styles.recordingLeftSection}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Grabando</Text>
            <Text style={styles.recordingDuration}>{formatDuration(recordingDuration)}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCancelRecording}
            style={styles.recordingCancelButton}
          >
            <Ionicons name="close" size={18} color="#965fd4" style={styles.iconWithGlow} />
          </TouchableOpacity>
        </View>

        {/* Recording controls */}
        <View style={styles.recordingControlsRow}>
          <View style={styles.recordingWaveform}>
            {[...Array(15)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.recordingWaveBar,
                  { 
                    opacity: pulseAnimation.interpolate({
                      inputRange: [1, 1.2],
                      outputRange: [0.6, 1],
                    }),
                    transform: [{ 
                      scaleY: pulseAnimation.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0.5, 2.0 + (i % 4) * 0.3],
                      })
                    }]
                  }
                ]}
              />
            ))}
          </View>
          
          <Animated.View
            style={[
              styles.recordingStopButton,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <TouchableOpacity
              onPress={handleStopRecording}
              style={styles.recordingStopButtonInner}
            >
              <Ionicons name="stop" size={20} color="#FFFFFF" style={styles.iconWithGlow} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add" size={18} color="#666666" />
        </TouchableOpacity>
        
        <View style={[styles.inputContainer, { height: Math.max(40, inputHeight) }]}>
          <TextInput
            style={[styles.textInput, { height: Math.max(20, inputHeight - 20) }]}
            placeholder="Algo que te gustaría agendar?"
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            onContentSizeChange={handleContentSizeChange}
            maxLength={1000}
            editable={!isLoading}
          />
        </View>

        <View style={styles.rightButtons}>
          {message.trim() ? (
            <TouchableOpacity
              onPress={handleSendText}
              disabled={isLoading}
              style={[styles.sendButton, isLoading && styles.disabledButton]}
            >
              {isLoading ? (
                <View style={styles.buttonWaveContainer}>
                  {[...Array(3)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.buttonWave,
                        { 
                          height: 4 + i * 2,
                          backgroundColor: '#734f9a',
                          opacity: 0.6 + i * 0.1,
                        }
                      ]}
                    />
                  ))}
                </View>
              ) : (
                <Ionicons 
                  name="arrow-up" 
                  size={18} 
                  color="#FFFFFF" 
                />
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleStartRecording}
                style={styles.micButton}
              >
                <Ionicons name="mic" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.soundButton}
                onPress={handleOpenVoiceChat}
                disabled={isLoading}
              >
                <Ionicons name="headset" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <VoiceChat
        isVisible={isVoiceChatVisible}
        onClose={handleCloseVoiceChat}
        onSendMessage={onSendMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E7',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 40,
  },
  attachButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F1F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 20,
    textAlignVertical: 'center',
    paddingTop: 2,
    paddingBottom: 2,
    includeFontPadding: false,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#965fd4', // Eva01 purple
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#965fd4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#1d1a2f', // Eva01 dark
    shadowOpacity: 0.1,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3f6d4e', // Eva01 dark green
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#3f6d4e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  soundButtonDisabled: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1d1a2f', // Eva01 dark
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  soundButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8bd450', // Eva01 bright green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8bd450',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  quickResponses: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickResponse: {
    backgroundColor: '#F1F1F3',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  quickResponseText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },

  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8bd450', // Eva01 bright green
    marginRight: 8,
    shadowColor: '#8bd450',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingText: {
    fontSize: 14,
    color: '#734f9a', // Eva01 dark purple
    fontWeight: '500',
    marginRight: 8,
  },
  recordingDuration: {
    fontSize: 14,
    color: '#8bd450', // Eva01 bright green
    fontWeight: '600',
  },

  recordingIndicatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  recordingLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingCancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F1F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  recordingWaveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '60%',
  },
  recordingWaveBar: {
    width: 4,
    height: 16, // Base height for scaleY animation
    backgroundColor: '#965fd4', // Eva01 purple
    marginHorizontal: 2,
    borderRadius: 2,
    shadowColor: '#965fd4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  recordingStopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3f6d4e', // Eva01 dark green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3f6d4e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingStopButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Eva01 enhanced icon styles
  iconWithGlow: {
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  // Button wave styles
  buttonWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 18,
    width: 18,
  },
  buttonWave: {
    width: 2,
    borderRadius: 1,
    marginHorizontal: 0.5,
  },
}); 
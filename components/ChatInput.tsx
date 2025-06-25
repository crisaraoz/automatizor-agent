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
            <Ionicons name="close" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Recording controls */}
        <View style={styles.recordingControlsRow}>
          <View style={styles.recordingWaveform}>
            {[...Array(20)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.recordingWaveBar,
                  { 
                    height: Math.random() * 16 + 8,
                    transform: [{ 
                      scaleY: pulseAnimation.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0.5, 1],
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
              <Ionicons name="stop" size={20} color="#FFFFFF" />
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
              <Ionicons 
                name="arrow-up" 
                size={18} 
                color={isLoading ? '#CCCCCC' : '#FFFFFF'} 
              />
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
    backgroundColor: '#6366F1', // Indigo consistente
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E5E7',
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981', // Verde esmeralda
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  soundButtonDisabled: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E7',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  soundButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6', // Púrpura para diferenciarlo
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#EF4444', // Rojo más moderno
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginRight: 8,
  },
  recordingDuration: {
    fontSize: 14,
    color: '#EF4444', // Rojo más moderno
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
    backgroundColor: '#EF4444', // Rojo más moderno
    marginHorizontal: 2,
  },
  recordingStopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444', // Rojo más moderno
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingStopButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
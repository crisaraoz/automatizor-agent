import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Clipboard,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const { width } = Dimensions.get('window');

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const playAudio = async () => {
    try {
      if (!message.audioUri) return;

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: message.audioUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async () => {
    if (message.type === 'text') {
      Clipboard.setString(message.content);
      Alert.alert('Copiado', 'Mensaje copiado al portapapeles');
    }
  };

  const speakText = async () => {
    try {
      if (isSpeaking) {
        // If already speaking, stop the speech
        Speech.stop();
        setIsSpeaking(false);
        return;
      }

      if (message.type === 'text' && message.content) {
        setIsSpeaking(true);
        
        await Speech.speak(message.content, {
          language: 'es-ES', // Spanish language
          pitch: 1.0,
          rate: 0.9, // Slightly slower for better comprehension
          volume: 1.0,
          onStart: () => {
            setIsSpeaking(true);
          },
          onDone: () => {
            setIsSpeaking(false);
          },
          onStopped: () => {
            setIsSpeaking(false);
          },
          onError: (error: any) => {
            console.error('TTS Error:', error);
            setIsSpeaking(false);
            Alert.alert('Error', 'No se pudo reproducir el audio');
          },
        });
      }
    } catch (error) {
      console.error('Error in speakText:', error);
      setIsSpeaking(false);
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  };

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Cleanup TTS when component unmounts
  React.useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, []);

  if (message.isUser) {
    // User message - gray bubble on the right
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          {message.type === 'text' ? (
            <Text style={styles.userText}>{message.content}</Text>
          ) : (
            <View style={styles.userAudioBubble}>
              <View style={styles.userAudioContainer}>
                <TouchableOpacity
                  onPress={isPlaying ? stopAudio : playAudio}
                  style={styles.userAudioButton}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={16}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
                <View style={styles.userAudioContent}>
                  <View style={styles.userWaveform}>
                    {[...Array(25)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.userWaveBar,
                          { 
                            transform: [{ 
                              scaleY: isPlaying ? Math.random() * 2 + 0.5 : [0.7, 1.0, 0.5, 1.3, 0.8, 1.2, 0.7, 1.5, 1.0, 0.8, 1.3, 0.6, 1.1, 0.9, 1.3, 0.7, 1.2, 0.8, 1.0, 0.5, 1.4, 0.8, 1.1, 0.9, 1.3][i] || 0.8
                            }]
                          }
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.userAudioDuration}>
                    {formatDuration(message.audioDuration)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  } else {
    // Bot message - no bubble, with action icons
    return (
      <View style={styles.botContainer}>
        <View style={styles.botContent}>
          {message.type === 'text' ? (
            <Text style={styles.botText}>{message.content}</Text>
          ) : (
            <View style={styles.botAudioContainer}>
              <TouchableOpacity
                onPress={isPlaying ? stopAudio : playAudio}
                style={styles.botAudioButton}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <View style={styles.botAudioContent}>
                <View style={styles.botWaveform}>
                  {[...Array(20)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.botWaveBar,
                        { 
                          transform: [{ 
                            scaleY: isPlaying ? Math.random() * 1.5 + 0.7 : [1.0, 0.7, 1.3, 0.8, 1.2, 0.5, 1.5, 0.8, 1.1, 0.9, 1.3, 0.6, 1.4, 0.8, 1.0, 1.2, 0.7, 1.3, 0.8, 1.1][i] || 0.8
                          }]
                        }
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.botAudioDuration}>
                  {formatDuration(message.audioDuration)}
                </Text>
              </View>
            </View>
          )}
          
          {/* Action buttons for bot messages */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={copyToClipboard}
            >
              <Ionicons name="copy-outline" size={16} color="#734f9a" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, isSpeaking && styles.actionButtonActive]}
              onPress={speakText}
            >
              <Ionicons 
                name={isSpeaking ? "volume-high" : "volume-high-outline"} 
                size={16} 
                color={isSpeaking ? "#3f6d4e" : "#8bd450"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="thumbs-up-outline" size={16} color="#3f6d4e" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="thumbs-down-outline" size={16} color="#965fd4" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="refresh-outline" size={16} color="#1d1a2f" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  userContainer: {
    marginVertical: 8,
    marginHorizontal: 24,
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: '#F1F1F3',
    maxWidth: width * 0.75,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  userText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 20,
  },
  userAudioBubble: {
    minWidth: width * 0.6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  userAudioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  botContainer: {
    marginVertical: 8,
    marginHorizontal: 24,
    alignItems: 'flex-start',
  },
  botContent: {
    maxWidth: width * 0.85,
  },
  botText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
  },
  actionButton: {
    padding: 8,
    marginRight: 4,
    borderRadius: 8,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(139, 212, 80, 0.1)', // Eva01 green background when active
    borderWidth: 1,
    borderColor: 'rgba(139, 212, 80, 0.3)',
  },
  userAudioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#965fd4', // Eva01 purple
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 4,
    shadowColor: '#965fd4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  userAudioContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 24,
    marginRight: 8,
  },
  userWaveBar: {
    width: 3,
    height: 12, // Base height for scaleY animation
    backgroundColor: '#734f9a', // Eva01 dark purple
    borderRadius: 1.5,
    marginHorizontal: 0.5,
  },
  userAudioDuration: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
    minWidth: 30,
  },
  botAudioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  botAudioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3f6d4e', // Eva01 dark green
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
    shadowColor: '#3f6d4e',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  botAudioContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  botWaveBar: {
    width: 2,
    height: 12, // Base height for scaleY animation
    backgroundColor: '#8bd450', // Eva01 bright green
    borderRadius: 1,
    marginHorizontal: 0.5,
  },
  botAudioDuration: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
}); 
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Speech from 'expo-speech';
import { useVoiceChat } from '../hooks/useVoiceChat';

interface VoiceChatProps {
  isVisible: boolean;
  onClose: () => void;
  onSendMessage?: (content: string, type: 'text' | 'audio', audioUri?: string, audioDuration?: number) => void;
}

const { width, height } = Dimensions.get('window');

export const VoiceChat: React.FC<VoiceChatProps> = ({ 
  isVisible, 
  onClose, 
  onSendMessage 
}) => {
  // Use specialized voice chat hook
  const {
    state,
    transcript,
    aiResponse,
    isPlaying,
    recordingDuration,
    formatDuration,
    startListening,
    stopListening,
    cancelVoiceChat,
    continueTalking,
    stopSpeech,
  } = useVoiceChat();
  
  // Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const waveAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const breatheAnimation = useRef(new Animated.Value(1)).current;
  const rippleAnimation = useRef(new Animated.Value(0)).current;
  const particleAnimations = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  // Initialize animations when visible
  useEffect(() => {
    if (isVisible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when closing
      scaleAnimation.setValue(0);
      fadeAnimation.setValue(0);
      pulseAnimation.setValue(1);
      waveAnimation.setValue(0);
    }
  }, [isVisible]);

  // Advanced animations for different states
  useEffect(() => {
    const startStateAnimations = () => {
      // Breathing animation for idle and speaking states
      const breatheLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnimation, {
            toValue: 1.08,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      // Ripple effect for active states
      const rippleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

      // Particle animations for listening state
      const particleLoops = particleAnimations.map((anim, index) => 
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            }),
          ])
        )
      );

             if (state === 'idle') {
         breatheLoop.start();
       } else if (state === 'listening') {
         rippleLoop.start();
         particleLoops.forEach(loop => loop.start());
       } else if (state === 'processing') {
         breatheLoop.start();
         rippleLoop.start();
       } else if (state === 'speaking') {
         // Always show intense animation while in speaking state
         rippleLoop.start();
         breatheLoop.start();
       }

      return () => {
        breatheLoop.stop();
        rippleLoop.stop();
        particleLoops.forEach(loop => loop.stop());
      };
    };

         const cleanup = startStateAnimations();
     return cleanup;
   }, [state]);

  const handleClose = () => {
    cancelVoiceChat();
    onClose();
  };

  const getStateConfig = () => {
    switch (state) {
      case 'listening':
        return {
          color: '#EF4444',
          icon: 'mic' as const,
          title: 'Te escucho...',
          subtitle: `${formatDuration(recordingDuration)}`,
          buttonText: 'Detener',
          onPress: stopListening,
        };
      case 'processing':
        return {
          color: '#F59E0B',
          icon: 'hourglass' as const,
          title: 'Procesando...',
          subtitle: 'Analizando tu mensaje',
          buttonText: 'Cancelar',
          onPress: cancelVoiceChat,
        };
      case 'speaking':
        return {
          color: '#10B981',
          icon: 'volume-high' as const,
          title: 'IA hablando...',
          subtitle: 'Reproduciendo respuesta...',
          buttonText: 'Detener',
          onPress: stopSpeech,
        };
      default:
        return {
          color: '#6366F1',
          icon: 'mic' as const,
          title: 'Toca para hablar',
          subtitle: 'Conversación por voz',
          buttonText: 'Hablar',
          onPress: startListening,
        };
    }
  };

  const config = getStateConfig();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Full screen gradient background */}
      <LinearGradient
        colors={getGradientColors()}
        style={styles.fullScreenContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated background elements */}
        {[...Array(3)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.backgroundOrb,
              {
                top: `${20 + index * 30}%`,
                left: `${10 + index * 25}%`,
                transform: [
                  {
                    scale: breatheAnimation.interpolate({
                      inputRange: [1, 1.08],
                      outputRange: [0.8 + index * 0.1, 1 + index * 0.1],
                    })
                  }
                ],
                opacity: 0.1 + index * 0.05,
              }
            ]}
          />
        ))}

        {/* Main content container */}
        <Animated.View 
          style={[
            styles.mainContainer,
            {
              opacity: fadeAnimation,
              transform: [{ scale: scaleAnimation }],
            }
          ]}
        >
          {/* Top section with close button */}
          <View style={styles.topSection}>
            <TouchableOpacity style={styles.closeButtonNew} onPress={handleClose}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Central circle with ripple effects */}
          <View style={styles.centralSection}>
                         {/* Ripple effects */}
             {(state === 'listening' || state === 'speaking') && (
               <>
                 <Animated.View
                   style={[
                     styles.rippleCircle,
                     styles.ripple1,
                     {
                       borderColor: state === 'listening' ? 
                         'rgba(255, 65, 108, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                       transform: [
                         { scale: rippleAnimation.interpolate({
                           inputRange: [0, 1],
                           outputRange: [1, 2.5],
                         }) }
                       ],
                       opacity: rippleAnimation.interpolate({
                         inputRange: [0, 0.5, 1],
                         outputRange: [0.6, 0.2, 0],
                       }),
                     }
                   ]}
                 />
                 <Animated.View
                   style={[
                     styles.rippleCircle,
                     styles.ripple2,
                     {
                       borderColor: state === 'listening' ? 
                         'rgba(255, 65, 108, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                       transform: [
                         { scale: rippleAnimation.interpolate({
                           inputRange: [0, 1],
                           outputRange: [1, 2],
                         }) }
                       ],
                       opacity: rippleAnimation.interpolate({
                         inputRange: [0, 0.7, 1],
                         outputRange: [0.4, 0.1, 0],
                       }),
                     }
                   ]}
                 />
               </>
             )}

            {/* Floating particles for listening state */}
            {state === 'listening' && particleAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    top: `${45 + Math.sin(index) * 15}%`,
                    left: `${40 + Math.cos(index) * 20}%`,
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -50 - Math.random() * 30],
                        })
                      },
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1, 0],
                        })
                      }
                    ],
                    opacity: anim.interpolate({
                      inputRange: [0, 0.3, 0.7, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                  }
                ]}
              />
            ))}

            {/* Main circle with gradient */}
            <TouchableOpacity
              onPress={config.onPress}
              activeOpacity={0.9}
              style={styles.circleContainer}
            >
              <Animated.View
                style={[
                  styles.mainCircle,
                  {
                    transform: [{ scale: breatheAnimation }],
                  }
                ]}
              >
                <LinearGradient
                  colors={getCircleGradient()}
                  style={styles.circleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={config.icon} size={64} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>

            {/* State indicator text */}
            <View style={styles.stateTextContainer}>
              <Text style={styles.stateTitle}>{config.title}</Text>
              {config.subtitle && (
                <Text style={styles.stateSubtitle}>{config.subtitle}</Text>
              )}
            </View>
          </View>

          {/* Bottom section with controls */}
          <View style={styles.bottomSection}>
            {/* Transcript display */}
            {(transcript || aiResponse) && (
              <Animated.View style={styles.transcriptContainer}>
                {transcript && (
                  <Text style={styles.transcriptText}>{transcript}</Text>
                )}
                {aiResponse && (
                  <Text style={styles.responseText}>{aiResponse}</Text>
                )}
              </Animated.View>
            )}

            {/* Control buttons */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={config.onPress}
              >
                <LinearGradient
                  colors={getButtonGradient()}
                  style={styles.controlButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.controlButtonText}>{config.buttonText}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );

  // Helper functions for dynamic colors
  function getGradientColors(): [string, string, ...string[]] {
    switch (state) {
      case 'listening':
        return ['#1a1a2e', '#16213e', '#0f3460'];
      case 'processing':
        return ['#2d1b69', '#11998e', '#38ef7d'];
      case 'speaking':
        return ['#134e5e', '#71b280', '#a8e6cf'];
      default:
        return ['#667eea', '#764ba2', '#f093fb'];
    }
  }

  function getCircleGradient(): [string, string] {
    switch (state) {
      case 'listening':
        return ['#ff416c', '#ff4b2b'];
      case 'processing':
        return ['#f093fb', '#f5576c'];
      case 'speaking':
        return ['#4facfe', '#00f2fe'];
      default:
        return ['#667eea', '#764ba2'];
    }
  }

  function getButtonGradient(): [string, string] {
    return ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'];
  }
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 44,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  closeButtonNew: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centralSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rippleCircle: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ripple1: {
    width: 300,
    height: 300,
  },
  ripple2: {
    width: 250,
    height: 250,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  circleContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  mainCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateTextContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 32,
  },
  stateTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  transcriptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    minHeight: 80,
  },
  transcriptText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  responseText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  controlButton: {
    borderRadius: 25,
    overflow: 'hidden',
    minWidth: 140,
  },
  controlButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
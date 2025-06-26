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
  
  // Enhanced Eva01-style animations
  const iconGlowAnimation = useRef(new Animated.Value(0)).current;
  const iconRotateAnimation = useRef(new Animated.Value(0)).current;
  const hexPatternAnimation = useRef(new Animated.Value(0)).current;

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

      // Animations will be started by the state useEffect

    } else {
      // Reset animations when closing
      scaleAnimation.setValue(0);
      fadeAnimation.setValue(0);
      pulseAnimation.setValue(1);
      waveAnimation.setValue(0);
      iconGlowAnimation.setValue(0);
      iconRotateAnimation.setValue(0);
      hexPatternAnimation.setValue(0);
    }
  }, [isVisible]);

  // Advanced animations for different states
  useEffect(() => {
    if (!isVisible) return; // Don't start animations if modal is not visible

    const startStateAnimations = () => {
      // Stop any previous animations first
      breatheAnimation.stopAnimation();
      rippleAnimation.stopAnimation();
      iconGlowAnimation.stopAnimation();
      iconRotateAnimation.stopAnimation();
      hexPatternAnimation.stopAnimation();
      particleAnimations.forEach(anim => anim.stopAnimation());

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

      // Enhanced icon glow effect
      const iconGlowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(iconGlowAnimation, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(iconGlowAnimation, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );

      // Icon rotation for processing state
      const iconRotateLoop = Animated.loop(
        Animated.timing(iconRotateAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );

      // Hexagonal pattern animation
      const hexPatternLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(hexPatternAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(hexPatternAnimation, {
            toValue: 0,
            duration: 3000,
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
        iconGlowLoop.start();
        hexPatternLoop.start();
      } else if (state === 'listening') {
        rippleLoop.start();
        particleLoops.forEach(loop => loop.start());
        iconGlowLoop.start();
        hexPatternLoop.start();
      } else if (state === 'processing') {
        breatheLoop.start();
        rippleLoop.start();
        iconRotateLoop.start();
        iconGlowLoop.start();
        hexPatternLoop.start();
      } else if (state === 'speaking') {
        // Always show intense animation while in speaking state
        rippleLoop.start();
        breatheLoop.start();
        iconGlowLoop.start();
        hexPatternLoop.start();
      }

      return () => {
        breatheLoop.stop();
        rippleLoop.stop();
        iconGlowLoop.stop();
        iconRotateLoop.stop();
        hexPatternLoop.stop();
        particleLoops.forEach(loop => loop.stop());
      };
    };

    const cleanup = startStateAnimations();
    return cleanup;
  }, [state, isVisible]);

  const handleClose = () => {
    // If IA is speaking, stop the speech first (like "Detener" button)
    if (state === 'speaking') {
      stopSpeech();
    }
    
    // Then proceed with normal close
    cancelVoiceChat();
    onClose();
  };

  const getStateConfig = () => {
    switch (state) {
      case 'listening':
        return {
          color: '#8bd450', // Eva01 bright green
          icon: 'mic' as const,
          title: 'Te escucho...',
          subtitle: `${formatDuration(recordingDuration)}`,
          buttonText: 'Detener',
          onPress: stopListening,
        };
      case 'processing':
        return {
          color: '#965fd4', // Eva01 purple
          icon: 'hourglass' as const,
          title: 'Procesando...',
          subtitle: 'Analizando tu mensaje',
          buttonText: 'Cancelar',
          onPress: cancelVoiceChat,
        };
      case 'speaking':
        return {
          color: '#3f6d4e', // Eva01 dark green
          icon: 'volume-high' as const,
          title: 'IA hablando...',
          subtitle: 'Reproduciendo respuesta...',
          buttonText: 'Detener',
          onPress: stopSpeech,
        };
      default:
        return {
          color: '#734f9a', // Eva01 dark purple
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
      
      {/* Full screen gradient background with Eva01 colors */}
      <LinearGradient
        colors={getGradientColors()}
        style={styles.fullScreenContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated background elements with hexagonal patterns */}
        {[...Array(5)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.backgroundOrb,
              {
                top: `${15 + index * 20}%`,
                left: `${5 + index * 18}%`,
                transform: [
                  {
                    scale: breatheAnimation.interpolate({
                      inputRange: [1, 1.08],
                      outputRange: [0.6 + index * 0.08, 0.8 + index * 0.08],
                    })
                  },
                  {
                    rotate: hexPatternAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }
                ],
                opacity: 0.08 + index * 0.03,
              }
            ]}
          >
            {/* Hexagonal pattern overlay */}
            <View style={styles.hexagonalPattern}>
              {[...Array(6)].map((_, hexIndex) => (
                <View
                  key={hexIndex}
                  style={[
                    styles.hexagon,
                    {
                      transform: [
                        { rotate: `${hexIndex * 60}deg` }
                      ]
                    }
                  ]}
                />
              ))}
            </View>
          </Animated.View>
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
          {/* Top section with enhanced close button */}
          <View style={styles.topSection}>
            <TouchableOpacity style={styles.closeButtonNew} onPress={handleClose}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
                style={styles.closeButtonGradient}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Central section with enhanced effects */}
          <View style={styles.centralSection}>
            {/* Enhanced ripple effects */}
            {(state === 'listening' || state === 'speaking') && (
              <>
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    styles.ripple1,
                    {
                      borderColor: state === 'listening' ? 
                        'rgba(139, 212, 80, 0.4)' : 'rgba(63, 109, 78, 0.4)', // Eva01 colors
                      transform: [
                        { scale: rippleAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2.8],
                        }) }
                      ],
                      opacity: rippleAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 0.3, 0],
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
                        'rgba(139, 212, 80, 0.6)' : 'rgba(63, 109, 78, 0.6)',
                      transform: [
                        { scale: rippleAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2.2],
                        }) }
                      ],
                      opacity: rippleAnimation.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.6, 0.2, 0],
                      }),
                    }
                  ]}
                />
                {/* Additional inner ripple for more depth */}
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    styles.ripple3,
                    {
                      borderColor: state === 'listening' ? 
                        'rgba(139, 212, 80, 0.8)' : 'rgba(63, 109, 78, 0.8)',
                      transform: [
                        { scale: rippleAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.6],
                        }) }
                      ],
                      opacity: rippleAnimation.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [0.4, 0.1, 0],
                      }),
                    }
                  ]}
                />
              </>
            )}

            {/* Enhanced floating particles */}
            {state === 'listening' && particleAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    top: `${45 + Math.sin(index) * 15}%`,
                    left: `${40 + Math.cos(index) * 20}%`,
                    backgroundColor: index % 2 === 0 ? '#8bd450' : '#965fd4', // Eva01 colors
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -60 - Math.random() * 40],
                        })
                      },
                      {
                        translateX: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, (Math.random() - 0.5) * 40],
                        })
                      },
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1.2, 0],
                        })
                      }
                    ],
                    opacity: anim.interpolate({
                      inputRange: [0, 0.3, 0.7, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                  }
                ]}
              >
                {/* Particle glow effect */}
                <Animated.View
                  style={[
                    styles.particleGlow,
                    {
                      opacity: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0.8, 0],
                      }),
                    }
                  ]}
                />
              </Animated.View>
            ))}

            {/* Enhanced main circle with multiple layers */}
            <TouchableOpacity
              onPress={config.onPress}
              activeOpacity={0.9}
              style={styles.circleContainer}
            >
              {/* Outer glow ring */}
              <Animated.View
                style={[
                  styles.glowRing,
                  {
                    borderColor: config.color,
                    opacity: iconGlowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8],
                    }),
                    transform: [
                      { 
                        scale: iconGlowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.15],
                        })
                      }
                    ],
                  }
                ]}
              />
              
              {/* Main circle with enhanced effects */}
              <Animated.View
                style={[
                  styles.mainCircle,
                  {
                    transform: [
                      { scale: breatheAnimation },
                      { 
                        rotate: state === 'processing' ? 
                          iconRotateAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }) : '0deg'
                      }
                    ],
                  }
                ]}
              >
                <LinearGradient
                  colors={getCircleGradient()}
                  style={styles.circleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* ChatGPT-style audio visualization */}
                  {state === 'idle' && (
                    <View style={styles.centerIconContainer}>
                      {/* Subtle idle animation circles */}
                      {[...Array(3)].map((_, index) => (
                        <Animated.View
                          key={index}
                          style={[
                            styles.idleCircle,
                            {
                              width: 80 + index * 30,
                              height: 80 + index * 30,
                              borderRadius: 40 + index * 15,
                              borderColor: '#734f9a',
                              opacity: breatheAnimation.interpolate({
                                inputRange: [1, 1.08],
                                outputRange: [0.3 - index * 0.08, 0.1 - index * 0.02],
                              }),
                              transform: [
                                {
                                  scale: breatheAnimation.interpolate({
                                    inputRange: [1, 1.08],
                                    outputRange: [1 - index * 0.05, 1.1 - index * 0.05],
                                  })
                                }
                              ]
                            }
                          ]}
                        />
                      ))}
                      {/* Central ready circle - no icon */}
                      <Animated.View 
                        style={[
                          styles.centralReadyCircle,
                          {
                            transform: [
                              {
                                scale: iconGlowAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.05],
                                })
                              }
                            ],
                            opacity: iconGlowAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          }
                        ]}
                      />
                    </View>
                  )}
                  
                  {state === 'listening' && (
                    <View style={styles.centerIconContainer}>
                      {/* Concentric circles that pulse */}
                      {[...Array(4)].map((_, index) => (
                        <Animated.View
                          key={index}
                          style={[
                            styles.pulseCircle,
                            {
                              width: 60 + index * 20,
                              height: 60 + index * 20,
                              borderRadius: 30 + index * 10,
                              borderColor: '#8bd450',
                              opacity: iconGlowAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8 - index * 0.2, 0.2 - index * 0.05],
                              }),
                              transform: [
                                {
                                  scale: iconGlowAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1 - index * 0.1, 1.3 - index * 0.1],
                                  })
                                }
                              ]
                            }
                          ]}
                        />
                      ))}
                      {/* Central listening circle - no icon */}
                      <Animated.View 
                        style={[
                          styles.centralActiveCircle,
                          {
                            backgroundColor: '#8bd450',
                            transform: [
                              {
                                scale: iconGlowAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.2],
                                })
                              }
                            ],
                            opacity: iconGlowAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          }
                        ]}
                      />
                    </View>
                  )}
                  
                  {state === 'processing' && (
                    <View style={styles.centerIconContainer}>
                      {/* Rotating processing circles */}
                      {[...Array(3)].map((_, index) => (
                        <Animated.View
                          key={index}
                          style={[
                            styles.processingCircle,
                            {
                              width: 50 + index * 15,
                              height: 50 + index * 15,
                              borderRadius: 25 + index * 7.5,
                              borderColor: '#965fd4',
                              opacity: 0.6 - index * 0.15,
                              transform: [
                                {
                                  rotate: iconRotateAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', `${360 * (index + 1)}deg`],
                                  })
                                },
                                {
                                  scale: iconGlowAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1.2],
                                  })
                                }
                              ]
                            }
                          ]}
                        />
                      ))}
                      {/* Central processing circle - no icon */}
                      <Animated.View 
                        style={[
                          styles.centralActiveCircle,
                          {
                            backgroundColor: '#965fd4',
                            transform: [
                              {
                                scale: iconGlowAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.3],
                                })
                              },
                              {
                                rotate: iconRotateAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '360deg'],
                                })
                              }
                            ],
                            opacity: iconGlowAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.7, 1],
                            }),
                          }
                        ]}
                      />
                    </View>
                  )}
                  
                  {state === 'speaking' && (
                    <View style={styles.centerIconContainer}>
                      {/* Dynamic speaking waves */}
                      {[...Array(5)].map((_, index) => (
                        <Animated.View
                          key={index}
                          style={[
                            styles.speakingCircle,
                            {
                              width: 40 + index * 25,
                              height: 40 + index * 25,
                              borderRadius: 20 + index * 12.5,
                              borderColor: index % 2 === 0 ? '#3f6d4e' : '#8bd450',
                              opacity: rippleAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.7 - index * 0.1, 0.1],
                              }),
                              transform: [
                                {
                                  scale: rippleAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1.5 + index * 0.2],
                                  })
                                }
                              ]
                            }
                          ]}
                        />
                      ))}
                      {/* Central speaking circle - no icon */}
                      <Animated.View 
                        style={[
                          styles.centralActiveCircle,
                          {
                            backgroundColor: '#3f6d4e',
                            transform: [
                              {
                                scale: rippleAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.4],
                                })
                              }
                            ],
                            opacity: rippleAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 0.7],
                            }),
                          }
                        ]}
                      />
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>

            {/* Enhanced state indicator text */}
            <View style={styles.stateTextContainer}>
              <Text style={styles.stateTitle}>{config.title}</Text>
              {config.subtitle && (
                <Text style={styles.stateSubtitle}>{config.subtitle}</Text>
              )}
            </View>
          </View>

          {/* Bottom section with enhanced controls */}
          <View style={styles.bottomSection}>
            {/* Enhanced transcript display */}
            {(transcript || aiResponse) && (
              <Animated.View style={styles.transcriptContainer}>
                <LinearGradient
                  colors={['rgba(29, 26, 47, 0.8)', 'rgba(115, 79, 154, 0.4)']} // Eva01 colors
                  style={styles.transcriptGradient}
                >
                  {transcript && (
                    <Text style={styles.transcriptText}>{transcript}</Text>
                  )}
                  {aiResponse && (
                    <Text style={styles.responseText}>{aiResponse}</Text>
                  )}
                </LinearGradient>
              </Animated.View>
            )}

            {/* Enhanced control buttons */}
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

  // Helper functions for Eva01 dynamic colors
  function getGradientColors(): [string, string, ...string[]] {
    switch (state) {
      case 'listening':
        return ['#1d1a2f', '#734f9a', '#8bd450']; // Eva01 dark to green
      case 'processing':
        return ['#1d1a2f', '#965fd4', '#734f9a']; // Eva01 dark to purple
      case 'speaking':
        return ['#1d1a2f', '#3f6d4e', '#8bd450']; // Eva01 dark to dark green to bright green
      default:
        return ['#1d1a2f', '#734f9a', '#965fd4']; // Eva01 dark to purple gradient
    }
  }

  function getCircleGradient(): [string, string] {
    switch (state) {
      case 'listening':
        return ['#8bd450', '#3f6d4e']; // Eva01 bright green to dark green
      case 'processing':
        return ['#965fd4', '#734f9a']; // Eva01 purple gradient
      case 'speaking':
        return ['#3f6d4e', '#8bd450']; // Eva01 dark green to bright green
      default:
        return ['#734f9a', '#965fd4']; // Eva01 purple gradient
    }
  }

  function getButtonGradient(): [string, string] {
    return ['rgba(139, 212, 80, 0.3)', 'rgba(63, 109, 78, 0.2)']; // Eva01 green tones
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
  ripple3: {
    width: 200,
    height: 200,
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
  closeButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexagonalPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexagon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainIcon: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  iconGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  transcriptGradient: {
    borderRadius: 20,
    padding: 20,
  },
  // Audio wave styles
  audioWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    width: '100%',
  },
  audioWave: {
    width: 6,
    height: 40,
    backgroundColor: '#8bd450',
    borderRadius: 3,
    marginHorizontal: 2,
  },
  processingWave: {
    width: 4,
    height: 35,
    backgroundColor: '#965fd4',
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
  speakingWave: {
    width: 5,
    height: 45,
    borderRadius: 2.5,
    marginHorizontal: 1,
  },
  // ChatGPT-style circular effects
  centerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 200,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  processingCircle: {
    position: 'absolute',
    borderWidth: 3,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  speakingCircle: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  centralIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  processingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#965fd4',
    marginHorizontal: 2,
  },
  // New circle styles for cleaner look
  idleCircle: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  centralReadyCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(115, 79, 154, 0.3)', // Eva01 purple with transparency
    borderWidth: 2,
    borderColor: '#734f9a',
    zIndex: 10,
  },
  centralActiveCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    zIndex: 10,
  },
});
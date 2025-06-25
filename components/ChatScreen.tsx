import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Sidebar } from './Sidebar';
import { Message, MessageType } from '../types';
import { generateUniqueId, processMessage } from '../utils/helpers';

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
}

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>('current');
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([
    {
      id: '1',
      title: 'Prueba de grabación',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: '2', 
      title: 'Hola ayuda',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: '3',
      title: 'App React Native Audio',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      id: '6',
      title: 'Proyecto IA RPA WebApp',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    },
    {
      id: '7',
      title: 'Camiseta verde sprite 2D',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
    },
    {
      id: '8',
      title: 'Usar LLM en desarrollo',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21), // 3 weeks ago
    }
  ]);
  
  const flatListRef = useRef<FlatList>(null);
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const handleOpenSidebar = () => {
    setIsSidebarVisible(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarVisible(false);
  };

  const handleSelectChat = (chatId: string) => {
    // TODO: Load selected chat messages
    setCurrentChatId(chatId);
    console.log('Selected chat:', chatId);
  };

  const handleNewChat = () => {
    setCurrentChatId('current');
    setMessages([{
      id: '1',
      content: '¡Hola! 😊 ¿Que tarea quieres que haga?',
      type: 'text',
      timestamp: new Date(),
      isUser: false,
    }]);
  };

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: '1',
      content: '¡Hola! 😊 ¿En qué te puedo ayudar hoy?',
      type: 'text',
      timestamp: new Date(),
      isUser: false,
    };
    
    setMessages([welcomeMessage]);
    
    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSendMessage = async (
    content: string, 
    type: MessageType, 
    audioUri?: string, 
    audioDuration?: number
  ) => {
    const newMessage: Message = {
      id: generateUniqueId(),
      content,
      type,
      timestamp: new Date(),
      isUser: true,
      audioUri,
      audioDuration,
    };

    setMessages(prev => {
      const updated = [...prev, newMessage];
      
      // If this is the first user message in current chat, add to history
      if (currentChatId === 'current' && prev.length === 1) {
        const chatTitle = content.length > 30 ? content.substring(0, 30) + '...' : content;
        const newChatId = generateUniqueId();
        setCurrentChatId(newChatId);
        setChatHistory(prevHistory => [{
          id: newChatId,
          title: chatTitle,
          timestamp: new Date(),
        }, ...prevHistory]);
      }
      
      return updated;
    });
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Process AI response using intelligent message processing
    try {
      const responseContent = await processMessage(content, type);
      
      const botMessage: Message = {
        id: generateUniqueId(),
        content: responseContent,
        type: 'text',
        timestamp: new Date(),
        isUser: false,
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);

      // Scroll to bottom after bot response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: 'Lo siento, hubo un error procesando tu mensaje. Por favor, inténtalo de nuevo.',
        type: 'text',
        timestamp: new Date(),
        isUser: false,
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnimation }]}>
      <Text style={styles.emptyTitle}>¡Bienvenido!</Text>
      <Text style={styles.emptySubtitle}>
        Comienza una conversación enviando un mensaje de texto o una grabación de audio
      </Text>
    </Animated.View>
  );

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingContent}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot]} />
            <Animated.View style={[styles.typingDot]} />
            <Animated.View style={[styles.typingDot]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={handleOpenSidebar}>
            <Ionicons name="menu" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Automatizador Tareas</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleNewChat}>
            <Ionicons name="create-outline" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Memory Status */}
        {/* <View style={styles.memoryStatus}>
          <View style={styles.memoryIndicator}>
            <Ionicons name="information-circle" size={16} color="#666666" />
            <Text style={styles.memoryText}>Memoria guardada completa</Text>
          </View>
        </View> */}

        {/* Chat Area */}
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            onContentSizeChange={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          
          {renderTypingIndicator()}
          
          <SafeAreaView edges={['bottom']}>
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>

        {/* Sidebar */}
        <Sidebar
          isVisible={isSidebarVisible}
          onClose={handleCloseSidebar}
          chatHistory={chatHistory}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          currentChatId={currentChatId}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E7',
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  editButton: {
    padding: 4,
  },
  memoryStatus: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E7',
  },
  memoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  typingContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  typingContent: {
    alignItems: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
}); 
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
}

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
  chatHistory: ChatHistoryItem[];
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  currentChatId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isVisible,
  onClose,
  chatHistory,
  onSelectChat,
  onNewChat,
  currentChatId,
}) => {
  const slideAnimation = React.useRef(new Animated.Value(-300)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: -300,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString();
  };

  const groupChatsByDate = (chats: ChatHistoryItem[]) => {
    const groups: { [key: string]: ChatHistoryItem[] } = {};
    
    chats.forEach(chat => {
      const dateKey = formatDate(chat.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(chat);
    });
    
    return groups;
  };

  const groupedChats = groupChatsByDate(chatHistory);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnimation }] }
          ]}
        >
          {/* Header */}
          <View style={styles.sidebarHeader}>
            <TouchableOpacity onPress={onNewChat} style={styles.newChatButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.newChatText}>Nuevo chat</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8E8EA0" />
            </TouchableOpacity>
          </View>

          {/* Chat History */}
          <ScrollView style={styles.chatHistory} showsVerticalScrollIndicator={false}>
            {Object.keys(groupedChats).length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>No hay chats anteriores</Text>
              </View>
            ) : (
              Object.entries(groupedChats).map(([dateGroup, chats]) => (
                <View key={dateGroup} style={styles.dateGroup}>
                  <Text style={styles.dateGroupTitle}>{dateGroup}</Text>
                  {chats.map((chat) => (
                    <TouchableOpacity
                      key={chat.id}
                      style={[
                        styles.chatItem,
                        currentChatId === chat.id && styles.activeChatItem
                      ]}
                      onPress={() => {
                        onSelectChat(chat.id);
                        onClose();
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#8E8EA0" />
                      <Text style={styles.chatTitle} numberOfLines={1}>
                        {chat.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          {/* User Profile Section */}
          <View style={styles.userSection}>
            <TouchableOpacity style={styles.userProfile}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Cristian Araoz</Text>
                <Text style={styles.userEmail}>cristian@example.com</Text>
              </View>
              <Ionicons name="ellipsis-horizontal" size={20} color="#8E8EA0" />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.overlayBackground,
            { opacity: overlayOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.overlayBackgroundTouchable} 
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlayBackgroundTouchable: {
    flex: 1,
  },
  sidebar: {
    width: 280,
    backgroundColor: '#171717',
    paddingTop: 60,
    paddingBottom: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  chatHistory: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    color: '#8E8EA0',
    fontSize: 14,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateGroupTitle: {
    color: '#8E8EA0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  activeChatItem: {
    backgroundColor: '#2D2D30',
  },
  chatTitle: {
    color: '#ECECF1',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  userSection: {
    borderTopWidth: 1,
    borderTopColor: '#2D2D30',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10A37F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ECECF1',
    fontSize: 14,
    fontWeight: '500',
  },
  userEmail: {
    color: '#8E8EA0',
    fontSize: 12,
    marginTop: 2,
  },
}); 
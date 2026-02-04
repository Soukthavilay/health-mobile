import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { sendAIChat, getAISuggestions } from '../services/api.js';

const DEFAULT_SUGGESTIONS = [
  'Làm sao để ngủ ngon hơn?',
  'Tôi nên uống bao nhiêu nước mỗi ngày?',
  'Gợi ý bài tập giảm mỡ bụng',
  'Thực đơn healthy cho bữa sáng',
  'Cách giảm stress hiệu quả',
];

const AIChatScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: '👋 Xin chào! Tôi là trợ lý sức khỏe AI của bạn. Hãy hỏi tôi bất cứ điều gì về sức khỏe, dinh dưỡng, tập luyện, hoặc giấc ngủ nhé!',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const scrollViewRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      const loadSuggestions = async () => {
        try {
          const result = await getAISuggestions();
          if (result && Array.isArray(result) && result.length > 0) {
            // Handle both string and object format from API
            const formatted = result.map((s) => (typeof s === 'string' ? s : s.text || s.question || String(s)));
            setSuggestions(formatted);
          }
        } catch (error) {
          console.log('Error loading suggestions:', error);
        }
      };
      loadSuggestions();
    }, [])
  );

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const result = await sendAIChat(text.trim());
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        text: result.response || result.message || 'Xin lỗi, tôi không thể trả lời lúc này.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickSuggestion = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🤖 AI Health Assistant</Text>
          <Text style={styles.subtitle}>Trợ lý sức khỏe thông minh</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.type === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text style={[styles.messageText, message.type === 'user' && styles.userText]}>
                {message.text}
              </Text>
              <Text style={[styles.messageTime, message.type === 'user' && styles.userTime]}>
                {message.time}
              </Text>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Text style={styles.typingText}>Đang trả lời...</Text>
            </View>
          )}

          {/* Quick Suggestions */}
          {messages.length <= 2 && !isTyping && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>💡 Gợi ý câu hỏi:</Text>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => handleQuickSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi về sức khỏe..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e8f5e9',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#43a047',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#43a047',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#43a047',
    marginBottom: 10,
  },
  suggestionButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#43a047',
  },
  suggestionText: {
    fontSize: 14,
    color: '#43a047',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#43a047',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#c8e6c9',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#fff',
  },
});

export default AIChatScreen;

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const GreetingHeader = ({ name, avatarUrl }) => {
  const greeting = getGreeting();
  const displayName = name || 'bạn';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.name}>{displayName}!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#0b3d91',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0b3d91',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0b3d91',
  },
});

export default GreetingHeader;

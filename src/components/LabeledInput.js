import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { palette } from '../constants/colors.js';

const LabeledInput = ({ label, placeholder, value, onChangeText, keyboardType = 'default' }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={palette.muted}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    backgroundColor: '#fff',
    color: palette.text,
  },
});

export default LabeledInput;

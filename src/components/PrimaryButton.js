import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { palette } from '../constants/colors.js';

const PrimaryButton = ({ label, onPress, disabled }) => (
  <TouchableOpacity style={[styles.button, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
});

export default PrimaryButton;

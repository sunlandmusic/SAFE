import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EyeButtonProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const EyeButton: React.FC<EyeButtonProps> = ({
  currentRoute,
  onNavigate,
  size = 45,
  color = '#FFFFFF',
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onNavigate(currentRoute)}
    >
      <Ionicons name="eye-outline" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
}); 
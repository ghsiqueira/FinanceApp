// src/components/Toast.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss
}) => {
  const { theme } = useTheme();
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Set timer for auto-dismiss
      const timer = setTimeout(() => {
        Animated.timing(animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, animation, duration, onDismiss]);
  
  if (!visible) {
    return null;
  }
  
  // Config based on toast type
  const getConfig = () => {
    switch (type) {
      case 'success':
        return { 
          backgroundColor: theme.success, 
          icon: 'check-circle'
        };
      case 'error':
        return { 
          backgroundColor: theme.error, 
          icon: 'alert-circle'
        };
      case 'warning':
        return { 
          backgroundColor: theme.warning, 
          icon: 'alert'
        };
      case 'info':
      default:
        return { 
          backgroundColor: theme.info, 
          icon: 'information'
        };
    }
  };
  
  const config = getConfig();
  
  return (
    <Animated.View
      style={[
        styles.container,
        { 
          backgroundColor: config.backgroundColor,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: animation,
        },
      ]}
    >
      <Icon name={config.icon} size={20} color="#fff" style={styles.icon} />
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
      <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
        <Icon name="close" size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast;
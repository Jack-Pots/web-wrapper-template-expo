import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, BackHandler, Platform, Animated, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as ScreenOrientation from 'expo-screen-orientation';

const HOME_URL = 'https://github.com/login';
const HOME_DOMAIN = 'github.com';


// Icon mapping for iOS and fallback
const iconMap = {
  back: Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back',
  home: 'home',
  up: Platform.OS === 'ios' ? 'chevron-up' : 'arrow-up',
  down: Platform.OS === 'ios' ? 'chevron-down' : 'arrow-down',
};


export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const colorScheme = useColorScheme();
  const [isBarVisible, setIsBarVisible] = useState(false);
  const barHeight = useRef(new Animated.Value(80)).current;
  const toggleButtonBottom = useRef(new Animated.Value(20)).current;
  const [orientation, setOrientation] = useState('PORTRAIT');

  const isDarkMode = colorScheme === 'dark';

  const theme = {
    barBackground: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    buttonBackground: isDarkMode ? '#333333' : '#E0E0E0',
    iconColor: isDarkMode ? '#FFFFFF' : '#000000',
    toggleButtonBackground: isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(245, 245, 245, 0.8)',
  };

  // Safely render Ionicons
  const renderIcon = (iconName, size, color) => {
    const name = iconMap[iconName] || iconName;
    return (
      <Ionicons
        name={name}
        size={size}
        color={color}
      />
    );
  };

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  };

  const getDomainFromUrl = (url) => {
    const matches = url.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
    return matches && matches[1];
  };

  const handleShouldStartLoadWithRequest = useCallback((event) => {
    const domain = getDomainFromUrl(event.url);
    if (domain && domain.toLowerCase() !== HOME_DOMAIN) {
      Linking.openURL(event.url);
      return false;
    }
    return true;
  }, []);

  const goBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  const goHome = () => {
    if (webViewRef.current) {
      setCurrentUrl(HOME_URL);
      webViewRef.current.reload();
    }
  };

  const barAnimation = useRef(new Animated.Value(0)).current;

  const toggleBar = () => {
    const newIsBarVisible = !isBarVisible;
    setIsBarVisible(newIsBarVisible);
    
    Animated.spring(barAnimation, {
      toValue: newIsBarVisible ? 1 : 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      setOrientation(event.orientationInfo.orientation);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return goBack();
      });

      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const isLandscape = orientation === 'LANDSCAPE_LEFT' || orientation === 'LANDSCAPE_RIGHT';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    statusBarPlaceholder: {
      height: Constants.statusBarHeight,
    },
    webview: {
      flex: 1,
    },
    bottomBar: {
      flexDirection: isLandscape ? 'column' : 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    button: {
      borderRadius: 30,
      padding: 16,
      margin: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    toggleButton: {
      position: 'absolute',
      right: 20,
      borderRadius: 30,
      padding: 16,
      zIndex: 1000,
    },
  });

  const barTranslateY = barAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  const barScale = barAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const toggleButtonTranslateY = barAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });

  return (
    <View style={styles.container}>
      <View style={styles.statusBarPlaceholder} />
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
      />
      <Animated.View style={[
        styles.bottomBar,
        { 
          transform: [
            { translateY: barTranslateY },
            { scale: barScale }
          ],
          backgroundColor: theme.barBackground 
        }
      ]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBackground }]}
          onPress={goBack}
          disabled={!canGoBack}
        >
          {renderIcon('back', 28, canGoBack ? theme.iconColor : theme.iconColor + '66')}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBackground }]}
          onPress={goHome}
        >
          {renderIcon('home', 28, theme.iconColor)}
        </TouchableOpacity>
      </Animated.View>
      <Animated.View style={[
        styles.toggleButton,
        { 
          transform: [{ translateY: toggleButtonTranslateY }],
          backgroundColor: theme.toggleButtonBackground,
          bottom: 20,
        }
      ]}>
        <TouchableOpacity onPress={toggleBar}>
          {renderIcon(isBarVisible ? "down" : "up", 34, theme.iconColor)}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
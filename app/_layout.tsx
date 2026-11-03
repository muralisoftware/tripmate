import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../src/constants/colors';

// Keep native splash screen visible while JS loads
SplashScreen.preventAutoHideAsync().catch(() => {});

const { width } = Dimensions.get('window');

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance animation (scale up & fade in logo)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Hide native splash screen immediately so our custom branded splash is visible
    SplashScreen.hideAsync().catch(() => {});

    // 3. Keep branded splash screen visible for 1.8s then smoothly fade out
    const timer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trip/create" options={{ headerShown: false }} />
        <Stack.Screen name="trip/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="trip/itinerary" options={{ headerShown: false }} />
        <Stack.Screen name="trip/destinations" options={{ headerShown: false }} />
        <Stack.Screen name="trip/packing" options={{ headerShown: false }} />
        <Stack.Screen name="trip/notes" options={{ headerShown: false }} />
        <Stack.Screen name="trip/group-expenses" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      </Stack>

      {/* Branded In-App Splash Screen Overlay */}
      {showSplash && (
        <Animated.View
          style={[
            styles.splashContainer,
            { opacity: containerOpacity },
          ]}
          pointerEvents={showSplash ? 'auto' : 'none'}
        >
          <View style={styles.splashContent}>
            {/* Animated Logo Container with Glow */}
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.logoHalo} />
              <Image
                source={require('../assets/images/app-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* App Brand Title */}
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
              <Text style={styles.appTitle}>TripMate</Text>
              <Text style={styles.appTagline}>
                Smart Travel & Group Expense Manager
              </Text>

              {/* Minimal Loading Indicator */}
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Starting your journey...</Text>
              </View>
            </Animated.View>
          </View>

          {/* Bottom Version & Offline Badge */}
          <View style={styles.splashFooter}>
            <View style={styles.footerBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.footerText}>100% Offline & Private</Text>
            </View>
            <Text style={styles.versionText}>TripMate v1.0.0</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 99999,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  logoHalo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E6F5EC',
    opacity: 0.7,
  },
  logoImage: {
    width: 124,
    height: 124,
    borderRadius: 62,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 14,
    color: COLORS.secondaryText,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1FBF5',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  splashFooter: {
    alignItems: 'center',
    gap: 6,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '400',
  },
});

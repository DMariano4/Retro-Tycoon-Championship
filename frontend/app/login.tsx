import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const { login, isLoading, user } = useAuth();

  React.useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    await login();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#00ff88" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="cloud" size={64} color="#4a9eff" />
          <Text style={styles.title}>CLOUD SAVES</Text>
          <Text style={styles.subtitle}>Sign in to sync your progress across devices</Text>
        </View>

        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Ionicons name="sync" size={20} color="#00ff88" />
            <Text style={styles.benefitText}>Sync saves across all devices</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={20} color="#00ff88" />
            <Text style={styles.benefitText}>Never lose your progress</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="phone-portrait" size={20} color="#00ff88" />
            <Text style={styles.benefitText}>Play anywhere, anytime</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color="#fff" />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          You can still play without signing in.{"\n"}
          Local saves will be stored on this device.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  backButton: {
    padding: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6a8aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  benefits: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  benefitText: {
    color: '#9ab8d8',
    fontSize: 14,
    flex: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    color: '#4a6a8a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});

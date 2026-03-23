/**
 * Shared API utilities for Retro Championship Tycoon
 * Centralizes backend URL resolution used across the app.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getBackendUrl = () => {
  const envUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                 process.env.EXPO_PUBLIC_BACKEND_URL || '';
  // For web, check if we're on localhost (dev) or preview (prod)
  if (Platform?.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If on localhost, call backend directly
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8001';
    }
    // If on preview domain, use relative URLs (ingress handles routing)
    return '';
  }
  return envUrl;
};

export const BACKEND_URL = getBackendUrl();

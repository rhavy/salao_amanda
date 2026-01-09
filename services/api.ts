import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (__DEV__) {
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
            const ip = hostUri.split(':')[0];
            return `http://${ip}:3000`;
        }
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

export const BASE_URL = getBaseUrl();
const AUTH_KEY = '@salao_amanda:auth';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    try {
        // Busca o token de autenticação no AsyncStorage
        const authDataString = await AsyncStorage.getItem(AUTH_KEY);
        const headers = new Headers({
            'Content-Type': 'application/json',
            ...options.headers as HeadersInit,
        });

        if (authDataString) {
            const { token } = JSON.parse(authDataString);
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            // Prioriza `error` (comum no backend) ou `message`, senão usa texto genérico
            const errorMessage = data.error || data.message || `Erro ${response.status}: Falha na requisição`;
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
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
            throw new Error(data.message || 'Erro na requisição');
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

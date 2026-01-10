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

export async function getFinanceData(month: number, year: number) {
    return fetchAPI(`/finance?month=${month}&year=${year}`);
}

export async function getAppointments() {
    return fetchAPI('/appointments');
}

export async function updateAppointmentStatus(id: string, status: string) {
    return fetchAPI(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function deleteAppointment(id: string) {
    return fetchAPI(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'apagado' }),
    });
}

export interface Category {
    id: number;
    name: string;
}

export async function getCategories(): Promise<Category[]> {
    return fetchAPI('/categories');
}

export async function getServices() {
    return fetchAPI('/services', {
        method: 'GET',
    });
}

// For services
export async function addService(name: string, duration: number, price: number, category_id: number) {
    return fetchAPI('/services', {
        method: 'POST',
        body: JSON.stringify({
            name,
            duration: Number(duration),
            price: Number(price),
            category_id
        }),
    });
}

export async function updateService(id: string, name: string, duration: number, price: number, category_id: number) {
    return fetchAPI(`/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, duration, price, category_id }),
    });
}

export async function deleteService(id: string) {
    return fetchAPI(`/services/${id}`, {
        method: 'DELETE',
    });
}

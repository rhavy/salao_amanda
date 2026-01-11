import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { UserProfile } from '@/constants/types'; // Import UserProfile

interface User extends UserProfile { // Estende UserProfile
    id?: string;
    // Removendo campos duplicados que já estão em UserProfile
    // email: string;
    // name: string;
    // avatar?: string;
    gender?: 'Masculino' | 'Feminino' | 'Outro';
    // appointmentsCount?: number;
    // memberSince?: string;
}

interface AuthData {
    user: User | null;
    token: string | null;
}

const AUTH_KEY = '@salao_amanda:auth';

export default function useAuth() {
    const [authData, setAuthData] = useState<AuthData>({ user: null, token: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAuthData();
    }, []);

    const loadAuthData = async () => {
        try {
            const authDataString = await AsyncStorage.getItem(AUTH_KEY);
            if (authDataString) {
                const data = JSON.parse(authDataString);
                setAuthData(data);
            }
        } catch (error) {
            console.error('Erro ao carregar dados de autenticação:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveAuthData = async ({ user, token }: AuthData) => {
        try {
            const data = { user, token };
            await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
            setAuthData(data);
        } catch (error) {
            console.error('Erro ao salvar dados de autenticação:', error);
        }
    };

    const logout = async () => {
        try {
            console.log('Attempting logout (loja): Clearing AsyncStorage and state...');
            await AsyncStorage.removeItem(AUTH_KEY);
            setAuthData({ user: null, token: null });
            console.log('Logout successful (loja): AsyncStorage cleared, state reset.');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    return {
        user: authData.user,
        token: authData.token,
        loading,
        saveUser: saveAuthData, // Renomeado para manter consistência
        logout,
    };
}

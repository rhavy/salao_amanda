import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface User {
    id?: string;
    email: string;
    name: string;
    avatar?: string;
    gender?: 'Masculino' | 'Feminino' | 'Outro';
    // Propriedades da UserProfile agora fazem parte do User
    appointmentsCount?: number;
    memberSince?: string;
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
            await AsyncStorage.removeItem(AUTH_KEY);
            setAuthData({ user: null, token: null });
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

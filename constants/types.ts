export interface UserProfile {
    name: string;
    email: string;
    avatar?: string;
    memberSince?: string;
    phone?: string;
    cpf?: string;
    birthDate?: string;
    appointmentsCount?: number;
    notifications_reminders?: boolean;
    notifications_marketing?: boolean;
    privacy_use_photos?: boolean;
}

export interface Appointment {
    id: string;
    serviceName: string;
    date: string;
    time: string;
    status: 'confirmado' | 'pendente' | 'concluido';
    price: number;
    user_email: string;
}

export interface Service {
    id: string;
    name: string;
    category: string;
    price: number;
    duration: number;
    image: string;
}

export interface Message {
    id: number;
    user_email: string;
    sender: 'user' | 'admin';
    content: string;
    created_at: string;
}

export interface Service {
    id: string;
    name: string;
    price: number;
    duration: number; // em minutos
    category: string;
}

export interface Appointment {
    id: string;
    serviceName: string;
    date: string;
    time: string;
    status: 'confirmado' | 'pendente' | 'concluido';
    price: number;
}

export interface UserProfile {
    name: string;
    email: string;
    avatar?: string;
    appointmentsCount: number;
    memberSince: string;
}

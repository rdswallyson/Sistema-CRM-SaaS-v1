import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value, currency = 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
    }).format(value);
}

export function formatDate(date, options = {}) {
    const defaultOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options,
    };
    return new Date(date).toLocaleDateString('pt-BR', defaultOptions);
}

export function formatDateTime(date) {
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getInitials(name) {
    if (!name) return '';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function truncate(str, length = 50) {
    if (!str) return '';
    return str.length > length ? `${str.slice(0, length)}...` : str;
}

export const memberStatusLabels = {
    visitor: 'Visitante',
    new_convert: 'Novo Convertido',
    member: 'Membro',
    leader: 'Líder',
};

export const memberStatusColors = {
    visitor: 'bg-yellow-100 text-yellow-800',
    new_convert: 'bg-blue-100 text-blue-800',
    member: 'bg-green-100 text-green-800',
    leader: 'bg-purple-100 text-purple-800',
};

export const donationTypeLabels = {
    tithe: 'Dízimo',
    offering: 'Oferta',
    special: 'Especial',
    recurring: 'Recorrente',
};

export const donationTypeColors = {
    tithe: 'bg-emerald-100 text-emerald-800',
    offering: 'bg-blue-100 text-blue-800',
    special: 'bg-purple-100 text-purple-800',
    recurring: 'bg-amber-100 text-amber-800',
};

export const planTypeLabels = {
    essential: 'Essencial',
    strategic: 'Estratégico',
    apostolic: 'Apostólico',
    enterprise: 'Enterprise',
};

export const roleLabels = {
    super_admin: 'Super Admin',
    admin_church: 'Admin Igreja',
    treasurer: 'Tesoureiro',
    ministry_leader: 'Líder de Ministério',
    secretary: 'Secretaria',
    member: 'Membro',
    visitor: 'Visitante',
};

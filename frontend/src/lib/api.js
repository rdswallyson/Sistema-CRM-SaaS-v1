import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
};

// Super Admin API
export const adminAPI = {
    // Tenants
    getTenants: () => api.get('/admin/tenants'),
    getTenant: (id) => api.get(`/admin/tenants/${id}`),
    createTenant: (data) => api.post('/admin/tenants', data),
    updateTenant: (id, data) => api.put(`/admin/tenants/${id}`, data),
    deleteTenant: (id) => api.delete(`/admin/tenants/${id}`),
    
    // Plans
    getPlans: () => api.get('/admin/plans'),
    createPlan: (data) => api.post('/admin/plans', data),
    
    // Promotions
    getPromotions: () => api.get('/admin/promotions'),
    createPromotion: (data) => api.post('/admin/promotions', data),
    
    // Metrics
    getMetrics: () => api.get('/admin/metrics'),
};

// Church API
export const churchAPI = {
    // Dashboard
    getDashboard: () => api.get('/church/dashboard'),
    
    // Members
    getMembers: () => api.get('/church/members'),
    getMember: (id) => api.get(`/church/members/${id}`),
    createMember: (data) => api.post('/church/members', data),
    updateMember: (id, data) => api.put(`/church/members/${id}`, data),
    deleteMember: (id) => api.delete(`/church/members/${id}`),
    
    // Ministries
    getMinistries: () => api.get('/church/ministries'),
    createMinistry: (data) => api.post('/church/ministries', data),
    updateMinistry: (id, data) => api.put(`/church/ministries/${id}`, data),
    deleteMinistry: (id) => api.delete(`/church/ministries/${id}`),
    
    // Events
    getEvents: () => api.get('/church/events'),
    getEvent: (id) => api.get(`/church/events/${id}`),
    createEvent: (data) => api.post('/church/events', data),
    eventCheckin: (eventId, memberId) => api.post(`/church/events/${eventId}/checkin?member_id=${memberId}`),
    
    // Donations
    getDonations: () => api.get('/church/donations'),
    createDonation: (data) => api.post('/church/donations', data),
    getFinancialSummary: () => api.get('/church/financial/summary'),
    
    // Communication
    sendCommunication: (channel, recipientIds, message, subject) => 
        api.post('/church/communication/send', null, { 
            params: { channel, recipient_ids: recipientIds, message, subject } 
        }),
    getCommunicationHistory: () => api.get('/church/communication/history'),
};

// Public API
export const publicAPI = {
    getPlans: () => api.get('/plans'),
    seedSuperAdmin: () => api.post('/seed/super-admin'),
    seedPlans: () => api.post('/seed/plans'),
};

// Payments API
export const paymentsAPI = {
    createCheckout: (planType, billingCycle) => 
        api.post('/payments/checkout', null, { 
            params: { plan_type: planType, billing_cycle: billingCycle },
            headers: { origin: window.location.origin }
        }),
    getPaymentStatus: (sessionId) => api.get(`/payments/status/${sessionId}`),
};

export default api;
